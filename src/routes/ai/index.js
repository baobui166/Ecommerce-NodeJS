"use strict";

const express = require("express");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { aiLimiter } = require("../../middlewares/rateLimit.middleware");
const aiController = require("../../controller/ai.controller");

const router = express.Router();

router.post(
  "/product-assistant",
  aiLimiter,
  asyncHandler(aiController.productAssistant),
);

module.exports = router;
