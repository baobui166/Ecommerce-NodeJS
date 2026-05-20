"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { SuccessResponse } = require("../../core/success.response");
const ShopService = require("../../services/shop.service");
const router = express.Router();

router.get(
  "/settings",
  authentication,
  requireAdmin,
  asyncHandler(async (req, res) => {
    new SuccessResponse({
      message: "Get shop settings success!",
      metadata: await ShopService.getSettings({ shopId: req.user.userId }),
    }).send(res);
  }),
);

router.patch(
  "/settings",
  authentication,
  requireAdmin,
  asyncHandler(async (req, res) => {
    new SuccessResponse({
      message: "Update shop settings success!",
      metadata: await ShopService.updateSettings({
        shopId: req.user.userId,
        payload: req.body,
      }),
    }).send(res);
  }),
);

module.exports = router;
