"use strict"

const shopModel = require("../model/shop.model")
const brypt = require("bcrypt")
const crypto = require("crypto")
const KeyTokenService = require("./ketToken.service")
const { createTokenPair } = require("../auth/authUtils")
const { getInfoData } = require("../utils")

const RoleShop = {
  SHOP: "SHOP",
  WRITE: "0001",
  EDITOR: "0001",
  ADMIN: "0001"
}

class AccessService {
  static signup = async ({ name, email, password }) => {
    try {
      //step 1: check email exists??
      const holderShop = await shopModel.findOne({ email }).lean()
      if (holderShop) {
        console.log("holderShop: ", holderShop)
        return {
          code: "xxx",
          message: "Shop already registered"
        }
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
        //create privatekey, public key
        const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
          modulusLength: 4096,
          publicKeyEncoding: {
            type: "pkcs1", // public key CrytoGraphy Standards
            format: "pem"
          },
          privateKeyEncoding: {
            type: "pkcs1", // public key CrytoGraphy Standards
            format: "pem"
          }
        })

        const publicKeyString = await KeyTokenService.createKeyToken({
          userId: newShop._id,
          publicKey
        })

        if (!publicKeyString) {
          return {
            code: "xxx",
            message: "PublicKeyString Error"
          }
        }

        const publicKeyObject = crypto.createPublicKey(publicKeyString)

        // create token
        const tokens = await createTokenPair(
          { userId: newShop._id, email },
          publicKeyObject,
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
    } catch (error) {
      return {
        code: "xxx",
        message: error.message,
        status: "error"
      }
    }
  }
}

module.exports = AccessService
