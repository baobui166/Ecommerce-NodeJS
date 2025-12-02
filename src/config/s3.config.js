"use strict";

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Config = {
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_SHOPDEV_S3,
    secretAccessKey: process.env.SECRET_KEY_SHOPDEV_S3,
  },
};

const s3 = new S3Client(s3Config);

module.exports = { s3, PutObjectCommand };
