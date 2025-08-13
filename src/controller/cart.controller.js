"use strict"

const { SuccessResponse } = require("../core/success.response")
const CartService = require("../services/cart.service")

class CartController {
  addToCart = async (req, res, next) => {
    const { userId, product } = req.body
    new SuccessResponse({
      message: "Create new Cart success",
      metadata: await CartService.addToCart(Number(userId), product)
    }).send(res)
  }

  // update + -
  update = async (req, res, next) => {
    new SuccessResponse({
      message: "Create new Cart success",
      metadata: await CartService.addToCartV2(req.body)
    }).send(res)
  }

  // delete
  delete = async (req, res, next) => {
    new SuccessResponse({
      message: "delete Cart success",
      metadata: await CartService.deleteUserCart(req.body)
    }).send(res)
  }

  // list
  listToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "List Cart success",
      metadata: await CartService.getListUserCart(req.query)
    }).send(res)
  }
}

module.exports = new CartController()
