"use strict";

const { randomInt } = require("crypto");
const { newOTP } = require("./otp.service");
const { getTemplate } = require("./templateEmail.service");
const transport = require("../dbs/init.nodemailer");
const { NotFoundError } = require("../core/error.response");
const { replacePlacehoder } = require("../utils");

const sendEmailToken = async ({ email = null }) => {
  try {
    // 1. get token
    const token = await newOTP({ email });

    // 2. get template

    const template = await getTemplate({ tem_name: "HTML EMAIL TOKEN" });
    if (!template) {
      throw new NotFoundError("Template not found");
    }

    // 3. replace placeholder with params
    const content = replacePlacehoder(template.tem_html, {
      link_verify: `http://localhost:5500/cgp/welcome-back?token=${token.tem_token}`,
    });

    sendEmailLinkVerify({
      html: content,
      toEmail: email,
      subject: "Vui lòng xác nhận địa chỉ email đăng ký shopDev",
    }).catch();
  } catch (error) {}
};

const sendEmailLinkVerify = ({
  html,
  toEmail,
  subject = "Xác nhận email đăng ký",
  text = "xác nhận...",
}) => {
  try {
    const mailOptions = {
      from: '"ShopDev" <anonystick@gmail.com> ',
      to: toEmail,
      subject,
      text,
      html,
    };

    transport.sendMail(mailOptions, (err, info) => {
      if (err) {
        return console.log(err);
      }

      console.log("Message send info:  ", info);
    });
  } catch (error) {
    console.error("error to send email::", error);
    return error;
  }
};

module.exports = { sendEmailToken };
