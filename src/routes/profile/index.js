"use strict";

const express = require("express");
const { profiles, profile } = require("../../controller/profile.controller");
const { authentication } = require("../../auth/authUtils");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const router = express.Router();

// admin
router.get("/viewAny", authentication, requireAdmin, profiles);

// shop
router.get("/viewOwn", authentication, profile);

module.exports = router;
