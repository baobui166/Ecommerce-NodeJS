"use trict"

const { convertToObjectIdMongodb } = require("../../utils")
const cartModel = require("../cart.model")

const findCartById = async (cartId) => {
  return await cartModel.cart
    .findOne({
      _id: convertToObjectIdMongodb(cartId),
      cart_state: "active"
    })
    .lean()
}

const findCartByIdAndUserId = async (cartId, userId) => {
  return await cartModel.cart
    .findOne({
      _id: convertToObjectIdMongodb(cartId),
      cart_state: "active",
      cart_userId: userId
    })
    .lean()
}

module.exports = {
  findCartById,
  findCartByIdAndUserId
}
