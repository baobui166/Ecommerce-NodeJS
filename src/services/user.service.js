"use strict";

const userModel = require("../model/user.model");
const ErrorResponse = require("../core/error.response");
const { sendEmailToken } = require("./email.service");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { checkEmailToken } = require("./otp.service");
const KeyTokenService = require("./ketToken.service");
const shopModel = require("../model/shop.model");
const { createTokenPair } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const { createUser } = require("../model/repositories/user.repo");

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

const checkLoginEmailToken = async ({ token = null }) => {
  try {
    // check token in model otp
    const { otp_email: email, otp_token } = checkEmailToken({ token });
    if (!email) throw new ErrorResponse("Token not found");

    // check email
    const hasUser = await findEmailWithLogin({ email });
    if (hasUser) throw new ErrorResponse("Email already exists");

    // new user
    const hasedPassword = await bcrypt.hash(email, 10);
    // step 3 create new user
    const newUser = await createUser({
      user_slug: "xxxxx",
      user_name: email,
      user_password: hasedPassword,
      user_email: email,
      user_role: "active",
    });

    // step 4 check new user and create token
    if (newUser) {
      // create pub and private version 2
      const publicKey = crypto.randomBytes(68).toString("hex");
      const privateKey = crypto.randomBytes(68).toString("hex");

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newUser._id,
        publicKey,
        privateKey,
      });

      if (!keyStore) {
        throw new BadRequestError("Error: Keystore Error!");
      }

      // create token
      const tokens = await createTokenPair(
        { userId: newUser._id, email },
        publicKey,
        privateKey,
      );

      return {
        code: 201,
        message: "veryfy successfully",
        metadata: {
          user: getInfoData({
            fields: ["_id", "user_name", "user_email"],
            object: newUser,
          }),
          tokens,
        },
      };
    }
  } catch (error) {
    throw new ErrorResponse(`Error create new user: ${error} `);
  }
};

const findEmailWithLogin = async ({ email }) => {
  const user = userModel.findOne({ user_email: email }).lean();
  return user;
};

module.exports = { newUser, checkLoginEmailToken };
