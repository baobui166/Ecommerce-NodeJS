const express = require("express")
const morgan = require("morgan")
const { default: helmet } = require("helmet")
const compression = require("compression")
const { overLoad } = require("./helpers/check.connect")

const app = express()

//init midddleware
app.use(morgan("dev"))
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extends: true }))

// init test

// require("./test/inventory.test")
// const productTest = require("./test/product.test")
// productTest.purchaseProduct("productID:1001", 10)

//init db
require("./dbs/init.mongodb")
overLoad()

//init route
app.use("/", require("./routes"))
// handle error
app.use((req, res, next) => {
  const error = new Error("Not Found!!!")
  error.status = 404
  next(error)
})

app.use((error, req, res, next) => {
  const statusCode = error.status || 500
  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: error.message
  })
})

module.exports = app
