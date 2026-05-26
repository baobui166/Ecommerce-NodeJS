"use strict";

const { newOTP } = require("./otp.service");
const { getTemplate } = require("./templateEmail.service");
const transport = require("../dbs/init.nodemailer");
const { replacePlacehoder } = require("../utils");

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

const sendEmailWithResend = async ({ html, toEmail, subject, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from = process.env.RESEND_FROM_EMAIL || "ShopPro <onboarding@resend.dev>";
  const response = await fetch(RESEND_EMAILS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      html,
      text,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error || "Resend email failed";
    throw new Error(message);
  }

  return payload;
};

const sendEmailToken = async ({ email = null }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const token = await newOTP({ email: normalizedEmail });
    const linkVerify = `${frontendUrl}/verify-account?token=${encodeURIComponent(
      token.otp_token,
    )}`;

    const template = await getTemplate({ tem_name: "HTML EMAIL TOKEN" }).catch(
      () => null,
    );
    const content = template?.tem_html
      ? replacePlacehoder(template.tem_html, { link_verify: linkVerify })
      : `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Verify your ShopPro account</h2>
          <p>Use this code to verify your account:</p>
          <p style="font-size:24px;font-weight:700;letter-spacing:4px">${token.otp_token}</p>
          <p>Or open this link:</p>
          <p><a href="${linkVerify}">${linkVerify}</a></p>
          <p>This code expires in 15 minutes.</p>
        </div>
      `;

    await sendEmailLinkVerify({
      html: content,
      toEmail: normalizedEmail,
      subject: "Verify your ShopPro account",
    });

    return {
      email: normalizedEmail,
      expiresInSeconds: 15 * 60,
      ...(process.env.NODE_ENV !== "production" ? { devToken: token.otp_token } : {}),
    };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
};

const sendEmailLinkVerify = async ({
  html,
  toEmail,
  subject = "Verify your email",
  text = "Verify your email",
}) => {
  try {
    if (process.env.RESEND_API_KEY) {
      const result = await sendEmailWithResend({ html, toEmail, subject, text });
      console.log("Resend message info: ", result);
      return result;
    }

    const mailOptions = {
      from: '"ShopPro" <anonystick@gmail.com> ',
      to: toEmail,
      subject,
      text,
      html,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("SMTP message info:  ", info);
    return info;
  } catch (error) {
    console.error("error to send email::", error);
    throw error;
  }
};

module.exports = { sendEmailToken };
