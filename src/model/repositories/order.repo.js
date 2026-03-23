"use strict";

const { convertToObjectIdMongodb } = require("../../utils");
const orderModel = require("../order.model");

const findAllOrderByUserId = async (userId) => {
  return await orderModel
    .find({
      order_userId: userId,
    })
    .lean();
};

const findOneOrderByOrderId = async (orderId) => {
  return await orderModel.findOne({ _id: orderId }).lean();
};

const cancelOrderStatusByUser = async (
  userId,
  orderId,
  status = "cancelled",
) => {
  return await orderModel.findOneAndUpdate(
    {
      _id: orderId,
      order_userId: userId,
    },
    {
      order_status: status,
    },
    { new: true },
  );
};

const changeOrderStatusByAdmin = async (orderId, status, shopId) => {
  return await orderModel.findOneAndUpdate(
    {
      _id: orderId,
      order_shopId: shopId,
    },
    {
      order_status: status,
    },
    { new: true },
  );
};

module.exports = {
  findAllOrderByUserId,
  findOneOrderByOrderId,
  cancelOrderStatusByUser,
  changeOrderStatusByAdmin,
};
