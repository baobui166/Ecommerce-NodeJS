"use strict"

const { findById } = require("../services/apiKey.service")

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization"
}
const apiKey = async (req, res, next) => {
  try {
    const key = req.header[HEADER.API_KEY]?.toString()
    if (!key) {
      return res.status(403).json({
        message: "Forbidden Error"
      })
    }
    // check objkey
    const objKey = await findById(key)
    if (!objKey) {
      return res.status(403).json({
        message: "Forbidden Error"
      })
    }

    req.objKey = objKey

    return next()
  } catch (error) {
    console.log(error)
  }
}

const permission = async (permission) => {
  return (req, res, next) => {
    if (!req.objKey.premissions) {
      return res.status(403).json({
        message: "permission denied"
      })
    }

    const validPermission = req.objKey.permissons.includes(permission)
    if (!validPermission) {
      return res.status(403).json({
        message: "permission denied"
      })
    }

    return next()
  }
}

module.exports = {
  apiKey,
  permission
}
