"use strict"
const JWT = require("jsonwebtoken")

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    //accessToken
    const accessToken = await JWT.sign(payload, publicKey, {
      expiresIn: "2 days"
    })

    const refreshToken = await JWT.sign(payload, privateKey, {
      expiresIn: "7 days"
    })

    // verify
    JWT.verify(accessToken, privateKey, (error, decode) => {
      if (error) {
        console.error("error verify::", error)
      } else {
        console.log("Decode verify::", decode)
      }
    })

    return { accessToken, refreshToken }
  } catch (error) {
    return error
  }
}
module.exports = { createTokenPair }
