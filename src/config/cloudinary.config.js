"use strict";

// Require the cloudinary library
const cloudinary = require("cloudinary").v2;

const cloudinaryConfig = { secure: true };

if (!process.env.CLOUDINARY_URL) {
  cloudinaryConfig.cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  cloudinaryConfig.api_key = process.env.CLOUDINARY_API_KEY;
  cloudinaryConfig.api_secret =
    process.env.CLOUDINARY_API_SECRET || process.env.API_KEY_SECRET_CLOUDINARY;
}

// When CLOUDINARY_URL is set, the SDK reads it automatically.
cloudinary.config(cloudinaryConfig);

module.exports = cloudinary;
