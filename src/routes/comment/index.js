"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const commentController = require("../../controller/comment.controller");

const router = express.Router();

/////// Authentication ///////

router.post("/", authentication, asyncHandler(commentController.createComment));
router.get(
  "/",
  authentication,
  asyncHandler(commentController.getAllCommentByParentCommentId),
);
router.delete(
  "/",
  authentication,
  asyncHandler(commentController.deleteComment),
);

module.exports = router;
