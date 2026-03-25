"use strict";

const express = require("express");
const accessController = require("../../controller/access.controller");

const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const router = express.Router();

router.post("/shop/signup", asyncHandler(accessController.signup));
router.post("/shop/login", asyncHandler(accessController.login));

router.post(
  "/shop/logout",
  authentication,
  asyncHandler(accessController.logout),
);
router.post(
  "/shop/handlerRefreshToken",
  authentication,
  asyncHandler(accessController.handlerRefreshToken),
);

module.exports = router;
