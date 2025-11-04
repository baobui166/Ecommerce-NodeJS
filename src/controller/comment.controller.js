"use strict"

const { SuccessResponse } = require("../core/success.response")
const CommentService = require("../services/comment.service")

class CommentController {
  createComment = async (req, res, next) => {
    new SuccessResponse({
      message: "Create new comment success",
      metadata: await CommentService.createComment(req.body)
    }).send(res)
  }

  getAllCommentByParentCommentId = async (req, res, next) => {
    new SuccessResponse({
      message: "Get all comment by parent comment id success",
      metadata: await CommentService.getCommentByParentId(req.query)
    }).send(res)
  }

  deleteComment = async (req, res, next) => {
    new SuccessResponse({
      message: "Delete comment success",
      metadata: await CommentService.deleteComment(req.body)
    }).send(res)
  }
}

module.exports = new CommentController()
