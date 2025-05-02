"use strict"

const shopModel = require("../model/shop.model")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const KeyTokenService = require("./ketToken.service")
const { createTokenPair } = require("../auth/authUtils")
const { getInfoData } = require("../utils")
const { BadRequestError, AuthFailureError } = require("../core/error.response")
const { findEmail } = require("./shop.service")
const keytokenModel = require("../model/keytoken.model")

const RoleShop = {
  SHOP: "SHOP",
  WRITE: "0001",
  EDITOR: "0001",
  ADMIN: "0001"
}

class AccessService {
  // LOGIN
  /* 
  step 1: check email in dbs
  step 2: match password
  step 3: create access token and refresh token
  step 4: get data in return logins
  */
  static login = async ({ email, password, refreshToken = null }) => {
    //1
    const foundShop = await findEmail({ email })
    if (!foundShop) {
      throw new BadRequestError("Shop not registered!!!")
    }
    //2
    const match = bcrypt.compare(password, foundShop.password)
    if (!match) {
      throw new AuthFailureError("Authen Error!!!")
    }

    //3
    const publicKey = crypto.randomBytes(68).toString("hex")
    const privateKey = crypto.randomBytes(68).toString("hex")
    const tokens = await createTokenPair(
      { userId: foundShop._id, email },
      publicKey,
      privateKey
    )

    await KeyTokenService.createKeyToken({
      userId: foundShop._id,
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey
    })

    return {
      shop: getInfoData({
        fields: ["_id", "name", "email"],
        object: foundShop
      }),
      tokens
    }
  }

  // REGISTER

  static signup = async ({ name, email, password }) => {
    //step 1: check email exists??

    const holderShop = await shopModel.findOne({ email }).lean()
    if (holderShop) {
      throw new BadRequestError("Error: Shop already registered!")
    }
    //step 2 hashsed password
    const hasedPassword = await bcrypt.hash(password, 10)
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

  //LOGOUT
  static logout = async (keyStore) => {
    console.log("keyStore in service: ", keyStore)
    const delKey = await KeyTokenService.removeKeyById(keyStore._id)
    console.log(delKey)
    return delKey
  }
}

module.exports = AccessService
