"use strict"

const express = require("express")
const { authentication } = require("../../auth/authUtils")
const { asyncHandler } = require("../../helpers/asyncHandler")
const checkoutController = require("../../controller/checkout.controller")

const router = express.Router()

/////// Authentication ///////
//router.use(authentication)

router.post("/review", asyncHandler(checkoutController.checkReview))

module.exports = router
