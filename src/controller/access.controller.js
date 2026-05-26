"use strict";

const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const AccessService = require("../services/access.service");

// ── Cookie config ─────────────────────────────────────────────────────────────
const LEGACY_REFRESH_TOKEN_COOKIE = "refreshToken";
const USER_REFRESH_TOKEN_COOKIE = "userRefreshToken";
const ADMIN_REFRESH_TOKEN_COOKIE = "adminRefreshToken";

const refreshCookieOptions = {
  httpOnly: true,                                    // không thể đọc bằng JS
  secure: process.env.NODE_ENV === "production",     // chỉ HTTPS trên production
  sameSite: "strict",                                // chống CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 ngày (ms)
  path: "/",
};

const getRefreshCookieName = (req) =>
  req.headers["x-auth-kind"] === "admin"
    ? ADMIN_REFRESH_TOKEN_COOKIE
    : USER_REFRESH_TOKEN_COOKIE;

const clearRefreshCookies = (res, cookieName) => {
  res.clearCookie(cookieName, { path: "/" });
  res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: "/" });
};

class AccessController {
  login = async (req, res, next) => {
    const result = await AccessService.login(req.body);

    // Set refresh token vào httpOnly cookie
    res.cookie(ADMIN_REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, refreshCookieOptions);
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: "/" });

    new OK({
      metadata: {
        shop: result.shop,
        tokens: {
          accessToken: result.tokens.accessToken,
        },
      },
    }).send(res);
  };

  logout = async (req, res, next) => {
    // Xóa refresh token cookie
    clearRefreshCookies(res, getRefreshCookieName(req));

    new OK({
      message: "Logout Success!!!",
      metadata: await AccessService.logout(req.keyStore),
    }).send(res);
  };

  signup = async (req, res, next) => {
    const result = await AccessService.signup(req.body);

    // Set refresh token vào httpOnly cookie nếu đăng ký thành công
    if (result.metadata?.tokens?.refreshToken) {
      res.cookie(ADMIN_REFRESH_TOKEN_COOKIE, result.metadata.tokens.refreshToken, refreshCookieOptions);
      res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: "/" });
    }

    new CREATED({
      message: "Registered OK!!",
      metadata: {
        shop: result.metadata?.shop,
        tokens: {
          accessToken: result.metadata?.tokens?.accessToken,
        },
      },
    }).send(res);
  };

  handlerRefreshToken = async (req, res, next) => {
    // Lấy refresh token từ cookie (ưu tiên) hoặc body (fallback)
    const cookieName = getRefreshCookieName(req);
    const refreshToken =
      req.cookies[cookieName] ||
      req.cookies[LEGACY_REFRESH_TOKEN_COOKIE] ||
      req.body.refreshToken;

    const result = await AccessService.handleRefreshToken(refreshToken);

    // Cập nhật refresh token cookie mới
    res.cookie(cookieName, result.tokens.refreshToken, refreshCookieOptions);
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: "/" });

    new SuccessResponse({
      message: "Get Token success!!!",
      metadata: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
        },
      },
    }).send(res);
  };

  adminLogin = async (req, res, next) => {
    const result = await AccessService.adminLogin(req.body);

    // Set refresh token vào httpOnly cookie
    res.cookie(ADMIN_REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, refreshCookieOptions);
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: "/" });

    new OK({
      message: "Admin login success!",
      metadata: {
        shop: result.shop,
        tokens: {
          accessToken: result.tokens.accessToken,
        },
      },
    }).send(res);
  };
}

module.exports = new AccessController();
