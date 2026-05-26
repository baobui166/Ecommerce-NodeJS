"use strict";

const crypto = require("crypto");
const otpModel = require("../model/otp.model");

const generationTokenRandom = () => crypto.randomInt(100000, 1000000).toString();

const newOTP = async ({ email }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const token = generationTokenRandom();

  await otpModel.deleteMany({
    otp_email: normalizedEmail,
    otp_status: "pending",
  });

  const newToken = await otpModel.create({
    otp_token: token,
    otp_email: normalizedEmail,
  });

  return newToken;
};

const checkEmailToken = async ({ token = null }) => {
  const normalizedToken = String(token || "").trim();
  const otp = await otpModel.findOne({ otp_token: normalizedToken }).lean();
  if (!otp) {
    throw new Error("Verification token is invalid or expired.");
  }

  await otpModel.deleteOne({ _id: otp._id });

  return otp;
};

module.exports = { newOTP, generationTokenRandom, checkEmailToken };
