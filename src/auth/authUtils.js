"use strict"
const JWT = require("jsonwebtoken")

const createTokenPair = (payload, publicKey, privateKey) => {
  try {
    //accessToken
    const accessToken = JWT.sign(payload, publicKey, {
      expiresIn: "2 days"
    })

    const refreshToken = JWT.sign(payload, privateKey, {
      expiresIn: "7 days"
    })

    // verify
    JWT.verify(accessToken, publicKey, (error, decode) => {
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
