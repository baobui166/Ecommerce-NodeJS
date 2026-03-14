"use strict";

const express = require("express");
const { asyncHandler } = require("../../helpers/asyncHandler");
const emailController = require("../../controller/email.controller");

const router = express.Router();

router.post("/new_template", asyncHandler(emailController.newTemplate));

module.exports = router;
