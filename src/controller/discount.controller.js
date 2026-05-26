"use strict";
const { SuccessResponse } = require("../core/success.response");

const DiscountService = require("../services/discount.service");
const { publishEvent } = require("../services/eventBus.service");

class DiscountController {
  createDiscountCode = async (req, res, next) => {
    const discount = await DiscountService.createDiscountCode({
      ...req.body,
      shopId: req.user.userId,
    });

    if (discount?.discount_is_active) {
      publishEvent({
        type: "promotion.created",
        metadata: {
          discountId: discount._id,
          code: discount.discount_code,
          name: discount.discount_name,
          description: discount.discount_description,
          isActive: discount.discount_is_active,
        },
      }).catch(() => {});
    }

    new SuccessResponse({
      message: "Successfull Code Generation!!!!",
      metadata: discount,
    }).send(res);
  };

  getAllDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfull Code Found!!!!",
      metadata: await DiscountService.getAllDiscountCodeByShop({
        ...req.query,
        shopId: req.user.userId,
      }),
    }).send(res);
  };

  getPublicDiscounts = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfull Active Discounts Found!!!!",
      metadata: await DiscountService.getPublicDiscounts({
        ...req.query,
      }),
    }).send(res);
  };

  getPromotionAnalytics = async (req, res, next) => {
    new SuccessResponse({
      message: "Get promotion analytics success!!!!",
      metadata: await DiscountService.getDiscountAnalytics({
        shopId: req.user.userId,
      }),
    }).send(res);
  };

  updateDiscountCode = async (req, res, next) => {
    const discount = await DiscountService.updateDiscountCode({
      ...req.body,
      discountId: req.params.id,
      shopId: req.user.userId,
    });

    if (discount?.discount_is_active) {
      publishEvent({
        type: "promotion.updated",
        metadata: {
          discountId: discount._id,
          code: discount.discount_code,
          name: discount.discount_name,
          description: discount.discount_description,
          isActive: discount.discount_is_active,
        },
      }).catch(() => {});
    }

    new SuccessResponse({
      message: "Update discount success!!!!",
      metadata: discount,
    }).send(res);
  };

  deleteDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: "Delete discount success!!!!",
      metadata: await DiscountService.deleteDiscountCodeById({
        discountId: req.params.id,
        shopId: req.user.userId,
      }),
    }).send(res);
  };

  getDiscountAmount = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfull Code Found!!!!",
      metadata: await DiscountService.getDiscountAmount({
        ...req.body,
      }),
    }).send(res);
  };

  getAllDiscountCodeWithProducts = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfull Code Found!!!!",
      metadata: await DiscountService.getAllDiscountCodeWithProduct({
        ...req.query,
      }),
    }).send(res);
  };
}

module.exports = new DiscountController();
