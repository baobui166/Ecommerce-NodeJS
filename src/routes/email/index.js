"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const emailController = require("../../controller/email.controller");

const router = express.Router();

router.use(authentication, requireAdmin);

router.post("/new_template", asyncHandler(emailController.newTemplate));

module.exports = router;
