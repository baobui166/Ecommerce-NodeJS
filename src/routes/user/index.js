"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { asyncHandler } = require("../../helpers/asyncHandler");
const userController = require("../../controller/user.controller");

const router = express.Router();

// Public routes (no auth)
router.post("/register", asyncHandler(userController.registerV2));
router.post("/login", asyncHandler(userController.loginV2));
router.post("/new_user", asyncHandler(userController.newUser));
router.get("/new_user", asyncHandler(userController.checkLoginEmailToken));

// Admin routes (require authentication)
router.get("/", authentication, requireAdmin, asyncHandler(userController.getAllUsers));
router.get(
  "/all_users",
  authentication,
  requireAdmin,
  asyncHandler(userController.getAllUsers),
);
router.get("/:id", authentication, requireAdmin, asyncHandler(userController.getUserById));
router.patch(
  "/:id/status",
  authentication,
  requireAdmin,
  asyncHandler(userController.updateUserStatus),
);

module.exports = router;
