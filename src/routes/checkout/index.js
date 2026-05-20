"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { asyncHandler } = require("../../helpers/asyncHandler");
const checkoutController = require("../../controller/checkout.controller");

const router = express.Router();

/////// Authentication //////

router.post(
  "/review",
  authentication,
  asyncHandler(checkoutController.checkReview),
);
router.post("", authentication, asyncHandler(checkoutController.orderByUser));
router.post("/order", authentication, asyncHandler(checkoutController.orderByUser));
router.get(
  "/getOne",
  authentication,
  asyncHandler(checkoutController.getOneOrderByUser),
);
router.get(
  "/getAll",
  authentication,
  asyncHandler(checkoutController.getAllOrderByUser),
);
router.put(
  "/cancelOrder",
  authentication,
  asyncHandler(checkoutController.cancellingOrderByUser),
);
router.put(
  "/updateStatus",
  authentication,
  requireAdmin,
  asyncHandler(checkoutController.changeStatusOrderByAdmin),
);
router.get("/:orderId", authentication, asyncHandler(checkoutController.getOneOrderByUser));

module.exports = router;
