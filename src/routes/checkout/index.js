"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { requireActiveUser } = require("../../middlewares/userStatus.middleware");
const { asyncHandler } = require("../../helpers/asyncHandler");
const checkoutController = require("../../controller/checkout.controller");
const { orderLimiter } = require("../../middlewares/rateLimit.middleware");

const router = express.Router();

/////// Authentication //////

router.post(
  "/review",
  orderLimiter,
  authentication,
  asyncHandler(requireActiveUser),
  asyncHandler(checkoutController.checkReview),
);
router.post("", orderLimiter, authentication, asyncHandler(requireActiveUser), asyncHandler(checkoutController.orderByUser));
router.post("/order", orderLimiter, authentication, asyncHandler(requireActiveUser), asyncHandler(checkoutController.orderByUser));
router.get(
  "/getOne",
  authentication,
  asyncHandler(requireActiveUser),
  asyncHandler(checkoutController.getOneOrderByUser),
);
router.get(
  "/getAll",
  authentication,
  asyncHandler(requireActiveUser),
  asyncHandler(checkoutController.getAllOrderByUser),
);
router.put(
  "/cancelOrder",
  orderLimiter,
  authentication,
  asyncHandler(requireActiveUser),
  asyncHandler(checkoutController.cancellingOrderByUser),
);
router.put(
  "/updateStatus",
  authentication,
  requireAdmin,
  asyncHandler(checkoutController.changeStatusOrderByAdmin),
);
router.get("/:orderId", authentication, asyncHandler(requireActiveUser), asyncHandler(checkoutController.getOneOrderByUser));

module.exports = router;
