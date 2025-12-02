"use strict";

// Require the cloudinary library
const cloudinary = require("cloudinary").v2;

// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name: "diismimpz",
  api_key: "996272551363513",
  api_secret: process.env.API_KEY_SECRET_CLOUDINARY,
});

module.exports = cloudinary;
