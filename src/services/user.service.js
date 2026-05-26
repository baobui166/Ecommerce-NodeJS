"use strict";

const userModel = require("../model/user.model");
const {
  BadRequestError,
  AuthFailureError,
  NotFoundError,
} = require("../core/error.response");
const { sendEmailToken } = require("./email.service");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { checkEmailToken } = require("./otp.service");
const KeyTokenService = require("./ketToken.service");
const shopModel = require("../model/shop.model");
const { createTokenPair } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const { parsePagination, buildPagination } = require("../utils/pagination");

const USER_PUBLIC_FIELDS = [
  "_id",
  "user_slug",
  "user_name",
  "user_email",
  "user_phone",
  "user_sex",
  "user_avatar",
  "user_date_of_birth",
  "user_role",
  "user_status",
  "user_authProviders",
  "user_emailVerified",
];

const getPublicUser = (user) =>
  getInfoData({
    fields: USER_PUBLIC_FIELDS,
    object: typeof user?.toObject === "function" ? user.toObject() : user,
  });

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const validateEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    throw new BadRequestError("Error: Invalid email format!");
  }

  return normalizedEmail;
};

const getAllowedGoogleClientIds = () =>
  String(process.env.GOOGLE_CLIENT_ID || "")
    .split(",")
    .map((clientId) => clientId.trim())
    .filter(Boolean);

const verifyGoogleCredential = async (credential) => {
  if (!credential) {
    throw new BadRequestError("Google credential is required!");
  }

  const allowedClientIds = getAllowedGoogleClientIds();
  if (allowedClientIds.length === 0) {
    throw new BadRequestError("Google login is not configured!");
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );

  if (!response.ok) {
    throw new AuthFailureError("Invalid Google credential!");
  }

  const payload = await response.json();
  if (!allowedClientIds.includes(payload.aud)) {
    throw new AuthFailureError("Google credential audience is invalid!");
  }

  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw new AuthFailureError("Google email is not verified!");
  }

  if (!payload.sub || !payload.email) {
    throw new AuthFailureError("Google profile is incomplete!");
  }

  return payload;
};

const issueUserTokens = async ({ user, email, authProvider = "local" }) => {
  const publicKey = crypto.randomBytes(68).toString("hex");
  const privateKey = crypto.randomBytes(68).toString("hex");
  const tokens = await createTokenPair(
    {
      userId: user._id,
      email,
      role: "customer",
      type: "user",
      authProvider,
    },
    publicKey,
    privateKey,
  );

  await KeyTokenService.createKeyToken({
    userId: user._id,
    publicKey,
    privateKey,
    refreshToken: tokens.refreshToken,
  });

  return tokens;
};

const newUser = async (
  { email = null, capcha = null }, // optional
) => {
  const result = await requestAccountVerification({ email });

  return {
    message: "Verification email sent.",
    metadata: result,
  };
};

const checkLoginEmailToken = async ({ token = null }) => {
  return confirmAccountVerification({ token });
};

const findEmailWithLogin = async ({ email }) => {
  const user = userModel.findOne({ user_email: email }).lean();
  return user;
};

const createNewUserV2 = async ({ email, password }) => {
  email = validateEmail(email);

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
    user_authProviders: ["local"],
    user_emailVerified: false,
    user_status: "pending",
  });

  if (!newUser) {
    throw new BadRequestError("Error: Cannot create new user!");
  }

  const tokens = await issueUserTokens({ user: newUser, email });
  await sendEmailToken({ email }).catch(() => null);

  // Controller đã bọc trong SuccessResponse.metadata — không bọc thêm lớp metadata
  return {
    user: getPublicUser(newUser),
    tokens,
  };
};

// V2: Login user with email + password (no OTP)
const loginUserV2 = async ({ email, password }) => {
  email = validateEmail(email);

  // 1. Find user by email
  const foundUser = await userModel.findOne({ user_email: email }).lean();
  if (!foundUser) {
    throw new AuthFailureError("Error: Email not registered!");
  }

  if (foundUser.user_status === "blocked") {
    throw new AuthFailureError("Your account has been blocked!");
  }

  // 2. Match password
  if (!foundUser.user_password) {
    throw new AuthFailureError("Please sign in with Google for this account!");
  }

  const match = await bcrypt.compare(password, foundUser.user_password);
  if (!match) {
    throw new AuthFailureError("Error: Incorrect password!");
  }

  const tokens = await issueUserTokens({ user: foundUser, email });

  // Controller đã bọc trong SuccessResponse.metadata — không bọc thêm lớp metadata
  return {
    user: getPublicUser(foundUser),
    tokens,
  };
};

const requestAccountVerification = async ({ email }) => {
  const normalizedEmail = validateEmail(email);
  const user = await userModel.findOne({ user_email: normalizedEmail });

  if (!user) {
    throw new NotFoundError("Account not found!");
  }

  if (user.user_status === "blocked") {
    throw new AuthFailureError("Your account has been blocked!");
  }

  if (user.user_status === "active" || user.user_emailVerified) {
    return {
      alreadyVerified: true,
      user: getPublicUser(user),
    };
  }

  const emailToken = await sendEmailToken({ email: normalizedEmail });

  return {
    alreadyVerified: false,
    email: normalizedEmail,
    expiresInSeconds: emailToken?.expiresInSeconds || 15 * 60,
    ...(emailToken?.devToken ? { devToken: emailToken.devToken } : {}),
  };
};

const confirmAccountVerification = async ({ token }) => {
  const normalizedToken = String(token || "").trim();

  if (!normalizedToken) {
    throw new BadRequestError("Verification code is required!");
  }

  const { otp_email: email } = await checkEmailToken({ token: normalizedToken });
  const user = await userModel.findOne({ user_email: email });

  if (!user) {
    throw new NotFoundError("Account not found!");
  }

  if (user.user_status === "blocked") {
    throw new AuthFailureError("Your account has been blocked!");
  }

  user.user_status = "active";
  user.user_emailVerified = true;
  await user.save();

  return {
    user: getPublicUser(user),
  };
};

const loginWithGoogle = async ({ credential }) => {
  const profile = await verifyGoogleCredential(credential);
  const email = String(profile.email).toLowerCase();
  const googleId = String(profile.sub);
  const displayName = String(profile.name || email.split("@")[0]);
  const avatar = String(profile.picture || "");

  let user = await userModel.findOne({
    $or: [{ user_googleId: googleId }, { user_email: email }],
  });
  let isNewUser = false;

  if (!user) {
    user = await userModel.create({
      user_slug: email.split("@")[0],
      user_name: displayName,
      user_email: email,
      user_googleId: googleId,
      user_avatar: avatar,
      user_password: "",
      user_authProviders: ["google"],
      user_emailVerified: true,
      user_status: "active",
    });
    isNewUser = true;
  } else {
    if (user.user_status === "blocked") {
      throw new AuthFailureError("Your account has been blocked!");
    }

    user.user_googleId = user.user_googleId || googleId;
    user.user_emailVerified = true;
    if (user.user_status === "pending") {
      user.user_status = "active";
    }
    user.user_name = user.user_name || displayName;
    user.user_avatar = user.user_avatar || avatar;
    user.user_authProviders = Array.from(
      new Set([...(user.user_authProviders || []), "google"]),
    );
    await user.save();
  }

  const tokens = await issueUserTokens({
    user,
    email,
    authProvider: "google",
  });

  return {
    user: getPublicUser(user),
    tokens,
    isNewUser,
  };
};

// admin function
const getAllUsers = async ({ limit = 10, page = 1, search = "", status = "" }) => {
  const pagination = parsePagination({ page, limit, defaultLimit: 10, maxLimit: 100 });
  const filter = {};
  const normalizedSearch = String(search || "").trim();
  const normalizedStatus = String(status || "").trim();

  if (normalizedSearch) {
    filter.$or = [
      { user_name: { $regex: normalizedSearch, $options: "i" } },
      { user_email: { $regex: normalizedSearch, $options: "i" } },
      { user_phone: { $regex: normalizedSearch, $options: "i" } },
    ];
  }

  if (["pending", "active", "blocked"].includes(normalizedStatus)) {
    filter.user_status = normalizedStatus;
  }

  const total = await userModel.countDocuments(filter);

  const users = await userModel
    .find(filter)
    .select("-user_password")
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ createdAt: -1 })
    .lean();

  return {
    users,
    pagination: buildPagination({ ...pagination, total }),
  };
};

const getUserById = async (userId) => {
  const user = await userModel
    .findOne({ _id: userId })
    .select("-user_password")
    .lean();

  if (!user) throw new Error("User not found");

  return user;
};

const updateUserStatusById = async (userId, status) => {
  if (!["pending", "active", "blocked"].includes(status)) {
    throw new BadRequestError("Invalid user status!");
  }

  const updatedUser = await userModel
    .findOneAndUpdate(
      { _id: userId },
      {
        user_status: status,
      },
      {
        new: true,
      },
    )
    .select("-user_password");

  if (!updatedUser) throw new Error("User not found or not role user");

  return updatedUser;
};

module.exports = {
  newUser,
  checkLoginEmailToken,
  createNewUserV2,
  loginUserV2,
  loginWithGoogle,
  requestAccountVerification,
  confirmAccountVerification,
  getAllUsers,
  getUserById,
  updateUserStatusById,
};
