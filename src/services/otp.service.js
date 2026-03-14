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

module.exports = { newOTP, generationTokenRandom };
