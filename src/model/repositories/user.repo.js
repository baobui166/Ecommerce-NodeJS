"use strict";

const userModel = require("../user.model");

/**
 * Create new user
 * @param {user_name} String
 * @returns object
 */
const createUser = async ({
  user_email,
  user_password,
  user_role,
  user_name,
  user_slug,
}) => {
  const user = await userModel.create({
    user_email,
    user_name,
    user_password,
    user_role,
    user_slug,
  });

  return user;
};

module.exports = { createUser };
