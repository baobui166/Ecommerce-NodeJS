"use strict";

const { ForbiddenError } = require("../core/error.response");
const shopModel = require("../model/shop.model");

const ADMIN_ROLES = ["ADMIN", "SHOP"];

const requireAdmin = async (req, res, next) => {
  try {
    const role = req.user?.role;
    const type = req.user?.type;

    if (role === "admin" || type === "shop") return next();

    const userId = req.user?.userId;
    if (userId) {
      const shop = await shopModel
        .findById(userId)
        .select("roles")
        .lean();
      const roles = shop?.roles || [];
      if (roles.some((shopRole) => ADMIN_ROLES.includes(shopRole))) {
        return next();
      }
    }

    throw new ForbiddenError("Admin permission required");
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAdmin };
