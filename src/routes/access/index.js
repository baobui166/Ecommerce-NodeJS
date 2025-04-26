"use strict"

const express = require("express")
const accessController = require("../../controller/access.controller")
const router = express.Router()

router.post("/shop/signup", accessController.signup)

module.exports = router
