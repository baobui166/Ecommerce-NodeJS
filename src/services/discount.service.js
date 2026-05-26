"use strict";

const { Types } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../core/error.response");
const { convertToObjectIdMongodb } = require("../utils");
const { parsePagination, buildPagination } = require("../utils/pagination");
const ProductService = require("./product.service.xxx");
const {
  checkDiscount,
  checkDiscountExists, // assumed imported
} = require("../model/repositories/discount.repo");
const discountModel = require("../model/discount.model");

class DiscountService {
  static normalizeDiscountPayload(payload) {
    const code = String(payload.code || payload.discount_code || "")
      .trim()
      .toUpperCase();
    const startDate = new Date(payload.start_date || payload.discount_start_date);
    const endDate = new Date(payload.end_date || payload.discount_end_date);
    const type = payload.type || payload.discount_type;
    const appliesTo = payload.applies_to || payload.discount_applies_to || "all";
    const productIds = Array.isArray(payload.product_ids || payload.discount_product_ids)
      ? (payload.product_ids || payload.discount_product_ids).filter(Boolean)
      : [];

    if (!code) throw new BadRequestError("Discount code is required", 400);
    if (!payload.name && !payload.discount_name) {
      throw new BadRequestError("Discount name is required", 400);
    }
    if (!payload.description && !payload.discount_description) {
      throw new BadRequestError("Discount description is required", 400);
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestError("Discount start and end dates are required", 400);
    }
    if (startDate >= endDate) {
      throw new BadRequestError("Start day must be before end day!!!", 400);
    }
    if (endDate < new Date()) {
      throw new BadRequestError("Discount code has expired!!!", 400);
    }
    if (!["fixed_amount", "percentage"].includes(type)) {
      throw new BadRequestError("Discount type must be fixed_amount or percentage", 400);
    }
    if (!["all", "specific"].includes(appliesTo)) {
      throw new BadRequestError("Discount applies_to must be all or specific", 400);
    }
    if (appliesTo === "specific" && productIds.length === 0) {
      throw new BadRequestError("Specific discounts require at least one product", 400);
    }

    return {
      discount_name: payload.name || payload.discount_name,
      discount_description: payload.description || payload.discount_description,
      discount_type: type,
      discount_code: code,
      discount_value: Number(payload.value ?? payload.discount_value ?? 0),
      discount_min_order_value: Number(payload.min_order_value ?? payload.discount_min_order_value ?? 0),
      discount_max_value: Number(payload.max_value ?? payload.discount_max_value ?? 0),
      discount_start_date: startDate,
      discount_end_date: endDate,
      discount_max_uses: Number(payload.max_uses ?? payload.discount_max_uses ?? 0),
      discount_uses_count: Number(payload.use_count ?? payload.discount_uses_count ?? 0),
      discount_users_count: payload.users_used || payload.discount_users_count || [],
      discount_max_uses_per_users: Number(payload.max_uses_per_user ?? payload.discount_max_uses_per_users ?? 0),
      discount_is_active: Boolean(payload.is_active ?? payload.discount_is_active ?? true),
      discount_applies_to: appliesTo,
      discount_product_ids: appliesTo === "all" ? [] : productIds,
    };
  }

  static async createDiscountCode(payload) {
    const { shopId } = payload;
    const normalized = this.normalizeDiscountPayload(payload);

    // Check if discount code already exists and is active
    const foundDiscount = await discountModel.findOne({
      discount_code: normalized.discount_code,
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount already exists!!");
    }

    const newDiscount = await discountModel.create({
      ...normalized,
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    return newDiscount;
  }

  static async getAllDiscountCodeWithProduct({ code, shopId, limit, page }) {
    const pagination = parsePagination({ page, limit, defaultLimit: 20, maxLimit: 50 });
    const now = new Date();

    // kiem tra xem code discount co ton tai hay khong
    const foundDiscount = await discountModel.findOne({
      discount_code: String(code || "").trim().toUpperCase(),
      discount_shopId: convertToObjectIdMongodb(shopId),
      discount_is_active: true,
      discount_start_date: { $lte: now },
      discount_end_date: { $gte: now },
      $expr: { $lt: ["$discount_uses_count", "$discount_max_uses"] },
    });

    if (!foundDiscount) {
      throw new NotFoundError("Discount not exist!!");
    }

    // lay thong tin can thiet tu code discount
    const { discount_applies_to, discount_product_ids } = foundDiscount;
    let products;

    if (discount_applies_to === "all") {
      products = await ProductService.findAllProducts({
        isPublic: true,
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPublish: true,
        },
        limit: pagination.limit,
        page: pagination.page,
        sort: "ctime",
        select: [
          "product_name",
          "product_thumb",
          "product_images",
          "product_descriptions",
          "product_price",
          "product_quantity",
          "product_type",
          "product_shop",
          "product_attributes",
          "product_ratingAverage",
          "product_reviewCount",
        ],
      });
    } else if (discount_applies_to === "specific") {
      products = await ProductService.findAllProducts({
        isPublic: true,
        filter: {
          _id: { $in: discount_product_ids },
          isPublish: true,
        },
        limit: pagination.limit,
        page: pagination.page,
        sort: "ctime",
        select: [
          "product_name",
          "product_thumb",
          "product_images",
          "product_descriptions",
          "product_price",
          "product_quantity",
          "product_type",
          "product_shop",
          "product_attributes",
          "product_ratingAverage",
          "product_reviewCount",
        ],
      });
    }

    return products;
  }

  static async getAllDiscountCodeByShop({
    limit = 20,
    page = 1,
    shopId,
    search = "",
    status = "",
  }) {
    const pagination = parsePagination({ page, limit, defaultLimit: 20, maxLimit: 100 });
    const filter = {
      discount_shopId: convertToObjectIdMongodb(shopId),
    };

    if (String(search || "").trim()) {
      const keyword = String(search).trim();
      filter.$or = [
        { discount_code: { $regex: keyword, $options: "i" } },
        { discount_name: { $regex: keyword, $options: "i" } },
      ];
    }

    if (status === "active") {
      filter.discount_is_active = true;
      filter.discount_start_date = { $lte: new Date() };
      filter.discount_end_date = { $gte: new Date() };
    }

    if (status === "inactive") {
      filter.discount_is_active = false;
    }

    if (status === "scheduled") {
      filter.discount_is_active = true;
      filter.discount_start_date = { $gt: new Date() };
    }

    if (status === "expired") {
      filter.discount_end_date = { $lt: new Date() };
    }

    const [discounts, total] = await Promise.all([
      discountModel
        .find(filter)
        .populate("discount_product_ids", "product_name product_thumb product_price")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      discountModel.countDocuments(filter),
    ]);

    return {
      discounts,
      pagination: buildPagination({ ...pagination, total }),
    };
  }

  static async getDiscountAnalytics({ shopId }) {
    const now = new Date();
    const filter = {
      discount_shopId: convertToObjectIdMongodb(shopId),
    };

    const discounts = await discountModel.find(filter).lean();
    const totalPromotions = discounts.length;
    const active = discounts.filter(
      (discount) =>
        discount.discount_is_active &&
        new Date(discount.discount_start_date) <= now &&
        new Date(discount.discount_end_date) >= now,
    ).length;
    const scheduled = discounts.filter(
      (discount) =>
        discount.discount_is_active && new Date(discount.discount_start_date) > now,
    ).length;
    const expired = discounts.filter(
      (discount) => new Date(discount.discount_end_date) < now,
    ).length;
    const inactive = discounts.filter((discount) => !discount.discount_is_active).length;
    const totalUses = discounts.reduce(
      (sum, discount) => sum + Number(discount.discount_uses_count || 0),
      0,
    );
    const maxUses = discounts.reduce(
      (sum, discount) => sum + Number(discount.discount_max_uses || 0),
      0,
    );
    const topUsedDiscounts = [...discounts]
      .sort((a, b) => Number(b.discount_uses_count || 0) - Number(a.discount_uses_count || 0))
      .slice(0, 5)
      .map((discount) => ({
        _id: discount._id,
        discount_name: discount.discount_name,
        discount_code: discount.discount_code,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        discount_uses_count: discount.discount_uses_count,
        discount_max_uses: discount.discount_max_uses,
        discount_is_active: discount.discount_is_active,
      }));

    return {
      totalPromotions,
      active,
      scheduled,
      expired,
      inactive,
      totalUses,
      usageRate: maxUses > 0 ? Math.round((totalUses / maxUses) * 100) : 0,
      topUsedDiscounts,
    };
  }

  static async getPublicDiscounts({ limit = 12, page = 1, shopId }) {
    const pagination = parsePagination({ page, limit, defaultLimit: 12, maxLimit: 50 });
    const now = new Date();
    const filter = {
      discount_is_active: true,
      discount_start_date: { $lte: now },
      discount_end_date: { $gte: now },
      $expr: { $lt: ["$discount_uses_count", "$discount_max_uses"] },
    };

    if (shopId) {
      if (!Types.ObjectId.isValid(shopId)) {
        throw new BadRequestError("Invalid shop id", 400);
      }
      filter.discount_shopId = convertToObjectIdMongodb(shopId);
    }

    const [discounts, total] = await Promise.all([
      discountModel
        .find(filter)
        .populate("discount_product_ids", "product_name product_thumb product_price product_type")
        .sort({ discount_end_date: 1, createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      discountModel.countDocuments(filter),
    ]);

    return {
      discounts,
      pagination: buildPagination({ ...pagination, total }),
    };
  }

  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscount({
      model: discountModel,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount not exist or expired!!");
    }

    const {
      discount_max_uses,
      discount_start_date,
      discount_end_date,
      discount_min_order_value,
      discount_max_uses_per_users,
      discount_users_count,
      discount_type,
      discount_value,
    } = foundDiscount;

    if (discount_max_uses <= 0) {
      throw new NotFoundError("Discount usage limit reached!!!");
    }

    const now = new Date();
    if (
      now < new Date(discount_start_date) ||
      now > new Date(discount_end_date)
    ) {
      throw new NotFoundError("Discount code has expired!!!");
    }

    let totalOrder = products.reduce(
      (acc, product) => acc + product.quantity * product.price,
      0,
    );
    if (discount_min_order_value > 0) {
      if (totalOrder < discount_min_order_value) {
        throw new NotFoundError("Discount requires a minimum order value!!!");
      }
    }

    if (discount_max_uses_per_users > 0) {
      const userUseDiscount = discount_users_count.find(
        (user) => user.userId === userId,
      );
      if (userUseDiscount) {
        throw new NotFoundError("User has already used this discount!!!");
      }
    }

    const rawAmount =
      discount_type === "fixed_amount"
        ? discount_value
        : totalOrder * (discount_value / 100);
    const amount = Math.min(rawAmount, foundDiscount.discount_max_value || rawAmount, totalOrder);

    return { totalOrder, discount: amount, totalPrice: totalOrder - amount };
  }

  static async deleteDiscountCode({ shopId, codeId }) {
    const foundDiscount = await discountModel.findOne({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount not exist!!");
    }

    const deleted = await discountModel.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    return deleted;
  }

  static async updateDiscountCode({ shopId, discountId, ...payload }) {
    if (!Types.ObjectId.isValid(discountId)) {
      throw new BadRequestError("Invalid discount id", 400);
    }

    const foundDiscount = await discountModel.findOne({
      _id: convertToObjectIdMongodb(discountId),
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    if (!foundDiscount) {
      throw new NotFoundError("Discount not exist!!");
    }

    const normalized = this.normalizeDiscountPayload({
      code: payload.code || foundDiscount.discount_code,
      name: payload.name || foundDiscount.discount_name,
      description: payload.description || foundDiscount.discount_description,
      type: payload.type || foundDiscount.discount_type,
      value: payload.value ?? foundDiscount.discount_value,
      max_value: payload.max_value ?? foundDiscount.discount_max_value,
      start_date: payload.start_date || foundDiscount.discount_start_date,
      end_date: payload.end_date || foundDiscount.discount_end_date,
      max_uses: payload.max_uses ?? foundDiscount.discount_max_uses,
      use_count: payload.use_count ?? foundDiscount.discount_uses_count,
      users_used: payload.users_used || foundDiscount.discount_users_count,
      min_order_value: payload.min_order_value ?? foundDiscount.discount_min_order_value,
      max_uses_per_user: payload.max_uses_per_user ?? foundDiscount.discount_max_uses_per_users,
      is_active: payload.is_active ?? foundDiscount.discount_is_active,
      applies_to: payload.applies_to || foundDiscount.discount_applies_to,
      product_ids: payload.product_ids || foundDiscount.discount_product_ids,
    });

    const duplicate = await discountModel.findOne({
      _id: { $ne: foundDiscount._id },
      discount_code: normalized.discount_code,
      discount_shopId: convertToObjectIdMongodb(shopId),
      discount_is_active: true,
    });

    if (duplicate) {
      throw new BadRequestError("Discount already exists!!", 400);
    }

    return discountModel
      .findByIdAndUpdate(foundDiscount._id, { $set: normalized }, { new: true })
      .populate("discount_product_ids", "product_name product_thumb product_price");
  }

  static async deleteDiscountCodeById({ shopId, discountId }) {
    if (!Types.ObjectId.isValid(discountId)) {
      throw new BadRequestError("Invalid discount id", 400);
    }

    const deleted = await discountModel.findOneAndDelete({
      _id: convertToObjectIdMongodb(discountId),
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    if (!deleted) {
      throw new NotFoundError("Discount not exist!!");
    }

    return deleted;
  }

  static async cancelDiscountCode({ codeId, shopId, userId }) {
    const foundDiscount = await checkDiscountExists({
      model: discountModel,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_code: codeId,
      },
    });

    if (!foundDiscount) throw new NotFoundError("Discount not exist!!!");

    const result = await discountModel.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_count: { userId },
      },
      $inc: {
        discount_max_uses: 1,
        discount_uses_count: -1,
      },
    });

    return result;
  }
}

module.exports = DiscountService;
