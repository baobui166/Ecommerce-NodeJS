"use strict";

const shopModel = require("../model/shop.model");
const { BadRequestError } = require("../core/error.response");

const defaultSettings = (shop = {}) => ({
  shop_name: shop.name || "Ecommerce Shop",
  shop_email: shop.email || "",
  shop_phone: "",
  shop_address: "",
  shop_description: "",
  shop_logo: "",
  shop_banner: "",
  currency: "VND",
  language: "vi",
  timezone: "Asia/Ho_Chi_Minh",
  tax_rate: 0,
  min_order_amount: 0,
  free_shipping_threshold: 0,
  shipping_free_enabled: false,
  shipping_standard_fee: 30000,
  shipping_express_fee: 60000,
  shipping_express_min_order: 200000,
  notification_email: true,
  notification_sms: false,
  maintenance_mode: false,
  ...(shop.settings || {}),
});

const findEmail = async ({
  email,
  select = { email: 1, password: 2, status: 1, roles: 1 },
}) => {
  const data = await shopModel.findOne({ email }).lean();

  return data;
};

const getSettings = async ({ shopId }) => {
  const shop = await shopModel.findById(shopId).lean();
  if (!shop) throw new BadRequestError("Shop not found");
  return defaultSettings(shop);
};

const getPublicSettings = async () => {
  const shop = await shopModel.findOne({}).lean();
  const settings = defaultSettings(shop || {});

  return {
    shop_name: settings.shop_name,
    currency: settings.currency,
    free_shipping_threshold: settings.free_shipping_threshold,
    shipping_free_enabled: settings.shipping_free_enabled,
    shipping_standard_fee: settings.shipping_standard_fee,
    shipping_express_fee: settings.shipping_express_fee,
    shipping_express_min_order: settings.shipping_express_min_order,
  };
};

const updateSettings = async ({ shopId, payload }) => {
  const shop = await shopModel.findById(shopId);
  if (!shop) throw new BadRequestError("Shop not found");

  shop.settings = {
    ...defaultSettings(shop.toObject()),
    ...payload,
  };

  if (payload.shop_name) shop.name = payload.shop_name;
  if (payload.shop_email) shop.email = payload.shop_email;

  await shop.save();
  return defaultSettings(shop.toObject());
};

module.exports = {
  findEmail,
  getSettings,
  getPublicSettings,
  updateSettings,
};
