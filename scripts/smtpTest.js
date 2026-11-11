// scripts/smtpTest.js
require("dotenv").config();
const { deliverEmail } = require("../services/emailSender");

(async () => {
  try {
    const result = await deliverEmail({
      to: process.env.SMTP_USER,
      subject: "BLearners SMTP test ✅",
      html: `<p>If you see this, Gmail SMTP works 🎉</p>`,
    });
    console.log("✅ Test email sent:", result);
  } catch (err) {
    console.error("❌ Test failed:", err.message);
  }
})();