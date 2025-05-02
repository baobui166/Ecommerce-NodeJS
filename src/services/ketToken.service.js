"use strict"

const { Types } = require("mongoose")
const keytokenModel = require("../model/keytoken.model")

class KeyTokenService {
  static createKeyToken = async ({
    userId,
    publicKey,
    privateKey,
    refreshToken
  }) => {
    try {
      //lv0
      // const tokens = await keytokenModel.create({
      //   user: userId,
      //   publicKey,
      //   privateKey
      // })
      // return tokens ? tokens.publicKey : ""
      //lv xx
      const filter = { user: userId },
        update = {
          publicKey,
          privateKey,
          refreshTokenUsed: [],
          refreshToken
        },
        options = { upsert: true, new: true }
      const tokens = await keytokenModel.findOneAndUpdate(
        filter,
        update,
        options
      )

      return tokens ? tokens.publicKey : null
    } catch (error) {
      return error
    }
  }

  static findByUserID = async (userId) => {
    const result = await keytokenModel
      .findOne({ user: new Types.ObjectId(userId) })
      .lean()

    console.log(result)

    return result
  }

  static removeKeyById = async (id) => {
    const result = await keytokenModel.deleteOne({
      _id: new Types.ObjectId(id)
    })
    return result
  }
}
module.exports = KeyTokenService
