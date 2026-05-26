"use strict";

const { SuccessResponse } = require("../core/success.response");
const WishlistService = require("../services/wishlist.service");

class WishlistController {
  getWishlist = async (req, res, next) => {
    new SuccessResponse({
      message: "Get wishlist success",
      metadata: await WishlistService.getWishlist({ userId: req.user.userId }),
    }).send(res);
  };

  addProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Add wishlist product success",
      metadata: await WishlistService.addProduct({
        userId: req.user.userId,
        productId: req.body.productId,
      }),
    }).send(res);
  };

  removeProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Remove wishlist product success",
      metadata: await WishlistService.removeProduct({
        userId: req.user.userId,
        productId: req.params.productId,
      }),
    }).send(res);
  };

  clearWishlist = async (req, res, next) => {
    new SuccessResponse({
      message: "Clear wishlist success",
      metadata: await WishlistService.clearWishlist({ userId: req.user.userId }),
    }).send(res);
  };
}

module.exports = new WishlistController();
