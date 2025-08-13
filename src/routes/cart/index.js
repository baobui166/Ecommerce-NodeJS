"use strict"

const express = require("express")
const { authentication } = require("../../auth/authUtils")
const { asyncHandler } = require("../../helpers/asyncHandler")
const cartController = require("../../controller/cart.controller")

const router = express.Router()

/////// Authentication ///////
//router.use(authentication)

router.post("", asyncHandler(cartController.addToCart))
router.delete("", asyncHandler(cartController.delete))
router.post("/update", asyncHandler(cartController.update))
router.get("", asyncHandler(cartController.listToCart))

module.exports = router
