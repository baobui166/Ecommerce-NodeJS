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

//init middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,  // cho phép gửi/nhận cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization', 'x-client-id', 'x-refresh-token', 'x-auth-kind']
}));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extends: true }));
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"];
  req.requestId = requestId ? requestId : randomUUID();
  myLogger.log(`input params:: ${req.method}::`, [
    req.path,
    { requestId: req.requestId },
    req.method === "POST" ? req.body : req.query,
  ]);

  next();
});

// init test

// require("./test/inventory.test")
// const productTest = require("./test/product.test")
// productTest.purchaseProduct("productID:1001", 10)

//init db
require("./dbs/init.mongodb");
overLoad();
const initRedis = require("./dbs/init.redis");
initRedis.initRedis().catch((error) => {
  myLogger.error(`Redis unavailable, continuing without cache/locks: ${error.message}`);
});
//init route
app.use("/", require("./routes"));
// handle error
app.use((req, res, next) => {
  const error = new Error("Not Found!!!");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  const resMessage = `${
    error.status
  } - ${Date.now()}ms - Response: ${JSON.stringify(error)}`;

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
