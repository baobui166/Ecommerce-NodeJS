"use strict"

const { convertToObjectIdMongodb } = require("../../utils")
const orderModel = require("../order.model")

const findAllOrderByUserId = async (userId) => {
  return await orderModel
    .findOne({
      order_userId: userId
    })
    .lean()
}

const findOneOrderByOrderId = async (orderId) => {
  return await orderModel.findOne({ _id: orderId }).lean()
}

const cancelOrderStatusByUser = async (
  userId,
  orderId,
  status = "cancelling"
) => {
  return await orderModel.findOneAndUpdate({
    _id: orderId,
    order_userId: userId,
    order_status: status
  })
}

const changeOrderStatusByAdmin = async (userId, orderId, status, shopId) => {
  return await orderModel.findOneAndUpdate({
    _id: orderId,
    order_userId: userId,
    order_status: status,
    order_shopId: shopId
  })
}

module.exports = {
  findAllOrderByUserId,
  findOneOrderByOrderId,
  cancelOrderStatusByUser,
  changeOrderStatusByAdmin
}
