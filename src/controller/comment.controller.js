"use strict";

const { SuccessResponse } = require("../core/success.response");
const CommentService = require("../services/comment.service");

class CommentController {
  createComment = async (req, res, next) => {
    new SuccessResponse({
      message: "Create product review success",
      metadata: await CommentService.createComment({
        ...req.body,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  getProductReviews = async (req, res, next) => {
    new SuccessResponse({
      message: "Get product reviews success",
      metadata: await CommentService.getProductReviews({
        productId: req.params.productId,
        ...req.query,
      }),
    }).send(res);
  };

  updateComment = async (req, res, next) => {
    new SuccessResponse({
      message: "Update product review success",
      metadata: await CommentService.updateComment({
        commentId: req.params.commentId,
        ...req.body,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  deleteComment = async (req, res, next) => {
    new SuccessResponse({
      message: "Delete product review success",
      metadata: await CommentService.deleteComment({
        commentId: req.params.commentId,
        userId: req.user.userId,
      }),
    }).send(res);
  };
}

module.exports = new CommentController();
