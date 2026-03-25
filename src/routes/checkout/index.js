"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const checkoutController = require("../../controller/checkout.controller");

const router = express.Router();

/////// Authentication //////

router.post(
  "/review",
  authentication,
  asyncHandler(checkoutController.checkReview),
);
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
  asyncHandler(checkoutController.changeStatusOrderByAdmin),
);

module.exports = router;
