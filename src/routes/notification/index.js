"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const notificationController = require("../../controller/notification.controller");

const router = express.Router();

/////// Authentication ///////

router.get(
  "/",
  authentication,
  asyncHandler(notificationController.listNotiByUser),
);

module.exports = router;
