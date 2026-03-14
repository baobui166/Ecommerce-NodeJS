"use strict";

const express = require("express");
const { asyncHandler } = require("../../helpers/asyncHandler");
const emailController = require("../../controller/email.controller");
const userController = require("../../controller/user.controller");

const router = express.Router();

router.post("/new_user", asyncHandler(userController.newUser));

module.exports = router;
