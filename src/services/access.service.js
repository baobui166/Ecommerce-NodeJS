"use strict"

const shopModel = require("../model/shop.model")
const brypt = require("bcrypt")
const crypto = require("crypto")
const KeyTokenService = require("./ketToken.service")
const { createTokenPair } = require("../auth/authUtils")
const { getInfoData } = require("../utils")
const { BadRequestError } = require("../core/error.response")

const RoleShop = {
  SHOP: "SHOP",
  WRITE: "0001",
  EDITOR: "0001",
  ADMIN: "0001"
}

class AccessService {
  static signup = async ({ name, email, password }) => {
    //step 1: check email exists??

    const holderShop = await shopModel.findOne({ email }).lean()
    if (holderShop) {
      throw new BadRequestError("Error: Shop already registered!")
    }
    //step 2 hashsed password
    const hasedPassword = await brypt.hash(password, 10)
    // step 3 create new shop
    const newShop = await shopModel.create({
      name,
      email,
      password: hasedPassword,
      roles: [RoleShop.SHOP]
    })
    // step 4 check new shop and create token
    if (newShop) {
      // create pub and private version 2
      const publicKey = crypto.randomBytes(68).toString("hex")
      const privateKey = crypto.randomBytes(68).toString("hex")

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey
      })

      if (!keyStore) {
        throw new BadRequestError("Error: Keystore Error!")
      }

      // create token
      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      )

      console.log("Created Token Success::", tokens)
      return {
        code: 201,
        metadata: {
          shop: getInfoData({
            fields: ["_id", "name", "email"],
            object: newShop
          }),
          tokens
        }
      }
    }

    return {
      code: 201,
      metadata: null
    }
  }
}

module.exports = AccessService
