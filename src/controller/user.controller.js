"use strict";

const { BadRequestError } = require("../core/error.response");
const { SuccessResponse, CREATED } = require("../core/success.response");
const { newUser, checkLoginEmailToken, createNewUserV2, loginUserV2 } = require("../services/user.service");

class UserController {
  // new user
  newUser = async (req, res, next) => {
    const responsed = await newUser({ email: req.body.email });

    new SuccessResponse(responsed).send(res);
  };

  userUpload = async (req, res, next) => {
    new SuccessResponse({
      message: "Upload file success!!!!",
      metadata: await uploadImageFromUrl(),
    }).send(res);
  };

  checkLoginEmailToken = async (req, res, next) => {
    const { token } = req.query;
    new SuccessResponse({
      message: "Check login email token success!!!!",
      metadata: await checkLoginEmailToken({ token }),
    }).send(res);
  };

  upLoadImageFromUrl = async (req, res, next) => {
    new SuccessResponse({
      message: "Upload file success!!!!",
      metadata: await uploadImageFromUrl(),
    }).send(res);
  };

  // V2: Register with email + password (no OTP)
  registerV2 = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Email and password are required!");
    }
    new SuccessResponse({
      message: "User registered successfully",
      metadata: await createNewUserV2({ email, password }),
    }).send(res);
  };

  // V2: Login with email + password (no OTP)
  loginV2 = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Email and password are required!");
    }
    new SuccessResponse({
      message: "Login successfully",
      metadata: await loginUserV2({ email, password }),
    }).send(res);
  };
}

module.exports = new UserController();
