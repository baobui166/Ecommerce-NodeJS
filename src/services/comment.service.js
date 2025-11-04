"use strict"

const { BadRequestError, NotFoundError } = require("../core/error.response")
const commentModel = require("../model/comment.model")
const { findProduct } = require("../model/repositories/product.repo")
const { convertToObjectIdMongodb } = require("../utils")
/**
 key feature: Comment feature
 - add comment [User, Shop]
 - get list comments [User, shop]
 - delete a comment [User, Shop, Admin]
 */
class CommentService {
  static async createComment({
    productId,
    userId,
    content,
    parentCommentId = null
  }) {
    const comment = new commentModel({
      comment_productId: productId,
      comment_user: userId,
      comment_content: content,
      comment_parentId: parentCommentId
    })

    let rightValue

    if (parentCommentId) {
      // rely comment
      const parentComment = await commentModel.findById(parentCommentId)

      if (!parentComment) throw new BadRequestError("parent comment not found")

      rightValue = parentComment.comment_right

      // update comments

      await commentModel.updateMany(
        {
          comment_productId: convertToObjectIdMongodb(productId),
          comment_right: { $gte: rightValue }
        },
        { $inc: { comment_right: 2 } }
      )

      await commentModel.updateMany(
        {
          comment_productId: convertToObjectIdMongodb(productId),
          comment_left: { $gte: rightValue }
        },
        { $inc: { comment_left: 2 } }
      )
    } else {
      const maxRightValue = await commentModel.findOne(
        {
          comment_productId: convertToObjectIdMongodb(productId)
        },
        "comment_right",
        { sort: { comment_right: -1 } }
      )

      if (maxRightValue) {
        rightValue = maxRightValue.right + 1
      } else {
        rightValue = 1
      }
    }

    // insert to comment

    comment.comment_left = rightValue
    comment.comment_right = rightValue + 1

    await comment.save()
    return comment
  }

  static async getCommentByParentId({
    parentCommentId = null,
    productId,
    limit = 50,
    offset = 0 // skip
  }) {
    if (parentCommentId) {
      const parent = await commentModel.findById(parentCommentId)

      if (!parent)
        throw new NotFoundError("Parent not found comment for product")

      const comments = await commentModel
        .find({
          comment_productId: convertToObjectIdMongodb(productId),
          comment_left: { $gt: parent.comment_left },
          comment_right: { $lte: parent.comment_right }
        })
        .select({
          comment_left: 1,
          comment_right: 1,
          comment_content: 1,
          comment_parentId: 1
        })
        .sort({ comment_left: 1 })

      return comments
    }

    const comments = await commentModel
      .find({
        comment_productId: convertToObjectIdMongodb(productId),
        comment_parentId: parentCommentId
      })
      .select({
        comment_left: 1,
        comment_right: 1,
        comment_content: 1,
        comment_parentId: 1
      })
      .sort({ comment_left: 1 })

    return comments
  }

  static async deleteComment({ commentId, productId }) {
    // check product exists in db
    const foundProduct = await findProduct({ product_id: productId })

    if (!foundProduct) throw new NotFoundError("Product not found")

    // xac dinh gia tri left va right
    const comment = await commentModel.findById(commentId)
    if (!comment) throw new NotFoundError("comment not found")

    const leftValue = comment.comment_left
    const rightValue = comment.comment_right

    // tinh width
    const width = rightValue - leftValue + 1
    // xoa tat ca comment con

    await commentModel.deleteMany({
      comment_productId: convertToObjectIdMongodb(productId),
      comment_left: { $gte: leftValue, $lte: rightValue }
    })

    // cap nhat gia tri left right cho cac comment khac

    await commentModel.updateMany(
      {
        comment_productId: convertToObjectIdMongodb(productId),
        comment_right: { $gt: rightValue }
      },
      { $inc: { comment_right: -width } }
    )

    await commentModel.updateMany(
      {
        comment_productId: convertToObjectIdMongodb(productId),
        comment_left: { $gt: rightValue }
      },
      { $inc: { comment_left: -width } }
    )

    return true
  }
}

module.exports = CommentService
