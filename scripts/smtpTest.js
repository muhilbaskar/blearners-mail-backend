// scripts/smtpTest.js
require("dotenv").config();
const { getSmtpTransporter } = require("../config/smtpTransport");
const { deliverEmail } = require("../services/emailSender");

(async () => {
  let transporter;
  try {
    transporter = getSmtpTransporter();
    console.log(
      `🔌 Connecting to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} as ${process.env.SMTP_USER} ...`
    );

    await transporter.verify();
    console.log("✅ SMTP connection + auth verified");
  } catch (err) {
    console.error("❌ SMTP verify failed:", err.message);
    if (err.code) console.error("   code:", err.code);
    if (err.response) console.error("   response:", err.response);
    process.exit(1);
  }

  try {
    const result = await deliverEmail({
      to: process.env.SMTP_USER,
      subject: "BLearners SMTP test ✅",
      html: `<p>If you see this, Zoho SMTP works 🎉</p>`,
    });
    console.log("✅ Test email sent:", result);
    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  }
})();