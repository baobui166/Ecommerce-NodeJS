"use strict"

const express = require("express")
const { authentication } = require("../../auth/authUtils")
const { asyncHandler } = require("../../helpers/asyncHandler")
const inventoryController = require("../../controller/inventory.controller")

const router = express.Router()

/////// Authentication ///////
router.use(authentication)

router.post("/", asyncHandler(inventoryController.addStock))

module.exports = router
