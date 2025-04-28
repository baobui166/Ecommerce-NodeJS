"use strict"

const { OK, CREATED } = require("../core/success.response")
const AccessService = require("../services/access.service")

class AccessController {
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
