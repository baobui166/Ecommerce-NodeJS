"use strict";

const cloudinary = require("../config/cloudinary.config");
const {
  s3,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("../config/s3.config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomImgaeName } = require("../utils");

// 1. upload  from url image

const uploadImageFromUrl = async () => {
  try {
    const urlImage =
      "https://down-vn.img.susercontent.com/file/vn-11134258-820l4-mh983gt0m22y61";
    const folderName = "product/shopId/",
      newFileName = "testdemo";

    const result = await cloudinary.uploader.upload(urlImage, {
      public_id: newFileName,
      folder: folderName,
    });

    console.log(result);

    return result;
  } catch (error) {
    console.log(`Failed upload image into cloudinary`, error);
  }
};

// 2. upload image from local
const uploadImageFromLocal = async ({ path, folderName = "product/8049" }) => {
  try {
    const result = await cloudinary.uploader.upload(path, {
      public_id: "thumb",
      folder: folderName,
    });

    console.log(result);

    return {
      image_url: result.secure_url,
      shopid: 8049,
      thumb_url: await cloudinary.url(result.public_id, {
        height: 100,
        width: 100,
        format: "jpg",
      }),
    };
  } catch (error) {
    console.log(`Failed upload image into cloudinary`, error);
  }
};

///3.
////// upload file use s3 amazon
const uploadFromLocalS3 = async ({ file }) => {
  try {
    const imageName = randomImgaeName();

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME_S3,
      Key: imageName,
      Body: file.buffer,
      ContentType: "image/jpeg", // that is you need
    });

    const singleUrl = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME_S3,
      Key: imageName,
    });

    // export url
    const url = await getSignedUrl(s3, singleUrl, { expiresIn: 3600 });

    const result = await s3.send(command);

    console.log("Result:::", result);
    console.log("URL:::", url);

    //return result;
    return url;
  } catch (error) {
    console.log(`Failed upload image into s3`, error);
  }
};
/// end s3 service

module.exports = {
  uploadImageFromUrl,
  uploadImageFromLocal,
  uploadFromLocalS3,
};
