"use strict"

const express = require("express")
const { authentication } = require("../../auth/authUtils")
const { asyncHandler } = require("../../helpers/asyncHandler")
const productController = require("../../controller/product.controller")
const router = express.Router()

/////// Authentication ///////
router.use(authentication)
/////////////////////////////
router.post("/", asyncHandler(productController.createNewProduct))

module.exports = router
