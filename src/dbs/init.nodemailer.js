"use strict	";

const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: "email-smtp.ap-southeast-1.amazonaws.com",
  port: 465,
  secure: true,
  auth: {
    user: "AKIA4SW7WGZBCLIDGPDC",
    password: "BK9TllDhe+6nBtB27dpJSAM+gTL+vJ2imrV5+0qfLYk",
  },
});

module.exports = transport;
