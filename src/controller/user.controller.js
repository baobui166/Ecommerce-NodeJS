"use strict";

const { BadRequestError } = require("../core/error.response");
const { SuccessResponse, CREATED } = require("../core/success.response");
const {
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
} = require("../services/user.service");
const { publishEvent } = require("../services/eventBus.service");

const LEGACY_REFRESH_TOKEN_COOKIE = "refreshToken";
const REFRESH_TOKEN_COOKIE = "userRefreshToken";
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const toAccessOnlyAuth = (result) => ({
  ...result,
  tokens: {
    accessToken: result.tokens.accessToken,
  },
});

class UserController {
  // new user
  newUser = async (req, res, next) => {
    const responsed = await newUser({ email: req.body.email });
    new SuccessResponse(responsed).send(res);
  };

  userUpload = async (req, res, next) => {
    new SuccessResponse({
      message: "Upload file success!!!!",
      metadata: await uploadImageFromUrl(),
    }).send(res);
  };

  checkLoginEmailToken = async (req, res, next) => {
    const { token } = req.query;
    new SuccessResponse({
      message: "Check login email token success!!!!",
      metadata: await checkLoginEmailToken({ token }),
    }).send(res);
  };

  requestAccountVerification = async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError("Email is required!");
    }

    new SuccessResponse({
      message: "Verification email sent",
      metadata: await requestAccountVerification({ email }),
    }).send(res);
  };

  confirmAccountVerification = async (req, res, next) => {
    const token = req.body.token || req.query.token;
    if (!token) {
      throw new BadRequestError("Verification code is required!");
    }

    new SuccessResponse({
      message: "Account verified successfully",
      metadata: await confirmAccountVerification({ token }),
    }).send(res);
  };

  upLoadImageFromUrl = async (req, res, next) => {
    new SuccessResponse({
      message: "Upload file success!!!!",
      metadata: await uploadImageFromUrl(),
    }).send(res);
  };

  // V2: Register with email + password (no OTP)
  registerV2 = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Email and password are required!");
    }
    const result = await createNewUserV2({ email, password });
    res.cookie(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, refreshCookieOptions);
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: "/" });
    publishEvent({
      type: "user.registered",
      userId: result.user._id,
      metadata: { email: result.user.user_email },
    }).catch(() => {});
    new SuccessResponse({
      message: "User registered successfully",
      metadata: toAccessOnlyAuth(result),
    }).send(res);
  };

  // V2: Login with email + password (no OTP)
  loginV2 = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Email and password are required!");
    }
    const result = await loginUserV2({ email, password });
    res.cookie(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, refreshCookieOptions);
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: "/" });
    new SuccessResponse({
      message: "Login successfully",
      metadata: toAccessOnlyAuth(result),
    }).send(res);
  };

  // ── Admin methods ─────────────────────────────────────────────────────────────

  googleLogin = async (req, res, next) => {
    const { credential } = req.body;
    if (!credential) {
      throw new BadRequestError("Google credential is required!");
    }

    const result = await loginWithGoogle({ credential });
    res.cookie(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, refreshCookieOptions);
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: "/" });

    if (result.isNewUser) {
      publishEvent({
        type: "user.registered",
        userId: result.user._id,
        metadata: {
          email: result.user.user_email,
          provider: "google",
        },
      }).catch(() => {});
    }

    new SuccessResponse({
      message: "Google login successfully",
      metadata: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
        },
      },
    }).send(res);
  };

  // GET /v1/api/user?limit=20&page=1
  getAllUsers = async (req, res, next) => {
    const { limit = 20, page = 1, search = "", status = "" } = req.query;
    new SuccessResponse({
      message: "Get all users success!",
      metadata: await getAllUsers({
        limit: parseInt(limit),
        page: parseInt(page),
        search,
        status,
      }),
    }).send(res);
  };

  // GET /v1/api/user/:id
  getUserById = async (req, res, next) => {
    const user = await getUserById(req.params.id);
    if (!user) throw new BadRequestError("User not found!");
    new SuccessResponse({
      message: "Get user success!",
      metadata: user,
    }).send(res);
  };

  // PATCH /v1/api/user/:id/status
  updateUserStatus = async (req, res, next) => {
    const { status } = req.body;
    if (!status) throw new BadRequestError("status is required!");

    const updated = await updateUserStatusById(req.params.id, status);
    if (!updated) throw new BadRequestError("User not found!");

    new SuccessResponse({
      message: "Update user status success!",
      metadata: updated,
    }).send(res);
  };
}

module.exports = new UserController();
