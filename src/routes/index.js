"use strict"

const express = require("express")
const { permission, apiKey } = require("../auth/checkAuthen")
const router = express.Router()

//check api key
router.use(apiKey)

// check permission
router.use(permission("0000"))

router.use("/v1/api", require("./access"))
router.use("/v1/api", require("./shop"))

module.exports = router
