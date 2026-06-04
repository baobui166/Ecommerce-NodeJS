"use strict";

process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.RABBITMQ_URL = "amqp://localhost";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.AI_API_KEY = "";

jest.mock("../../src/services/eventBus.service", () => ({
  publishEvent: jest.fn().mockResolvedValue({ eventId: "test-event" }),
  closeEventBus: jest.fn().mockResolvedValue(undefined),
  EVENT_QUEUE: "ecommerce.events",
}));

jest.mock("../../src/services/email.service", () => ({
  sendEmailToken: jest.fn().mockResolvedValue({
    devToken: "123456",
    expiresInSeconds: 900,
  }),
}));

jest.mock("../../src/loggers/myLogger.log", () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../../src/app");
const ApiKeyModel = require("../../src/model/apiKey.model");
const ShopModel = require("../../src/model/shop.model");
const UserModel = require("../../src/model/user.model");

const API_KEY = "test-api-key";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin123456";
const USER_EMAIL = "customer@example.com";
const USER_PASSWORD = "User123456";

let mongoServer;

const withApiKey = (req) => req.set("x-api-key", API_KEY);

const authHeaders = ({ token, clientId, kind }) => ({
  "x-api-key": API_KEY,
  Authorization: `Bearer ${token}`,
  "x-client-id": String(clientId),
  "x-auth-kind": kind,
});

const seedApiKey = async () => {
  await ApiKeyModel.create({
    key: API_KEY,
    status: true,
    permissions: ["0000"],
  });
};

const seedAdminShop = async () =>
  ShopModel.create({
    name: "Test Admin Shop",
    email: ADMIN_EMAIL,
    password: await bcrypt.hash(ADMIN_PASSWORD, 10),
    status: "active",
    verify: true,
    roles: ["SHOP", "ADMIN"],
  });

const loginAdmin = async () => {
  await seedAdminShop();
  const response = await withApiKey(
    request(app)
      .post("/v1/api/shop/login")
      .set("x-auth-kind", "admin")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  ).expect(200);

  return {
    shop: response.body.metadata.shop,
    accessToken: response.body.metadata.tokens.accessToken,
  };
};

const registerActiveUser = async () => {
  const registerResponse = await withApiKey(
    request(app)
      .post("/v1/api/user/register")
      .send({ email: USER_EMAIL, password: USER_PASSWORD }),
  ).expect(200);

  await UserModel.updateOne(
    { user_email: USER_EMAIL },
    { $set: { user_status: "active", user_emailVerified: true } },
  );

  const loginResponse = await withApiKey(
    request(app)
      .post("/v1/api/user/login")
      .set("x-auth-kind", "user")
      .send({ email: USER_EMAIL, password: USER_PASSWORD }),
  ).expect(200);

  return {
    user: loginResponse.body.metadata.user,
    accessToken: loginResponse.body.metadata.tokens.accessToken,
    registerCookie: registerResponse.headers["set-cookie"],
    loginCookie: loginResponse.headers["set-cookie"],
  };
};

const createAndPublishProduct = async ({ adminToken, shopId }) => {
  const productPayload = {
    product_name: "Integration Test Chair",
    product_thumb: "https://example.com/chair.jpg",
    product_images: ["https://example.com/chair-side.jpg"],
    product_descriptions: "Comfortable chair for integration tests",
    product_price: 2500000,
    product_quantity: 10,
    product_type: "Furniture",
    product_attributes: {
      manufacture: "ShopPro",
      model: "IT-CHAIR",
      color: "black",
    },
  };

  const createResponse = await request(app)
    .post("/v1/api/product")
    .set(authHeaders({ token: adminToken, clientId: shopId, kind: "admin" }))
    .send(productPayload)
    .expect(200);

  const product = createResponse.body.metadata;

  await request(app)
    .post(`/v1/api/product/publish/${product._id}`)
    .set(authHeaders({ token: adminToken, clientId: shopId, kind: "admin" }))
    .expect(200);

  return product;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  await seedApiKey();
});

describe("API key middleware", () => {
  test("serves health endpoint without API key", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      service: "server-backend-ecommerce",
    });
  });

  test("blocks requests without a valid API key", async () => {
    await request(app).get("/v1/api/product").expect(403);

    await request(app)
      .get("/v1/api/product")
      .set("x-api-key", "wrong-key")
      .expect(403);
  });

  test("allows public product list with a valid API key", async () => {
    const response = await withApiKey(request(app).get("/v1/api/product")).expect(200);

    expect(response.body).toMatchObject({
      status: 200,
      message: expect.any(String),
    });
    expect(response.body.metadata).toHaveProperty("products");
  });
});

describe("Customer auth", () => {
  test("registers, logs in, and refreshes access token using refresh cookie", async () => {
    const { registerCookie, loginCookie } = await registerActiveUser();

    expect(registerCookie?.join(" ")).toContain("userRefreshToken=");
    expect(loginCookie?.join(" ")).toContain("userRefreshToken=");

    const refreshResponse = await request(app)
      .post("/v1/api/shop/handlerRefreshToken")
      .set("x-api-key", API_KEY)
      .set("x-auth-kind", "user")
      .set("Cookie", loginCookie)
      .expect(200);

    expect(refreshResponse.body.metadata.tokens.accessToken).toEqual(expect.any(String));
  });
});

describe("Admin product flow", () => {
  test("admin creates and publishes a product visible to public catalog/detail", async () => {
    const admin = await loginAdmin();
    const product = await createAndPublishProduct({
      adminToken: admin.accessToken,
      shopId: admin.shop._id,
    });

    const listResponse = await withApiKey(
      request(app).get("/v1/api/product").query({ search: "Integration Test Chair" }),
    ).expect(200);

    expect(listResponse.body.metadata.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: String(product._id),
          product_name: "Integration Test Chair",
          isPublish: true,
        }),
      ]),
    );

    const detailResponse = await withApiKey(
      request(app).get(`/v1/api/product/${product._id}`),
    ).expect(200);

    expect(detailResponse.body.metadata).toMatchObject({
      _id: String(product._id),
      product_name: "Integration Test Chair",
      isPublish: true,
    });
  });
});

describe("Cart, checkout, and admin order status", () => {
  test("user adds product to cart, places order, and admin updates order status", async () => {
    const admin = await loginAdmin();
    const product = await createAndPublishProduct({
      adminToken: admin.accessToken,
      shopId: admin.shop._id,
    });
    const user = await registerActiveUser();
    const userHeaders = authHeaders({
      token: user.accessToken,
      clientId: user.user._id,
      kind: "user",
    });

    const cartResponse = await request(app)
      .post("/v1/api/cart")
      .set(userHeaders)
      .send({
        product: {
          productId: String(product._id),
          shopId: String(admin.shop._id),
          quantity: 1,
          price: product.product_price,
        },
      })
      .expect(200);

    const cartId = cartResponse.body.metadata._id;
    const checkoutPayload = {
      cartId,
      shop_order_ids: [
        {
          shopId: String(admin.shop._id),
          shop_discounts: [],
          item_products: [
            {
              productId: String(product._id),
              quantity: 1,
              price: product.product_price,
            },
          ],
        },
      ],
      user_address: {
        fullName: "Customer Test",
        phone: "0900000000",
        addressLine: "123 Test Street",
        city: "Ho Chi Minh",
        shippingMethodId: "standard",
      },
      user_payment: {
        method: "COD",
      },
    };

    const reviewResponse = await request(app)
      .post("/v1/api/checkout/review")
      .set(userHeaders)
      .send(checkoutPayload)
      .expect(200);

    expect(reviewResponse.body.metadata.checkout_order.totalCheckout).toBeGreaterThan(0);

    const orderResponse = await request(app)
      .post("/v1/api/checkout/order")
      .set(userHeaders)
      .send(checkoutPayload)
      .expect(200);

    const orderId = orderResponse.body.metadata._id;
    expect(orderResponse.body.metadata.order_status).toBe("pending");
    expect(orderResponse.body.metadata.order_statusHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "pending",
          changedByType: "user",
          note: "Order placed by customer",
        }),
      ]),
    );

    const statusResponse = await request(app)
      .patch(`/v1/api/order/${orderId}/status`)
      .set(authHeaders({ token: admin.accessToken, clientId: admin.shop._id, kind: "admin" }))
      .send({ order_status: "confirmed", note: "Confirmed by integration test" })
      .expect(200);

    expect(statusResponse.body).toMatchObject({
      status: 200,
      metadata: {
        _id: orderId,
        order_status: "confirmed",
      },
    });
    expect(statusResponse.body.metadata.order_statusHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "confirmed",
          changedByType: "shop",
          note: "Confirmed by integration test",
        }),
      ]),
    );
  });
});
