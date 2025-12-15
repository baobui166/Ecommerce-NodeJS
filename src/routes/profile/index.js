"use strict";

const express = require("express");
const { profiles, profile } = require("../../controller/profile.controller");
const { grantAccess } = require("../../middlewares/rbac.middleware");
const router = express.Router();

// admin
router.get("/viewAny", grantAccess("readAny", "profile"), profiles);

// shop
router.get("/viewOwn", grantAccess("readOwn", "profile"), profile);

module.exports = router;
