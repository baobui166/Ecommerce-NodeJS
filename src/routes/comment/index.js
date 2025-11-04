"use strict"

const express = require("express")
const { authentication } = require("../../auth/authUtils")
const { asyncHandler } = require("../../helpers/asyncHandler")
const commentController = require("../../controller/comment.controller")

const router = express.Router()

/////// Authentication ///////
router.use(authentication)

router.post("/", asyncHandler(commentController.createComment))
router.get("/", asyncHandler(commentController.getAllCommentByParentCommentId))
router.delete("/", asyncHandler(commentController.deleteComment))

module.exports = router
