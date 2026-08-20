const express = require("express");
const morgan = require("morgan");
const { default: helmet } = require("helmet");
const compression = require("compression");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { overLoad } = require("./helpers/check.connect");
const { randomUUID } = require("crypto");
const myLogger = require("./loggers/myLogger.log");

const app = express();
app.set("trust proxy", 1);

const SENSITIVE_KEYS = new Set([
  "password",
  "user_password",
  "refreshtoken",
  "accesstoken",
  "token",
  "authorization",
  "cookie",
]);

const redactSensitiveData = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactSensitiveData);

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase())
        ? "[REDACTED]"
        : redactSensitiveData(item),
    ]),
  );
};

//init middleware
// FRONTEND_URL may hold a single origin or a comma-separated list (useful in dev,
// since Vite silently jumps to the next port when its default one is taken).
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl/Postman) which send no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true, // cho phép gửi/nhận cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-api-key",
      "Authorization",
      "x-client-id",
      "x-refresh-token",
      "x-auth-kind",
    ],
  }),
);
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"];
  req.requestId = requestId ? requestId : randomUUID();
  myLogger.log(`input params:: ${req.method}::`, [
    req.path,
    { requestId: req.requestId },
    redactSensitiveData(req.method === "GET" ? req.query : req.body),
  ]);

  next();
});

// init test

// require("./test/inventory.test")
// const productTest = require("./test/product.test")
// productTest.purchaseProduct("productID:1001", 10)

//init db
if (process.env.NODE_ENV !== "test") {
  require("./dbs/init.mongodb");
  overLoad();
  const initRedis = require("./dbs/init.redis");
  initRedis.initRedis().catch((error) => {
    myLogger.error(
      `Redis unavailable, continuing without cache/locks: ${error.message}`,
    );
  });
}
//init route
app.use("/", require("./routes/health"));
app.use("/docs", require("./routes/docs"));
app.use("/", require("./routes"));
// handle error
app.use((req, res, next) => {
  const error = new Error("Not Found!!!");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  const resMessage = `${statusCode} - ${Date.now()}ms - Response: ${
    error.name || "Error"
  }`;

  myLogger.error(resMessage, [
    req.path,
    { requestId: req.requestId },
    { message: error.message },
  ]);

  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: error.message,
  });
});

module.exports = app;
