"use strict";

const userModel = require("../model/user.model");
const ErrorResponse = require("../core/error.response");
const { sendEmailToken } = require("./email.service");

const newUser = async (
  { email = null, capcha = null }, // optional
) => {
  // check user exist in database
  const user = await userModel.findOne({ user_email: email }).lean();

  // if exitst
  if (user) {
    return ErrorResponse({ message: "Email already exitst!!!" });
  }

  // send token via email

  const result = await sendEmailToken({ email });

  return {
    message: "verify email user.",
    metadata: { token: result },
  };
};

module.exports = { newUser };
