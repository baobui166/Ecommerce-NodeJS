"use strict";

const { BadRequestError } = require("../core/error.response");
const { SuccessResponse } = require("../core/success.response");
const { newUser } = require("../services/user.service");

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

  // check user token via email
  checkRegisterEmailToken = async (req, res, next) => {
    new SuccessResponse({
      message: "Upload file success!!!!",
      metadata: await uploadImageFromUrl(),
    }).send(res);
  };
}

module.exports = new UserController();
