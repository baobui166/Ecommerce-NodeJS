"use strict";

const { SuccessResponse } = require("../core/success.response");
const {
  findAllOrders,
  findOrderById,
  updateOrderStatusById,
  getRevenueReport,
} = require("../model/repositories/order.repo");
const { BadRequestError } = require("../core/error.response");
const { publishEvent } = require("../services/eventBus.service");
const CheckoutService = require("../services/checkout.service");

class OrderController {
  // GET /v1/api/order?limit=20&page=1
  getAllOrders = async (req, res, next) => {
    const { limit = 20, page = 1 } = req.query;
    new SuccessResponse({
      message: "Get all orders success!",
      metadata: await findAllOrders({
        limit: parseInt(limit),
        page: parseInt(page),
      }),
    }).send(res);
  };

  // GET /v1/api/order/:id
  getOrderById = async (req, res, next) => {
    const order = await findOrderById(req.params.id);
    if (!order) throw new BadRequestError("Order not found!");
    new SuccessResponse({
      message: "Get order success!",
      metadata: order,
    }).send(res);
  };

  // PATCH /v1/api/order/:id/status
  updateOrderStatus = async (req, res, next) => {
    const { order_status, note = "" } = req.body;
    if (!order_status) throw new BadRequestError("order_status is required!");

    const previousOrder = await findOrderById(req.params.id);
    if (!previousOrder) throw new BadRequestError("Order not found!");

    const updated = await updateOrderStatusById({
      orderId: req.params.id,
      status: order_status,
      changedBy: req.user?.userId,
      changedByType: req.user?.type === "shop" ? "shop" : "admin",
      note,
    });
    if (!updated) throw new BadRequestError("Order not found!");

    if (order_status === "cancelled" && previousOrder.order_status !== "cancelled") {
      await CheckoutService.restoreInventoryForOrder(updated);
    }

    publishEvent({
      type: "order.status_changed",
      userId: updated.order_userId,
      orderId: updated._id,
      metadata: { status: updated.order_status },
    }).catch(() => {});

    new SuccessResponse({
      message: "Update order status success!",
      metadata: updated,
    }).send(res);
  };

  getRevenueReport = async (req, res, next) => {
    new SuccessResponse({
      message: "Get revenue report success!",
      metadata: await getRevenueReport(),
    }).send(res);
  };
}

module.exports = new OrderController();
