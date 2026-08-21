"use strict";

process.env.NODE_ENV = "test";

jest.mock("../../src/loggers/myLogger.log", () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const DiscountService = require("../../src/services/discount.service");
const discountModel = require("../../src/model/discount.model");

let mongoServer;

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
});

const shopId = new mongoose.Types.ObjectId();

const createDiscount = (overrides = {}) =>
  discountModel.create({
    discount_name: "Test Discount",
    discount_description: "desc",
    discount_type: "fixed_amount",
    discount_value: 10000,
    discount_max_value: 10000,
    discount_code: "TESTCODE",
    discount_start_date: new Date(Date.now() - 1000),
    discount_end_date: new Date(Date.now() + 1000 * 60 * 60),
    discount_max_uses: 10,
    discount_uses_count: 0,
    discount_users_count: [],
    discount_max_uses_per_users: 0,
    discount_is_active: true,
    discount_applies_to: "all",
    discount_shopId: shopId,
    ...overrides,
  });

describe("DiscountService.releaseDiscountUsage", () => {
  test("releasing one order's usage removes only that user's matching entry, keeping counters in sync", async () => {
    const discount = await createDiscount({ discount_max_uses_per_users: 2 });

    await DiscountService.recordDiscountUsage({
      codeId: discount.discount_code,
      shopId,
      userId: "user-1",
    });
    await DiscountService.recordDiscountUsage({
      codeId: discount.discount_code,
      shopId,
      userId: "user-1",
    });

    let current = await discountModel.findById(discount._id).lean();
    expect(current.discount_uses_count).toBe(2);
    expect(current.discount_users_count).toHaveLength(2);

    await DiscountService.releaseDiscountUsage({
      codeId: discount.discount_code,
      shopId,
      userId: "user-1",
    });

    current = await discountModel.findById(discount._id).lean();
    expect(current.discount_uses_count).toBe(1);
    expect(current.discount_users_count).toHaveLength(1);
    expect(String(current.discount_users_count[0].userId)).toBe("user-1");
  });
});

describe("DiscountService.recordDiscountUsage concurrency", () => {
  test("does not exceed discount_max_uses under concurrent requests", async () => {
    const discount = await createDiscount({ discount_max_uses: 1 });

    const results = await Promise.allSettled([
      DiscountService.recordDiscountUsage({
        codeId: discount.discount_code,
        shopId,
        userId: "user-a",
      }),
      DiscountService.recordDiscountUsage({
        codeId: discount.discount_code,
        shopId,
        userId: "user-b",
      }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);

    const current = await discountModel.findById(discount._id).lean();
    expect(current.discount_uses_count).toBe(1);
  });

  test("does not exceed discount_max_uses_per_users under concurrent requests from the same user", async () => {
    const discount = await createDiscount({
      discount_max_uses: 10,
      discount_max_uses_per_users: 1,
    });

    const results = await Promise.allSettled([
      DiscountService.recordDiscountUsage({
        codeId: discount.discount_code,
        shopId,
        userId: "user-a",
      }),
      DiscountService.recordDiscountUsage({
        codeId: discount.discount_code,
        shopId,
        userId: "user-a",
      }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);

    const current = await discountModel.findById(discount._id).lean();
    expect(current.discount_uses_count).toBe(1);
    expect(current.discount_users_count).toHaveLength(1);
  });
});
