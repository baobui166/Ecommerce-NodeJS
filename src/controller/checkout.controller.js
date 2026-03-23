"use strict";

const CheckoutService = require("../services/checkout.service");
const { SuccessResponse } = require("../core/success.response");

class CheckoutController {
  checkReview = async (req, res, next) => {
    new SuccessResponse({
      message: "Create",
      metadata: await CheckoutService.checkoutReview({
        ...req.body,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  orderByUser = async (req, res, next) => {
    new SuccessResponse({
      message: "Create order by user successfully!!!",
      metadata: await CheckoutService.orderByUser({
        ...req.body,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  getAllOrderByUser = async (req, res, next) => {
    new SuccessResponse({
      message: "Get order by user successfully",
      metadata: await CheckoutService.getOrderByUser({ userId: req.user.userId }),
    }).send(res);
  };

  getOneOrderByUser = async (req, res, next) => {
    new SuccessResponse({
      message: "Get one order for user successfully!!!",
      metadata: await CheckoutService.getOneOrderByUser({
        ...req.body,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  cancellingOrderByUser = async (req, res, next) => {
    new SuccessResponse({
      message: "Cancelling order by user successfully!!!",
      metadata: await CheckoutService.cancelOrderByUser({
        ...req.body,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  changeStatusOrderByAdmin = async (req, res, next) => {
    new SuccessResponse({
      message: "Change status order successfully!!!",
      metadata: await CheckoutService.updateOrderStatusByShop(req.body),
    }).send(res);
  };
}

module.exports = new CheckoutController();
