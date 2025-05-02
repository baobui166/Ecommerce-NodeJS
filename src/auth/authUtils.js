"use strict"
const JWT = require("jsonwebtoken")
const { asyncHandler } = require("../helpers/asyncHandler")
const { AuthFailureError, NotFoundError } = require("../core/error.response")
const { findByUserID } = require("../services/ketToken.service")

const HEADER = {
  API_KEY: "x-api-key",
  CLIENT_ID: "x-client-id",
  AUTHORIZATION: "authorization"
}

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

const authentication = asyncHandler(async (req, res, next) => {
  /*
  1. Check userID missing
  2. get AccessToken
  3. verifyToken
  4. check user in bds
  5. check key store with userid
  6. all  oke  return next()
  */

  const userId = req.headers[HEADER.CLIENT_ID]
  if (!userId) throw new AuthFailureError("Invalid request")

  const keyStore = await findByUserID(userId)
  if (!keyStore) throw new NotFoundError("Not found keyStore")

  const accessToken = req.headers[HEADER.AUTHORIZATION]
  if (!accessToken) throw new AuthFailureError("Invalid request")

  try {
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey)

    if (userId !== decodeUser.userId) throw new AuthFailureError("Invalid user")
    req.keyStore = keyStore
    return next()
  } catch (error) {
    throw error
  }
})

const verifyToken = async (token, keySerect) => {
  return JWT.verify(token, keySerect)
}
module.exports = { createTokenPair, authentication, verifyToken }
