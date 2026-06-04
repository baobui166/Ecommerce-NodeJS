"use strict";

const express = require("express");
const { asyncHandler } = require("../../helpers/asyncHandler");
const healthController = require("../../controller/health.controller");

const router = express.Router();

router.get("/health", asyncHandler(healthController.health));
router.get("/ready", asyncHandler(healthController.ready));

module.exports = router;
