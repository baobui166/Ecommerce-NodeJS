"use strict";

const { Types } = require("mongoose");
const { convertToObjectIdMongodb } = require("../../utils");
const orderModel = require("../order.model");
const { product } = require("../product.model");
const userModel = require("../user.model");
const { parsePagination, buildPagination } = require("../../utils/pagination");

const toObjectIdOrNull = (id) =>
  Types.ObjectId.isValid(id) ? convertToObjectIdMongodb(id) : null;

// ───────── User-facing queries (used by OrderController) ─────────

const findAllOrderByUserId = async (userId) => {
  return await orderModel
    .find({ order_userId: userId })
    .sort({ createdOn: -1 })
    .lean();
};

const findOneOrderByOrderId = async (orderId, userId = null) => {
  const _id = toObjectIdOrNull(orderId);
  if (!_id) return null;

  const filter = { _id };
  if (userId) filter.order_userId = userId;

  return await orderModel.findOne(filter).lean();
};

const cancelOrderStatusByUser = async (userId, orderId, status) => {
  const _id = toObjectIdOrNull(orderId);
  if (!_id) return null;

  return await orderModel
    .findOneAndUpdate(
      {
        _id,
        order_userId: userId,
        order_status: "pending", // chỉ huỷ được khi đang pending
      },
      { $set: { order_status: status } },
      { new: true },
    )
    .lean();
};

const changeOrderStatusByAdmin = async (orderId, status, shopId) => {
  const _id = toObjectIdOrNull(orderId);
  if (!_id) return null;

  const filter = { _id };
  if (shopId) {
    filter.order_shopId = shopId;
  }

  return await orderModel
    .findOneAndUpdate(filter, { $set: { order_status: status } }, { new: true })
    .lean();
};

// ───────── Admin-facing queries (used by OrderController) ─────────

const findAllOrders = async ({ limit = 20, page = 1 }) => {
  const pagination = parsePagination({ page, limit, defaultLimit: 20, maxLimit: 100 });

  const [orders, total] = await Promise.all([
    orderModel
      .find({})
      .sort({ createdOn: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    orderModel.countDocuments({}),
  ]);

  return {
    orders,
    pagination: buildPagination({ ...pagination, total }),
  };
};

const findOrderById = async (orderId) => {
  const _id = toObjectIdOrNull(orderId);
  if (!_id) return null;

  return await orderModel.findOne({ _id }).lean();
};

const updateOrderStatusById = async (orderId, status) => {
  const _id = toObjectIdOrNull(orderId);
  if (!_id) return null;

  return await orderModel
    .findOneAndUpdate(
      { _id },
      { $set: { order_status: status } },
      { new: true },
    )
    .lean();
};

const getRevenueReport = async () => {
  const [orders, totalProducts, totalUsers] = await Promise.all([
    orderModel.find({}).lean(),
    product.countDocuments({ isDeleted: { $ne: true } }),
    userModel.countDocuments({}),
  ]);

  const statuses = ["pending", "confirmed", "processing", "shipped", "cancelled", "delivered"];
  const ordersByStatus = Object.fromEntries(statuses.map((status) => [status, 0]));
  const revenueByDayMap = new Map();
  const revenueByCategoryMap = new Map();
  const topProductsMap = new Map();

  let totalRevenue = 0;

  for (const order of orders) {
    ordersByStatus[order.order_status] = (ordersByStatus[order.order_status] || 0) + 1;
    const checkout = order.order_checkout || {};
    const orderRevenue = Number(checkout.totalCheckout || checkout.totalPrice || 0);
    if (order.order_status !== "cancelled") totalRevenue += orderRevenue;

    const day = new Date(order.createdOn || order.createdAt || Date.now())
      .toISOString()
      .slice(0, 10);
    revenueByDayMap.set(day, (revenueByDayMap.get(day) || 0) + orderRevenue);

    for (const shopOrder of order.order_products || []) {
      for (const item of shopOrder.item_products || []) {
        const name = item.name || item.product_name || item.productId?.toString() || "Product";
        const quantity = Number(item.quantity || 0);
        const revenue = Number(item.price || 0) * quantity;
        const current = topProductsMap.get(name) || { name, sold: 0, revenue: 0 };
        current.sold += quantity;
        current.revenue += revenue;
        topProductsMap.set(name, current);
      }
      const category = shopOrder.product_type || "Other";
      revenueByCategoryMap.set(category, (revenueByCategoryMap.get(category) || 0) + orderRevenue);
    }
  }

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalProducts,
    totalUsers,
    revenueByDay: [...revenueByDayMap.entries()].map(([label, value]) => ({ label, value })),
    ordersByStatus,
    topProducts: [...topProductsMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    revenueByCategory: [...revenueByCategoryMap.entries()].map(([label, value]) => ({ label, value })),
    periodLabel: "All time",
  };
};

module.exports = {
  findAllOrderByUserId,
  findOneOrderByOrderId,
  cancelOrderStatusByUser,
  changeOrderStatusByAdmin,
  findAllOrders,
  findOrderById,
  updateOrderStatusById,
  getRevenueReport,
};
