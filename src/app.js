const express = require("express");
const morgan = require("morgan");
const { default: helmet } = require("helmet");
const compression = require("compression");
const { overLoad } = require("./helpers/check.connect");
const { v4: uuidv4 } = require("uuid");
const myLogger = require("./loggers/myLogger.log");

const app = express();

//init midddleware
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extends: true }));
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"];
  req.requrestId = requestId ? requestId : uuidv4();
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
