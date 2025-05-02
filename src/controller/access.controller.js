"use strict"

const { OK, CREATED, SuccessResponse } = require("../core/success.response")
const AccessService = require("../services/access.service")

class AccessController {
  login = async (req, res, next) => {
    new OK({
      metadata: await AccessService.login(req.body)
    }).send(res)
  }

  logout = async (req, res, next) => {
    new OK({
      messag: "Logout  Success!!!",
      metadata: await AccessService.logout(req.keyStore)
    }).send(res)
  }

  signup = async (req, res, next) => {
    new CREATED({
      message: "Registered OK!!",
      metadata: await AccessService.signup(req.body)
      // options: {
      //   limit: 10
      // }
    }).send(res)
  }
}

module.exports = new AccessController()
