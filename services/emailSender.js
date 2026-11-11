// services/emailSender.js
const { getSmtpTransporter } = require("../config/smtpTransport");
const { renderHtmlTemplate } = require("../utils/htmlRenderer");

async function deliverEmail({
  to,
  subject,
  template,
  variables = {},
  html,
  text,
  retries = 1,
}) {
  if (!to || !subject) {
    throw new Error("deliverEmail: 'to' and 'subject' are required");
  }

  const finalHtml =
    html || (template ? renderHtmlTemplate(template, variables) : undefined);

  if (!finalHtml) {
    throw new Error("deliverEmail: provide 'html' or 'template'");
  }

  const transporter = getSmtpTransporter();

  const mailOptions = {
    from: `"${process.env.FROM_NAME || "No Reply"}" <${process.env.FROM_EMAIL}>`,
    replyTo: `"${process.env.REPLY_TO_NAME || "Support"}" <${process.env.REPLY_TO_EMAIL}>`,
    to,
    subject,
    html: finalHtml,
    text: text || finalHtml.replace(/<[^>]+>/g, "").slice(0, 5000),
  };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastError = err;
      console.error(
        `❌ deliverEmail attempt ${attempt + 1}/${retries + 1} failed:`,
        err.message
      );
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

module.exports = { deliverEmail };