"use strict";

const cloudinary = require("../config/cloudinary.config");
const { BadRequestError } = require("../core/error.response");
//const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const { randomImgaeName } = require("../utils");
const urlImagePublic = `https://d3h6nq0mnsctu8.cloudfront.net`;
const DEFAULT_CLOUDINARY_FOLDER = process.env.CLOUDINARY_PRODUCT_FOLDER || "ecommerce/products";

const assertCloudinaryConfigured = () => {
  if (process.env.CLOUDINARY_URL) return;

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !(process.env.CLOUDINARY_API_SECRET || process.env.API_KEY_SECRET_CLOUDINARY)
  ) {
    throw new BadRequestError(
      "Cloudinary is not configured. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }
};

const normalizeCloudinaryResult = (result, filename) => ({
  url: result.secure_url,
  key: result.public_id,
  provider: "cloudinary",
  filename: filename || result.original_filename,
  width: result.width,
  height: result.height,
  format: result.format,
  bytes: result.bytes,
  thumb_url: cloudinary.url(result.public_id, {
    width: 300,
    height: 300,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  }),
});

// 1. upload  from url image

const uploadImageFromUrl = async ({ url, folderName = DEFAULT_CLOUDINARY_FOLDER } = {}) => {
  try {
    if (!url) throw new Error("Image URL is required");
    assertCloudinaryConfigured();

    const result = await cloudinary.uploader.upload(url, {
      folder: folderName,
      resource_type: "image",
      overwrite: false,
    });

    return normalizeCloudinaryResult(result);
  } catch (error) {
    console.log(`Failed upload image URL into cloudinary`, error);
    throw error;
  }
};

// 2. upload image from local
const uploadImageFromLocal = async ({ path, folderName = DEFAULT_CLOUDINARY_FOLDER }) => {
  try {
    assertCloudinaryConfigured();
    const result = await cloudinary.uploader.upload(path, {
      folder: folderName,
      resource_type: "image",
      overwrite: false,
    });

    return normalizeCloudinaryResult(result);
  } catch (error) {
    console.log(`Failed upload image into cloudinary`, error);
    throw error;
  }
};

const uploadImageFromBuffer = async ({
  file,
  folderName = DEFAULT_CLOUDINARY_FOLDER,
}) => {
  if (!file?.buffer) throw new Error("File buffer is required");
  assertCloudinaryConfigured();

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(normalizeCloudinaryResult(result, file.originalname));
      },
    );

    stream.end(file.buffer);
  });
};

///3.
////// upload file use s3 amazon
const uploadFromLocalS3 = async ({ file }) => {
  try {
    const {
      s3,
      PutObjectCommand,
      GetObjectCommand,
    } = require("../config/s3.config");
    const imageName = randomImgaeName();
    const privateKey = process.env.PRIVATE_KEY_CLOUDFRONT.replace(/\\n/g, "\n");

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

    // export url s3 with cloudfront (no key)
    //const url = await getSignedUrl(s3, singleUrl, { expiresIn: 3600 });

    // export url s3 with cloudfront (have key)
    const url = getSignedUrl({
      url: `${urlImagePublic}/${imageName}`,
      keyPairId: process.env.PUBLIC_KEY_CLOUDFRONT,
      dateLessThan: new Date(Date.now() + 1000 * 60),
      privateKey,
    });

    const result = await s3.send(command);

    console.log("Result:::", result);
    console.log("URL:::", url);

    //return result;
    return {
      url,
      key: imageName,
      provider: "s3",
      filename: file.originalname,
      result,
    };
  } catch (error) {
    console.log(`Failed upload image into s3`, error);
  }
};
/// end s3 service

module.exports = {
  uploadImageFromUrl,
  uploadImageFromLocal,
  uploadImageFromBuffer,
  uploadFromLocalS3,
};
