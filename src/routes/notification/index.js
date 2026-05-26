"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { requireUserNotBlocked } = require("../../middlewares/userStatus.middleware");
const notificationController = require("../../controller/notification.controller");

const router = express.Router();

/////// Authentication ///////

router.get(
  "/",
  authentication,
  asyncHandler(requireUserNotBlocked),
  asyncHandler(notificationController.listNotiByUser),
);
router.put(
  "/read-all",
  authentication,
  asyncHandler(requireUserNotBlocked),
  asyncHandler(notificationController.markAllAsRead),
);
router.put(
  "/:id/read",
  authentication,
  asyncHandler(requireUserNotBlocked),
  asyncHandler(notificationController.markAsRead),
);
router.delete(
  "/:id",
  authentication,
  asyncHandler(requireUserNotBlocked),
  asyncHandler(notificationController.deleteNotification),
);

module.exports = router;
