"use strict";

const express = require("express");
const { profiles, profile } = require("../../controller/profile.controller");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { requireUserNotBlocked } = require("../../middlewares/userStatus.middleware");
const router = express.Router();

// admin
router.get("/viewAny", authentication, requireAdmin, profiles);

// shop
router.get("/viewOwn", authentication, asyncHandler(requireUserNotBlocked), profile);

module.exports = router;
