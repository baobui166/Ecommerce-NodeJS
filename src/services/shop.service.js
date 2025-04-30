"use strict"

const shopModel = require("../model/shop.model")

const findEmail = async ({
  email,
  select = { email: 1, password: 2, status: 1, roles: 1 }
}) => {
  const data = await shopModel.findOne({ email }).lean()

  return data
}

module.exports = {
  findEmail
}
