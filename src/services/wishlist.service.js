"use strict";

const { Types } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../core/error.response");
const WishlistModel = require("../model/wishlist.model");
const { product: ProductModel } = require("../model/product.model");
const { convertToObjectIdMongodb } = require("../utils");

const PRODUCT_SELECT =
  "product_name product_thumb product_images product_descriptions product_price product_quantity product_type product_shop product_attributes product_ratingAverage product_reviewCount product_sold product_isFeatured createdAt updatedAt";

class WishlistService {
  static async getWishlist({ userId }) {
    const wishlist = await WishlistModel.findOne({
      wishlist_userId: convertToObjectIdMongodb(userId),
    })
      .populate({
        path: "wishlist_products.productId",
        select: PRODUCT_SELECT,
        match: { isDeleted: { $ne: true }, isPublish: true },
      })
      .lean();

    const products = (wishlist?.wishlist_products ?? [])
      .filter((item) => item.productId)
      .map((item) => ({
        ...item.productId,
        wishlist_addedAt: item.addedAt,
      }));

    return {
      products,
      productIds: products.map((item) => String(item._id)),
      total: products.length,
    };
  }

  static async addProduct({ userId, productId }) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestError("Invalid product id");
    }

    const foundProduct = await ProductModel.exists({
      _id: convertToObjectIdMongodb(productId),
      isDeleted: { $ne: true },
      isPublish: true,
    });

    if (!foundProduct) {
      throw new NotFoundError("Product not found");
    }

    await WishlistModel.findOneAndUpdate(
      { wishlist_userId: convertToObjectIdMongodb(userId) },
      {
        $setOnInsert: { wishlist_userId: convertToObjectIdMongodb(userId) },
        $addToSet: {
          wishlist_products: {
            productId: convertToObjectIdMongodb(productId),
          },
        },
      },
      { upsert: true, new: true },
    );

    return WishlistService.getWishlist({ userId });
  }

  static async removeProduct({ userId, productId }) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestError("Invalid product id");
    }

    await WishlistModel.findOneAndUpdate(
      { wishlist_userId: convertToObjectIdMongodb(userId) },
      {
        $pull: {
          wishlist_products: {
            productId: convertToObjectIdMongodb(productId),
          },
        },
      },
      { new: true },
    );

    return WishlistService.getWishlist({ userId });
  }

  static async clearWishlist({ userId }) {
    await WishlistModel.findOneAndUpdate(
      { wishlist_userId: convertToObjectIdMongodb(userId) },
      { $set: { wishlist_products: [] } },
      { upsert: true },
    );

    return {
      products: [],
      productIds: [],
      total: 0,
    };
  }
}

module.exports = WishlistService;
