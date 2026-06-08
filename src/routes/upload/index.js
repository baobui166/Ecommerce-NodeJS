"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const uploadController = require("../../controller/upload.controller");
const { uploadDisk, uploadMemory } = require("../../config/multer.config");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const router = express.Router();

router.use(authentication, requireAdmin);

router.post(
  "/product",
  uploadMemory.single("file"),
  asyncHandler(uploadController.uploadImage),
);
router.post(
  "/product/thumb",
  uploadDisk.single("file"),
  asyncHandler(uploadController.uploadFileThumb),
);
router.post(
  "/product/bucket",
  uploadMemory.single("file"),
  asyncHandler(uploadController.uploadFileLocalS3),
);

module.exports = router;
