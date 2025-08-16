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

module.exports = {
  findCartById
}
