"use strict";
const { BadRequestError } = require("../core/error.response");
const { SuccessResponse } = require("../core/success.response");
const {
  uploadImageFromUrl,
  uploadImageFromLocal,
  uploadFromLocalS3,
} = require("../services/upload.service");

class UploadController {
  uploadImage = async (req, res, next) => {
    new SuccessResponse({
      message: "Upload file success!!!!",
      metadata: await uploadImageFromUrl(),
    }).send(res);
  };

  uploadFileThumb = async (req, res, next) => {
    const { file } = req;

    if (!file) throw new BadRequestError("");

    new SuccessResponse({
      message: "Upload file thumb success!!!!",
      metadata: await uploadImageFromLocal({ path: file.path }),
    }).send(res);
  };

  uploadFileLocalS3 = async (req, res, next) => {
    const { file } = req;

    if (!file) throw new BadRequestError("File missing");

    new SuccessResponse({
      message: "Upload file local s3 success!!!!",
      metadata: await uploadFromLocalS3({ file }),
    }).send(res);
  };
}

module.exports = new UploadController();
