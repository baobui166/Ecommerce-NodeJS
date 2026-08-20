"use strict";

const userModel = require("../model/user.model");
const shopModel = require("../model/shop.model");
const { AuthFailureError, ForbiddenError } = require("../core/error.response");

// Shop/admin tokens carry a userId that lives in the Shop collection, not
// User — looking them up via userModel always 404'd, which meant every
// shop/admin request through this middleware (e.g. the notification bell)
// was silently rejected with a 401.
const getAuthenticatedUserRecord = async (req) => {
  const userId = req.user?.userId;
  if (!userId) throw new AuthFailureError("Invalid user session");

  if (req.user?.type === "shop") {
    const shop = await shopModel
      .findById(userId)
      .select("_id status email")
      .lean();
    if (!shop) throw new AuthFailureError("Shop account not found");
    return { _id: shop._id, user_status: shop.status === "active" ? "active" : "blocked", user_email: shop.email };
  }

  const user = await userModel
    .findById(userId)
    .select("_id user_status user_email")
    .lean();

  if (!user) throw new AuthFailureError("User account not found");
  return user;
};

const requireUserNotBlocked = async (req, res, next) => {
  const user = await getAuthenticatedUserRecord(req);

  if (user.user_status === "blocked") {
    throw new ForbiddenError(
      "Your account has been blocked. Please contact support.",
    );
  }

  req.authenticatedUser = user;
  return next();
};

const requireActiveUser = async (req, res, next) => {
  const user = await getAuthenticatedUserRecord(req);

  if (user.user_status === "blocked") {
    throw new ForbiddenError(
      "Your account has been blocked. Please contact support.",
    );
  }

  if (user.user_status === "pending") {
    throw new ForbiddenError(
      "Your account is pending verification. Please verify your account before using this feature.",
    );
  }

  if (user.user_status !== "active") {
    throw new ForbiddenError("Your account is not active.");
  }

  req.authenticatedUser = user;
  return next();
};

module.exports = {
  requireActiveUser,
  requireUserNotBlocked,
};
