"use strict";

const { SuccessResponse } = require("../core/success.response");
const userModel = require("../model/user.model");
const shopModel = require("../model/shop.model");

class ProfileController {
  // admin
  profiles = async (req, res, next) => {
    new SuccessResponse({
      message: "View all profiles",
      metadata: await userModel.find({}).select("-user_password").lean(),
    }).send(res);
  };

  // shop
  profile = async (req, res, next) => {
    const isShop = req.user?.type === "shop";
    const profile = isShop
      ? await shopModel.findById(req.user.userId).select("-password").lean()
      : await userModel.findById(req.user.userId).select("-user_password").lean();

    new SuccessResponse({
      message: "View profile",
      metadata: { user: profile },
    }).send(res);
  };
}

module.exports = new ProfileController();
