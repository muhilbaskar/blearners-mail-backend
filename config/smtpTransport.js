// config/smtpTransport.js
const nodemailer = require("nodemailer");

let cachedTransporter = null;

function getSmtpTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Missing SMTP config. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
    );
  }

  if (cachedTransporter) return cachedTransporter;

  const port = Number(SMTP_PORT) || 465;
  const isSecure =
    SMTP_SECURE !== undefined ? SMTP_SECURE === "true" : port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: isSecure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    ...(isSecure ? {} : { requireTLS: true }),
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    logger: process.env.NODE_ENV !== "production",
    debug: process.env.NODE_ENV !== "production",
  });

  return cachedTransporter;
}

module.exports = { getSmtpTransporter };