"use strict"

const CheckoutService = require("../services/checkout.service")
const { SuccessResponse } = require("../core/success.response")

class CheckoutController {
  checkReview = async (req, res, next) => {
    new SuccessResponse({
      message: "Create",
      metadata: await CheckoutService.checkoutReview(req.body)
    }).send(res)
  }
}

module.exports = new CheckoutController()
