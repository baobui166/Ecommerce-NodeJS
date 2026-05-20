"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { asyncHandler } = require("../../helpers/asyncHandler");
const discountController = require("../../controller/discount.controller");

const router = express.Router();

// get amount a discount
router.post("/amount", asyncHandler(discountController.getDiscountAmount));
router.get(
  "/list_product_code",
  asyncHandler(discountController.getAllDiscountCodeWithProducts),
);

/////// Authentication ///////
router.post(
  "/",
  authentication,
  requireAdmin,
  asyncHandler(discountController.createDiscountCode),
);
router.get(
  "/",
  authentication,
  requireAdmin,
  asyncHandler(discountController.getAllDiscountCode),
);

module.exports = router;
