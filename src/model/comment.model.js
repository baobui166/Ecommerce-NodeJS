"use strict";

const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Comment";
const COLLECTION_NAME = "Comments";

const commentSchema = new Schema(
  {
    comment_productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    comment_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    comment_orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    comment_rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment_content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    comment_left: { type: Number, default: 0 },
    comment_right: { type: Number, default: 0 },
    comment_parentId: { type: Schema.Types.ObjectId, ref: DOCUMENT_NAME, default: null },
    isVerifiedPurchase: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  },
);

commentSchema.index(
  { comment_productId: 1, comment_user: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
commentSchema.index({ comment_productId: 1, isDeleted: 1, createdAt: -1 });

module.exports = model(DOCUMENT_NAME, commentSchema);
