"use strict";

const mongoose = require("mongoose");
const { BadRequestError } = require("../core/error.response");
const cartModel = require("../model/cart.model");
const orderModel = require("../model/order.model");
const { product: productModel } = require("../model/product.model");
const { findCartById } = require("../model/repositories/cart.repo");
const {
  findAllOrderByUserId,
  findOneOrderByOrderId,
  cancelOrderStatusByUser,
  changeOrderStatusByAdmin,
} = require("../model/repositories/order.repo");
const { checkProductByServer } = require("../model/repositories/product.repo");
const DiscountService = require("./discount.service");
const { publishEvent } = require("./eventBus.service");
const ShopService = require("./shop.service");
const { notifyLowStockIfNeeded } = require("./stockAlert.service");

const toSafeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
};

const resolveShippingMethod = async ({ subtotal, requestedMethodId }) => {
  const settings = await ShopService.getPublicSettings();
  const methodId = String(requestedMethodId || "standard").toLowerCase();
  const standardFee = toSafeNumber(settings.shipping_standard_fee, 30000);
  const expressFee = toSafeNumber(settings.shipping_express_fee, 60000);
  const expressMinOrder = toSafeNumber(settings.shipping_express_min_order, 200000);
  const freeThreshold = toSafeNumber(settings.free_shipping_threshold, 0);

  if (
    methodId === "free" &&
    settings.shipping_free_enabled &&
    freeThreshold > 0 &&
    subtotal >= freeThreshold
  ) {
    return { id: "free", label: "Free Shipping", fee: 0 };
  }

  if (methodId === "express" && subtotal >= expressMinOrder) {
    return { id: "express", label: "Express Delivery", fee: expressFee };
  }

  return { id: "standard", label: "Standard Delivery", fee: standardFee };
};

const isTransactionUnsupportedError = (error) =>
  /Transaction numbers are only allowed|replica set member|mongos/i.test(
    String(error?.message || ""),
  );

const runWithOptionalTransaction = async (work) => {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupportedError(error)) {
      return await work(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const aggregateProductQuantities = (orders) => {
  const quantities = new Map();

  for (const order of orders) {
    for (const item of order.item_products || []) {
      const productId = String(item.productId);
      const quantity = Number(item.quantity || 0);
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }
  }

  return [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

const decrementProductInventory = async ({ orderItems, session }) => {
  const inventoryItems = aggregateProductQuantities(orderItems);

  for (const item of inventoryItems) {
    const updated = await productModel.findOneAndUpdate(
      {
        _id: item.productId,
        isDeleted: { $ne: true },
        isPublish: true,
        product_quantity: { $gte: item.quantity },
      },
      {
        $inc: {
          product_quantity: -item.quantity,
          product_sold: item.quantity,
        },
      },
      { new: true, ...(session ? { session } : {}) },
    );

    if (!updated) {
      throw new BadRequestError(
        "Some products are out of stock. Please review your cart.",
      );
    }

    notifyLowStockIfNeeded(updated);
  }
};

// Gives back stock taken by decrementProductInventory when an order is
// cancelled after being placed. No $gte guard needed since we're adding back.
const restoreProductInventory = async ({ orderItems, session }) => {
  const inventoryItems = aggregateProductQuantities(orderItems);

  for (const item of inventoryItems) {
    await productModel.updateOne(
      { _id: item.productId },
      {
        $inc: {
          product_quantity: item.quantity,
          product_sold: -item.quantity,
        },
      },
      session ? { session } : undefined,
    );
  }
};

// Releases the usage slot(s) recordDiscountUsage consumed for this order, so
// a cancelled order doesn't permanently count against the code's limits.
const releaseDiscountUsageForOrder = async (order) => {
  if (!order) return;

  for (const shopOrder of order.order_products || []) {
    const discountEntry = shopOrder.shop_discounts?.[0];
    if (!discountEntry?.codeId) continue;

    await DiscountService.releaseDiscountUsage({
      codeId: discountEntry.codeId,
      shopId: shopOrder.shopId,
      userId: String(order.order_userId),
    }).catch(() => {});
  }
};

class CheckoutService {
  /*
	  {
		  cardId,
		  userId,
		  shop_order_ids: [
			  {
				  shopId,
				  shop_discounts: [
					  {
						  shopId,
						  discountId,
						  codeId
					  }
				  ],
				  item_produts: [
					  {
						  price,
						  quantity,
						  productId
					  },
					  {
						  price,
						  quantity,
						  productId
					  }
				  ]
			  }
		  ]
	  }
	  */
  static async checkoutReview({ cartId, userId, shop_order_ids }) {
    if (!cartId) {
      const activeCart = await cartModel.cart
        .findOne({ cart_userId: userId, cart_state: "active" })
        .lean();
      cartId = activeCart?._id;
    }
    if (!cartId) throw new BadRequestError("Cart does not exists!");

    // check cartId ton tai khong
    const foundCart = await findCartById(cartId);
    if (!foundCart) throw new BadRequestError("Cart does not exists!");

    const checkout_order = {
        totalPrice: 0, // tong tien hang
        feeShip: 0, // phi ship
        totalDiscount: 0,
        totalCheckout: 0, // tong thanh toan
      },
      shop_order_ids_new = [];

    for (let i = 0; i < shop_order_ids.length; i++) {
      const {
        shopId,
        shop_discounts = [],
        item_products = [],
      } = shop_order_ids[i];

      // check product available
      const checkProductServer = await checkProductByServer(item_products);
      if (
        !checkProductServer ||
        checkProductServer.length === 0 ||
        checkProductServer.length !== item_products.length
      )
        throw new BadRequestError("Order wrong!!!");

      // tong tien don hang
      const checkoutPrice = checkProductServer.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);

      // tong tien khi xu ly
      checkout_order.totalPrice += checkoutPrice;

      const itemCheckout = {
        shopId,
        shop_discounts,
        priceRaw: checkoutPrice, // tien trc khi giam gias
        priceApplyDiscount: checkoutPrice,
        item_products: checkProductServer,
      };

      // neu shop_discount co ton tai > 0 thi check xem, co hop le hay khong
      if (shop_discounts.length > 0) {
        // gia su co 1 discount
        // check discount
        const { totalPrice = 0, discount = 0 } = await DiscountService.getDiscountAmount({
          codeId: shop_discounts[0].codeId,
          userId,
          shopId,
          products: checkProductServer,
        });
        // tong cong discount giam gia
        checkout_order.totalDiscount += discount;

        // neu so tien giam gia lon hon 0
        if (discount > 0) {
          itemCheckout.priceApplyDiscount = checkoutPrice - discount;
        }
      }

      // thanh toan cuoi cung
      checkout_order.totalCheckout += itemCheckout.priceApplyDiscount;
      shop_order_ids_new.push(itemCheckout);
    }

    return { shop_order_ids, shop_order_ids_new, checkout_order };
  }

  // order
  static async orderByUser({
    shop_order_ids,
    cartId,
    userId,
    user_address = {},
    user_payment = {},
  }) {
    const { shop_order_ids_new, checkout_order } =
      await CheckoutService.checkoutReview({
        cartId,
        userId,
        shop_order_ids: shop_order_ids,
      });
    const shippingMethod = await resolveShippingMethod({
      subtotal: checkout_order.totalCheckout,
      requestedMethodId: user_address.shippingMethodId,
    });
    checkout_order.feeShip = shippingMethod.fee;
    checkout_order.totalCheckout += shippingMethod.fee;
    const normalizedShippingAddress = {
      ...user_address,
      shippingMethodId: shippingMethod.id,
      shippingMethodLabel: shippingMethod.label,
      shippingFee: shippingMethod.fee,
    };

    const newOrder = await runWithOptionalTransaction(async (session) => {
      await decrementProductInventory({
        orderItems: shop_order_ids_new,
        session,
      });

      for (const shopOrder of shop_order_ids_new) {
        const discountEntry = shopOrder.shop_discounts?.[0];
        if (discountEntry?.codeId) {
          await DiscountService.recordDiscountUsage({
            codeId: discountEntry.codeId,
            shopId: shopOrder.shopId,
            userId,
            session,
          });
        }
      }

      const orderPayload = {
        order_userId: userId,
        order_shopId: shop_order_ids_new[0]?.shopId,
        order_checkout: checkout_order,
        order_shipping: normalizedShippingAddress,
        order_payment: {
          method: user_payment.method || "COD",
          status: user_payment.method === "ONLINE_MOCK" ? "paid_mock" : "pending",
          ...user_payment,
        },
        order_products: shop_order_ids_new,
        order_trackingNumber: `ORD-${Date.now()}`,
        order_statusHistory: [
          {
            status: "pending",
            changedBy: userId,
            changedByType: "user",
            note: "Order placed by customer",
            changedAt: new Date(),
          },
        ],
      };

      const createdOrder = session
        ? (await orderModel.create([orderPayload], { session }))[0]
        : await orderModel.create(orderPayload);

      const productIdsToRemove = shop_order_ids_new.flatMap((order) =>
        order.item_products.map((item) => item.productId),
      );

      await cartModel.cart.updateOne(
        { _id: cartId },
        {
          $pull: {
            cart_products: { productId: { $in: productIdsToRemove } },
          },
        },
        session ? { session } : undefined,
      );

      const updatedCartQuery = cartModel.cart.findById(cartId);
      if (session) updatedCartQuery.session(session);
      const updatedCart = await updatedCartQuery;
      if (updatedCart) {
        updatedCart.cart_count_product = updatedCart.cart_products.length;
        await updatedCart.save(session ? { session } : undefined);
      }

      return createdOrder;
    });

    // truong hop: neu thanh cong, thi remove product co trong gio hang
    if (newOrder) {
      publishEvent({
        type: "order.created",
        userId,
        orderId: newOrder._id,
        metadata: {
          totalCheckout: checkout_order.totalCheckout,
          paymentMethod: newOrder.order_payment.method,
        },
      }).catch(() => {});
    }
    return newOrder;
  }

  /*  
    1. query order [User]
  
  */

  static async getOrderByUser({ userId }) {
    return await findAllOrderByUserId(userId);
  }

  /*    
    2. query one order using ID [User]
  
  */

  static async getOneOrderByUser({ userId, orderId }) {
    const foundOrder = await findOneOrderByOrderId(orderId, userId);
    if (!foundOrder) throw new BadRequestError("Order does not exists");

    return foundOrder;
  }

  /*  
    1. cancel order [User]
  */

  static async cancelOrderByUser({ userId, orderId, status = "cancelled", note = "" }) {
    const foundOrder = await findOneOrderByOrderId(orderId, userId);
    if (!foundOrder) throw new BadRequestError("Order does not exists");

    const updated = await cancelOrderStatusByUser(
      userId,
      orderId,
      status,
      note || "Order cancelled by customer",
    );
    if (updated) {
      // cancelOrderStatusByUser only succeeds from "pending", so this is
      // always a fresh cancellation — safe to restore unconditionally.
      if (updated.order_status === "cancelled") {
        await restoreProductInventory({ orderItems: foundOrder.order_products || [] });
        await releaseDiscountUsageForOrder(foundOrder);
      }

      publishEvent({
        type: "order.status_changed",
        userId: updated.order_userId,
        orderId: updated._id,
        metadata: { status: updated.order_status },
      }).catch(() => {});
    }

    return updated;
  }

  /*
    1. updating Order status [Shop | Admin]
  */

  static async updateOrderStatusByShop({ orderId, status, shopId, note = "" }) {
    const foundOrder = await findOneOrderByOrderId(orderId);
    if (!foundOrder) throw new BadRequestError("Order does not exists");

    const updated = await changeOrderStatusByAdmin(orderId, status, shopId, note);
    if (updated) {
      if (status === "cancelled" && foundOrder.order_status !== "cancelled") {
        await restoreProductInventory({ orderItems: foundOrder.order_products || [] });
        await releaseDiscountUsageForOrder(foundOrder);
      }

      publishEvent({
        type: "order.status_changed",
        userId: updated.order_userId,
        orderId: updated._id,
        metadata: { status: updated.order_status },
      }).catch(() => {});
    }

    return updated;
  }

  // Shared by OrderController's admin status-update path so cancellations
  // triggered from either admin surface restore stock and discount usage
  // the same way.
  static async restoreInventoryForOrder(order) {
    if (!order) return;
    await restoreProductInventory({ orderItems: order.order_products || [] });
    await releaseDiscountUsageForOrder(order);
  }
}

module.exports = CheckoutService;
