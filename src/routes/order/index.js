"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { asyncHandler } = require("../../helpers/asyncHandler");
const orderController = require("../../controller/order.controller");

const router = express.Router();

// Admin order management — all behind authentication
router.get("/report/revenue", authentication, requireAdmin, asyncHandler(orderController.getRevenueReport));
router.get("/", authentication, requireAdmin, asyncHandler(orderController.getAllOrders));
router.get("/:id", authentication, requireAdmin, asyncHandler(orderController.getOrderById));
router.patch(
  "/:id/status",
  authentication,
  requireAdmin,
  asyncHandler(orderController.updateOrderStatus),
);

module.exports = router;
