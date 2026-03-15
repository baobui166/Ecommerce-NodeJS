"use strict";

const cryto = require("crypto");
const otpModel = require("../model/otp.model");

const generationTokenRandom = () => {
  const token = cryto.randomInt(0, Math.pow(2, 32));
};

const newOTP = async ({ email }) => {
  const token = generationTokenRandom();
  const newToken = await otpModel.create({
    otp_token: token,
    otp_email: email,
  });

  return newToken;
};

const checkEmailToken = async ({ token = null }) => {
  const otp = await otpModel.findOne({ otp_token: token }).lean();
  if (!otp) {
    throw new Error("Token not found!!!");
  }

  // delete token from model
  otpModel.deleteOne({ otp_token: token });

  return otp;
};

module.exports = { newOTP, generationTokenRandom, checkEmailToken };
