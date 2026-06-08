"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const rbacController = require("../../controller/rbac.controller");
const router = express.Router();

router.use(authentication, requireAdmin);

router.post("/roles", asyncHandler(rbacController.createRole));
router.get("/roles", asyncHandler(rbacController.getListRole));

router.post("/resources", asyncHandler(rbacController.createResource));
router.get("/resources", asyncHandler(rbacController.getListResource));

module.exports = router;
