"use strict";

const express = require("express");
const accessController = require("../../controller/access.controller");

const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authLimiter } = require("../../middlewares/rateLimit.middleware");
const router = express.Router();

router.post("/shop/signup", authLimiter, asyncHandler(accessController.signup));
router.post("/shop/login", authLimiter, asyncHandler(accessController.adminLogin));
router.post("/shop/seller/login", authLimiter, asyncHandler(accessController.login));
router.post("/shop/admin/login", authLimiter, asyncHandler(accessController.adminLogin));

router.post(
  "/shop/logout",
  authentication,
  asyncHandler(accessController.logout),
);
router.post(
  "/shop/handlerRefreshToken",
  authLimiter,
  asyncHandler(accessController.handlerRefreshToken),
);

module.exports = router;
