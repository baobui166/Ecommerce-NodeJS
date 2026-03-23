"use strict";

const { SuccessResponse } = require("../core/success.response");
const CartService = require("../services/cart.service");

class CartController {
  addToCart = async (req, res, next) => {
    const { product } = req.body;
    new SuccessResponse({
      message: "Create new Cart success",
      metadata: await CartService.addToCart(req.user.userId, product),
    }).send(res);
  };

  // update + -
  update = async (req, res, next) => {
    new SuccessResponse({
      message: "Create new Cart success",
      metadata: await CartService.addToCartV2({
        ...req.body,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  // delete
  delete = async (req, res, next) => {
    new SuccessResponse({
      message: "delete Cart success",
      metadata: await CartService.deleteUserCart({
        ...req.body,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  // list
  listToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "List Cart success",
      metadata: await CartService.getListUserCart({ userId: req.user.userId }),
    }).send(res);
  };
}

module.exports = new CartController();
