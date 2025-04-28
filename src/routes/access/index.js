"use strict"

const express = require("express")
const accessController = require("../../controller/access.controller")
const { asyncHandler } = require("../../auth/checkAuthen")
const router = express.Router()

router.post("/shop/signup", asyncHandler(accessController.signup))

module.exports = router
