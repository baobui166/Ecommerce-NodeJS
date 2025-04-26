"use strict"

const keytokenModel = require("../model/keytoken.model")

class KeyTokenService {
  static createKeyToken = async ({ userId, publicKey }) => {
    try {
      const publicKetString = publicKey.toString()
      const tokens = await keytokenModel.create({
        user: userId,
        publicKey: publicKetString
      })

      return tokens ? tokens.publicKey : ""
    } catch (error) {
      return error
    }
  }
}
module.exports = KeyTokenService
