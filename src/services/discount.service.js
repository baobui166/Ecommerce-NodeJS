"use strict"

const { BadRequestError, NotFoundError } = require("../core/error.response")
const { convertToObjectIdMongodb } = require("../utils")
const { findAllProducts } = require("./product.service.xxx")
const {
  findAllDiscountCodeUnSelect,
  checkDiscount,
  checkDiscountExists, // assumed imported
  findAllDiscountCodeSelect
} = require("../model/repositories/discount.repo")
const discountModel = require("../model/discount.model")

class DiscountService {
  static async createDiscountCode(payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      max_value,
      uses_order, // unused? clarify
      shopId,
      max_uses,
      use_count,
      users_used,
      type,
      value,
      max_uses_per_user
    } = payload

    const today = new Date()

    if (today < new Date(start_date) || today > new Date(end_date)) {
      throw new BadRequestError("Discount code has expired!!!")
    }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError("Start day must be before end day!!!")
    }

    // Check if discount code already exists and is active
    const foundDiscount = await discountModel.findOne({
      discount_code: code,
      discount_shopId: convertToObjectIdMongodb(shopId)
    })

    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount already exists!!")
    }

    const newDiscount = await discountModel.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_code: code,
      discount_value: value,
      discount_min_order_value: min_order_value,
      discount_max_value: max_value,
      discount_start_date: start_date,
      discount_end_date: end_date,
      discount_max_uses: max_uses,
      discount_uses_count: use_count || 0,
      discount_users_count: users_used || [],
      discount_shopId: convertToObjectIdMongodb(shopId),
      discount_max_uses_per_users: max_uses_per_user || 0,
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === "all" ? [] : product_ids
    })

    return newDiscount
  }

  static async getAllDiscountCodeWithProduct({ code, shopId, limit, page }) {
    // kiem tra xem code discount co ton tai hay khong
    const foundDiscount = await discountModel.findOne({
      discount_code: code,
      discount_shopId: convertToObjectIdMongodb(shopId)
    })

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount not exist!!")
    }

    // lay thong tin can thiet tu code discount
    const { discount_applies_to, discount_product_ids } = foundDiscount
    let products

    if (discount_applies_to === "all") {
      products = await findAllProducts({
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPublish: true
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"]
      })
    } else if (discount_applies_to === "specific") {
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPublish: true
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"]
      })
    }

    return products
  }

  static async getAllDiscountCodeByShop(limit, page, shopId) {
    const discount = await findAllDiscountCodeSelect({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_is_active: true
      },
      select: ["discount_code", "discount_name"],
      model: discountModel
    })

    console.log("discount lay tu shop", discount)

    return discount
  }

  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscount({
      model: discountModel,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId)
      }
    })

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount not exist or expired!!")
    }

    const {
      discount_max_uses,
      discount_start_date,
      discount_end_date,
      discount_min_order_value,
      discount_max_uses_per_users,
      discount_users_count,
      discount_type,
      discount_value
    } = foundDiscount

    if (discount_max_uses <= 0) {
      throw new NotFoundError("Discount usage limit reached!!!")
    }

    const now = new Date()
    if (
      now < new Date(discount_start_date) ||
      now > new Date(discount_end_date)
    ) {
      throw new NotFoundError("Discount code has expired!!!")
    }

    let totalOrder = 0
    if (discount_min_order_value > 0) {
      totalOrder = products.reduce(
        (acc, product) => acc + product.quantity * product.price,
        0
      )

      if (totalOrder < discount_min_order_value) {
        throw new NotFoundError("Discount requires a minimum order value!!!")
      }
    }

    if (discount_max_uses_per_users > 0) {
      const userUseDiscount = discount_users_count.find(
        (user) => user.userId === userId
      )
      if (userUseDiscount) {
        throw new NotFoundError("User has already used this discount!!!")
      }
    }

    const amount =
      discount_type === "fixed_amount"
        ? discount_value
        : totalOrder * (discount_value / 100)

    return { totalOrder, discount: amount, totalPrice: totalOrder - amount }
  }

  static async deleteDiscountCode({ shopId, codeId }) {
    const foundDiscount = await discountModel.findOne({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId)
    })

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount not exist!!")
    }

    const deleted = await discountModel.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId)
    })

    return deleted
  }

  static async cancelDiscountCode({ codeId, shopId, userId }) {
    const foundDiscount = await checkDiscountExists({
      model: discountModel,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_code: codeId
      }
    })

    if (!foundDiscount) throw new NotFoundError("Discount not exist!!!")

    const result = await discountModel.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_count: { userId }
      },
      $inc: {
        discount_max_uses: 1,
        discount_uses_count: -1
      }
    })

    return result
  }
}

module.exports = DiscountService
