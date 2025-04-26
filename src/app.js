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

//init db
require("./dbs/init.mongodb")
overLoad()

//init route
app.use("/", require("./routes"))
// handle error

module.exports = app
