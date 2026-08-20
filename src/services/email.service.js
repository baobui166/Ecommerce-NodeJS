"use strict";

const { newOTP } = require("./otp.service");
const { getTemplate } = require("./templateEmail.service");
const transport = require("../dbs/init.nodemailer");
const { replacePlacehoder } = require("../utils");
const myLogger = require("../loggers/myLogger.log");

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

const sendEmailWithResend = async ({ html, toEmail, subject, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from = process.env.RESEND_FROM_EMAIL || "Nook <onboarding@resend.dev>";
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
          <h2>Verify your Nook account</h2>
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
      subject: "Verify your Nook account",
    });

    return {
      email: normalizedEmail,
      expiresInSeconds: 15 * 60,
      ...(process.env.NODE_ENV !== "production" ? { devToken: token.otp_token } : {}),
    };
  } catch (error) {
    myLogger.error("Failed to send verification email", [
      "email",
      { requestId: "system" },
      { message: error.message },
    ]);
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
      myLogger.log("Resend email sent", [
        "email",
        { requestId: "system" },
        { id: result?.id, toEmail },
      ]);
      return result;
    }

    const mailOptions = {
      from: '"Nook" <anonystick@gmail.com> ',
      to: toEmail,
      subject,
      text,
      html,
    };

    const info = await transport.sendMail(mailOptions);
    myLogger.log("SMTP email sent", [
      "email",
      { requestId: "system" },
      { messageId: info?.messageId, toEmail },
    ]);
    return info;
  } catch (error) {
    myLogger.error("Email send failed", [
      "email",
      { requestId: "system" },
      { message: error.message },
    ]);
    throw error;
  }
};

module.exports = { sendEmailToken };
