"use strict";

const { Types } = require("mongoose");
const {
  BadRequestError,
  ConflictRequestError,
  ForbiddenError,
  NotFoundError,
} = require("../core/error.response");
const commentModel = require("../model/comment.model");
const orderModel = require("../model/order.model");
const { product: productModel } = require("../model/product.model");
const { convertToObjectIdMongodb } = require("../utils");
const { parsePagination, buildPagination } = require("../utils/pagination");

const MAX_REVIEW_CONTENT_LENGTH = 1000;

const normalizeId = (id, fieldName) => {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${fieldName}`, 400);
  }

  return convertToObjectIdMongodb(id);
};

const normalizeContent = (content) => {
  const normalized = String(content || "").trim();

  if (!normalized) {
    throw new BadRequestError("Review content is required", 400);
  }

  if (normalized.length > MAX_REVIEW_CONTENT_LENGTH) {
    throw new BadRequestError("Review content must be at most 1000 characters", 400);
  }

  return normalized;
};

const normalizeRating = (rating) => {
  const normalized = Number(rating);

  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 5) {
    throw new BadRequestError("Review rating must be an integer from 1 to 5", 400);
  }

  return normalized;
};

const orderContainsProduct = (order, productId) =>
  (order.order_products || []).some((shopOrder) =>
    (shopOrder.item_products || []).some(
      (item) => String(item.productId) === String(productId),
    ),
  );

class CommentService {
  static async recalculateProductRating(productId) {
    const productObjectId = normalizeId(productId, "productId");
    const [summary] = await commentModel.aggregate([
      {
        $match: {
          comment_productId: productObjectId,
          isDeleted: false,
          comment_orderId: { $exists: true },
          comment_rating: { $gte: 1, $lte: 5 },
        },
      },
      {
        $group: {
          _id: "$comment_productId",
          averageRating: { $avg: "$comment_rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    await productModel.findByIdAndUpdate(productObjectId, {
      $set: {
        product_ratingAverage: summary?.averageRating || 0,
        product_reviewCount: summary?.reviewCount || 0,
      },
    });
  }

  static async assertDeliveredPurchase({ userId, productId, orderId }) {
    const userObjectId = normalizeId(userId, "userId");
    const productObjectId = normalizeId(productId, "productId");
    const orderObjectId = normalizeId(orderId, "orderId");

    const order = await orderModel
      .findOne({
        _id: orderObjectId,
        order_userId: userObjectId,
        order_status: "delivered",
      })
      .lean();

    if (!order || !orderContainsProduct(order, productObjectId)) {
      throw new ForbiddenError("Only delivered purchases can be reviewed");
    }

    return order;
  }

  static async getProductReviews({ productId, page = 1, limit = 10 }) {
    const productObjectId = normalizeId(productId, "productId");
    const pagination = parsePagination({ page, limit, defaultLimit: 10, maxLimit: 50 });

    const foundProduct = await productModel
      .findOne({ _id: productObjectId, isDeleted: { $ne: true } })
      .select("product_ratingAverage product_reviewCount")
      .lean();

    if (!foundProduct) {
      throw new NotFoundError("Product not found");
    }

    const filter = {
      comment_productId: productObjectId,
      isDeleted: false,
      comment_orderId: { $exists: true },
      comment_rating: { $gte: 1, $lte: 5 },
    };

    const [reviews, total, [ratingSummary]] = await Promise.all([
      commentModel
        .find(filter)
        .populate("comment_user", "user_name user_avatar user_email")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      commentModel.countDocuments(filter),
      commentModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$comment_productId",
            averageRating: { $avg: "$comment_rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      reviews,
      summary: {
        averageRating: ratingSummary?.averageRating || 0,
        reviewCount: ratingSummary?.reviewCount || total,
      },
      pagination: buildPagination({ ...pagination, total }),
    };
  }

  static async createComment({ productId, orderId, rating, content, userId }) {
    const productObjectId = normalizeId(productId, "productId");
    const userObjectId = normalizeId(userId, "userId");
    const orderObjectId = normalizeId(orderId, "orderId");
    const normalizedRating = normalizeRating(rating);
    const normalizedContent = normalizeContent(content);

    const foundProduct = await productModel.exists({
      _id: productObjectId,
      isDeleted: { $ne: true },
    });

    if (!foundProduct) {
      throw new NotFoundError("Product not found");
    }

    await this.assertDeliveredPurchase({
      userId: userObjectId,
      productId: productObjectId,
      orderId: orderObjectId,
    });

    const existedReview = await commentModel.findOne({
      comment_productId: productObjectId,
      comment_user: userObjectId,
      isDeleted: false,
    });

    if (existedReview) {
      throw new ConflictRequestError("You have already reviewed this product", 409);
    }

    const review = await commentModel.create({
      comment_productId: productObjectId,
      comment_user: userObjectId,
      comment_orderId: orderObjectId,
      comment_rating: normalizedRating,
      comment_content: normalizedContent,
      isVerifiedPurchase: true,
    });

    await this.recalculateProductRating(productObjectId);

    return review.populate("comment_user", "user_name user_avatar user_email");
  }

  static async updateComment({ commentId, productId, orderId, rating, content, userId }) {
    const commentObjectId = normalizeId(commentId, "commentId");
    const userObjectId = normalizeId(userId, "userId");
    const normalizedRating = normalizeRating(rating);
    const normalizedContent = normalizeContent(content);

    const review = await commentModel.findOne({
      _id: commentObjectId,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (String(review.comment_user) !== String(userObjectId)) {
      throw new ForbiddenError("You can only update your own review");
    }

    if (productId && String(review.comment_productId) !== String(productId)) {
      throw new BadRequestError("Product does not match this review", 400);
    }

    if (orderId && String(review.comment_orderId) !== String(orderId)) {
      throw new BadRequestError("Order does not match this review", 400);
    }

    await this.assertDeliveredPurchase({
      userId: userObjectId,
      productId: review.comment_productId,
      orderId: review.comment_orderId,
    });

    review.comment_rating = normalizedRating;
    review.comment_content = normalizedContent;
    await review.save();
    await this.recalculateProductRating(review.comment_productId);

    return review.populate("comment_user", "user_name user_avatar user_email");
  }

  static async deleteComment({ commentId, userId }) {
    const commentObjectId = normalizeId(commentId, "commentId");
    const userObjectId = normalizeId(userId, "userId");

    const review = await commentModel.findOne({
      _id: commentObjectId,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (String(review.comment_user) !== String(userObjectId)) {
      throw new ForbiddenError("You can only delete your own review");
    }

    review.isDeleted = true;
    await review.save();
    await this.recalculateProductRating(review.comment_productId);

    return true;
  }
}

module.exports = CommentService;
