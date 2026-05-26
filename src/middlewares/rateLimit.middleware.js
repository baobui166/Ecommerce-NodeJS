"use strict";

const rateLimit = require("express-rate-limit");

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const createLimiter = ({ windowMs, max }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        status: "error",
        code: 429,
        message: "Too many requests. Please try again later.",
      }),
  });

const windowMs = toNumber(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000);

module.exports = {
  authLimiter: createLimiter({
    windowMs,
    max: toNumber(process.env.RATE_LIMIT_AUTH_MAX, 20),
  }),
  verifyLimiter: createLimiter({
    windowMs,
    max: toNumber(process.env.RATE_LIMIT_VERIFY_MAX, 5),
  }),
  orderLimiter: createLimiter({
    windowMs,
    max: toNumber(process.env.RATE_LIMIT_ORDER_MAX, 30),
  }),
  searchLimiter: createLimiter({
    windowMs,
    max: toNumber(process.env.RATE_LIMIT_SEARCH_MAX, 120),
  }),
  aiLimiter: createLimiter({
    windowMs,
    max: toNumber(process.env.AI_RATE_LIMIT_MAX, 60),
  }),
};
