"use strict";

const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Wishlist";
const COLLECTION_NAME = "Wishlists";

const wishlistProductSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const wishlistSchema = new Schema(
  {
    wishlist_userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      unique: true,
    },
    wishlist_products: {
      type: [wishlistProductSchema],
      default: [],
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  },
);

module.exports = model(DOCUMENT_NAME, wishlistSchema);
