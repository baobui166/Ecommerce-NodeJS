"use strict";

const express = require("express");
const { asyncHandler } = require("../../helpers/asyncHandler");
const rbacController = require("../../controller/rbac.controller");
const router = express.Router();

router.post("/roles", asyncHandler(rbacController.createRole));
router.get("/roles", asyncHandler(rbacController.getListRole));

router.post("/resources", asyncHandler(rbacController.createResource));
router.get("/resources", asyncHandler(rbacController.getListResource));

module.exports = router;
