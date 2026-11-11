// config/smtpTransport.js
const nodemailer = require("nodemailer");

let cachedTransporter = null;

function getSmtpTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Missing SMTP config. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
    );
  }

  if (cachedTransporter) return cachedTransporter;

  const port = Number(SMTP_PORT) || 465;
  const isSecure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: isSecure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    ...(isSecure ? {} : { requireTLS: true }),
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    logger: process.env.NODE_ENV !== "production",
    debug: process.env.NODE_ENV !== "production",
  });

  return cachedTransporter;
}

module.exports = { getSmtpTransporter };