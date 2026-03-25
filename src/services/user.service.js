"use strict";

const userModel = require("../model/user.model");
const ErrorResponse = require("../core/error.response");
const { BadRequestError, AuthFailureError } = require("../core/error.response");
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

// V2: Register user with email + password (no OTP verification)
const createNewUserV2 = async ({ email, password }) => {
  // 0. Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new BadRequestError("Error: Invalid email format!");
  }

  // 1. Check email already exists
  const foundUser = await userModel.findOne({ user_email: email }).lean();
  if (foundUser) {
    throw new BadRequestError("Error: Email already registered!");
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Create new user (user_role will be assigned by default in schema or handled separately)
  const newUser = await userModel.create({
    user_slug: email.split("@")[0],
    user_name: email.split("@")[0],
    user_email: email,
    user_password: hashedPassword,
  });

  if (!newUser) {
    throw new BadRequestError("Error: Cannot create new user!");
  }

  // 4. Create RSA key pair for JWT
  const publicKey = crypto.randomBytes(68).toString("hex");
  const privateKey = crypto.randomBytes(68).toString("hex");

  // 5. Store key token
  const keyStore = await KeyTokenService.createKeyToken({
    userId: newUser._id,
    publicKey,
    privateKey,
  });

  if (!keyStore) {
    throw new BadRequestError("Error: Keystore creation failed!");
  }

  // 6. Create access + refresh token pair
  const tokens = await createTokenPair(
    { userId: newUser._id, email },
    publicKey,
    privateKey,
  );

  // Controller đã bọc trong SuccessResponse.metadata — không bọc thêm lớp metadata
  return {
    user: getInfoData({
      fields: ["_id", "user_slug", "user_name", "user_email", "user_status"],
      object: newUser,
    }),
    tokens,
  };
};

// V2: Login user with email + password (no OTP)
const loginUserV2 = async ({ email, password }) => {
  // 0. Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new BadRequestError("Error: Invalid email format!");
  }

  // 1. Find user by email
  const foundUser = await userModel.findOne({ user_email: email }).lean();
  if (!foundUser) {
    throw new AuthFailureError("Error: Email not registered!");
  }

  // 2. Match password
  const match = await bcrypt.compare(password, foundUser.user_password);
  if (!match) {
    throw new AuthFailureError("Error: Incorrect password!");
  }

  // 3. Create RSA key pair for JWT
  const publicKey = crypto.randomBytes(68).toString("hex");
  const privateKey = crypto.randomBytes(68).toString("hex");

  // 4. Create access + refresh token pair
  const tokens = await createTokenPair(
    { userId: foundUser._id, email },
    publicKey,
    privateKey,
  );

  // 5. Store key token
  await KeyTokenService.createKeyToken({
    userId: foundUser._id,
    publicKey,
    privateKey,
    refreshToken: tokens.refreshToken,
  });

  // Controller đã bọc trong SuccessResponse.metadata — không bọc thêm lớp metadata
  return {
    user: getInfoData({
      fields: ["_id", "user_slug", "user_name", "user_email", "user_status"],
      object: foundUser,
    }),
    tokens,
  };
};

module.exports = { newUser, checkLoginEmailToken, createNewUserV2, loginUserV2 };
