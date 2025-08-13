"use strict"
const { SuccessResponse } = require("../core/success.response")

const DiscountService = require("../services/discount.service")

class DiscountController {
  createDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfull Code Generation!!!!",
      metadata: await DiscountService.createDiscountCode({
        ...req.body,
        shopId: req.user.userId
      })
    }).send(res)
  }

  getAllDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfull Code Found!!!!",
      metadata: await DiscountService.getAllDiscountCodeByShop({
        ...req.query,
        shopId: req.user.userId
      })
    }).send(res)
  }

  getDiscountAmount = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfull Code Found!!!!",
      metadata: await DiscountService.getDiscountAmount({
        ...req.body
      })
    }).send(res)
  }

  getAllDiscountCodeWithProducts = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfull Code Found!!!!",
      metadata: await DiscountService.getAllDiscountCodeWithProduct({
        ...req.query
      })
    }).send(res)
  }
}

module.exports = new DiscountController()
