"use strict"

const express = require("express")
const router = express.Router()

router.post("/", () => {
  return req.status(200).json({
    message: "Success"
  })
})

module.exports = router
