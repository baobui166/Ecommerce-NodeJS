"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { asyncHandler } = require("../../helpers/asyncHandler");
const userController = require("../../controller/user.controller");
const { authLimiter, verifyLimiter } = require("../../middlewares/rateLimit.middleware");

const router = express.Router();

// Public routes (no auth)
router.post("/register", authLimiter, asyncHandler(userController.registerV2));
router.post("/login", authLimiter, asyncHandler(userController.loginV2));
router.post("/google/login", authLimiter, asyncHandler(userController.googleLogin));
router.post("/verify/request", verifyLimiter, asyncHandler(userController.requestAccountVerification));
router.post("/verify/confirm", verifyLimiter, asyncHandler(userController.confirmAccountVerification));
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
