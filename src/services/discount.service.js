"use strict"

const { min } = require("lodash")
const { BadRequestError, NotFoundError } = require("../core/error.response")
const discountModel = require("../model/discount.model")
const { convertToObjectIdMongodb } = require("../utils")
const { findAllProducts } = require("./product.service.xxx")
const {
  findAllDiscountCodeUnSelect
} = require("../model/repositories/discount.repo")

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
      uses_order,
      shopId,
      max_uses,
      use_count,
      users_used
    } = payload

    const today = new Date()

    // check data
    if (today < new Date(start_date) || today > new Date(end_date)) {
      throw new BadRequestError("Discount code has expried!!!")
    }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError("Start day must be before end day!!!")
    }

    // create index for discount code
    const foundDiscount = await discountModel
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId)
      })
      .lean()

    if (!foundDiscount && !foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount exist!!")
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
      discount_uses_count: use_count,
      discount_users_count: users_used,
      discount_shopId: shopId,
      discount_max_uses_per_users: max_uses_per_user,
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === "all" ? [] : product_ids
    })

    return newDiscount
  }

  static async updateDiscountCode() {}

  /*
	Get all discount code available  with products
  */

  static async getAllDiscountCodeWithProduct({
    code,
    shopId,
    userId,
    limit,
    page
  }) {
    // create index for discount_code
    const foundDiscount = await discountModel
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId)
      })
      .lean()

    if (!foundDiscount && !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount not exist!!")
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount
    let products

    if (discount_applies_to === "all") {
      // get all product
      products = await findAllProducts({
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPulished: true
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"]
      })
    }

    if (discount_applies_to === "specific") {
      // get  product id
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPulished: true
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"]
      })
    }

    return products
  }

  // Get All discount code of shop
  static async getAllDiscountCodeByShop(limit, page, shopId) {
    const discount = await findAllDiscountCodeUnSelect({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: shopId,
        discount_is_active: true
      },
      unselect: ["_v", "discount_shopId"],
      model: discountModel
    })

    return discount
  }
}
