"use strict";

const userModel = require("../model/user.model");
const { AuthFailureError, ForbiddenError } = require("../core/error.response");

const getAuthenticatedUserRecord = async (req) => {
  const userId = req.user?.userId;
  if (!userId) throw new AuthFailureError("Invalid user session");

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
