"use strict";

const express = require("express");
const { asyncHandler } = require("../../helpers/asyncHandler");
const userController = require("../../controller/user.controller");

const router = express.Router();

// V2: Register & Login with email + password (no OTP)
router.post("/register", asyncHandler(userController.registerV2));
router.post("/login", asyncHandler(userController.loginV2));

router.post("/new_user", asyncHandler(userController.newUser));
router.get("/new_user", asyncHandler(userController.checkLoginEmailToken));

module.exports = router;
