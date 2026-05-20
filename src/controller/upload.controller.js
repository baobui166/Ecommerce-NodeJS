"use strict";
const { BadRequestError } = require("../core/error.response");
const { SuccessResponse } = require("../core/success.response");
const {
  uploadImageFromUrl,
  uploadImageFromLocal,
  uploadImageFromBuffer,
  uploadFromLocalS3,
} = require("../services/upload.service");

class UploadController {
  uploadImage = async (req, res, next) => {
    const { file } = req;
    const { url, folderName } = req.body;

    if (!file && !url) throw new BadRequestError("File or url is required");

    new SuccessResponse({
      message: "Upload product image to Cloudinary success!",
      metadata: file
        ? await uploadImageFromBuffer({ file, folderName })
        : await uploadImageFromUrl({ url, folderName }),
    }).send(res);
  };

  uploadFileThumb = async (req, res, next) => {
    const { file } = req;

    if (!file) throw new BadRequestError("");

    new SuccessResponse({
      message: "Upload product thumb to Cloudinary success!",
      metadata: await uploadImageFromLocal({
        path: file.path,
        folderName: req.body.folderName,
      }),
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
