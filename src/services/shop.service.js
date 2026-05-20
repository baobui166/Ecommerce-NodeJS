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
  updateSettings,
};
