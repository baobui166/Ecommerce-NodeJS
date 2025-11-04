"use strict"

const express = require("express")
const { authentication } = require("../../auth/authUtils")
const { asyncHandler } = require("../../helpers/asyncHandler")
const checkoutController = require("../../controller/checkout.controller")

const router = express.Router()

/////// Authentication ///////
//router.use(authentication)

router.post("/review", asyncHandler(checkoutController.checkReview))
router.get("/getOne", asyncHandler(checkoutController.getOneOrderByUser))
router.get("/getAll", asyncHandler(checkoutController.getAllOrderByUser))
router.put(
  "/cancelOrder",
  asyncHandler(checkoutController.cancellingOrderByUser)
)
router.put(
  "/updateStatus",
  asyncHandler(checkoutController.changeStatusOrderByAdmin)
)

module.exports = router
