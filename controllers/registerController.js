// controllers/registerController.js
const {
  insertRegistration,
  updateRegistrationMailStatus,
} = require("../db/registrationRepo");
const { deliverEmail } = require("../services/emailSender");

const VALID_ROLES = ["Administrator", "Teacher", "Student", "Parent"];

function validateRegisterBody(body) {
  const errors = {};

  if (!body.fullName || String(body.fullName).trim().length < 2) {
    errors.fullName = "Full name is required (min 2 chars)";
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = "A valid email is required";
  }
  if (!body.role || !VALID_ROLES.includes(body.role)) {
    errors.role = `Role must be one of: ${VALID_ROLES.join(", ")}`;
  }
  if (!body.place || String(body.place).trim().length < 1) {
    errors.place = "Place is required";
  }

  return errors;
}

async function handleRegister(req, res, next) {
  try {
    /* ---------- 1. Validate ---------- */
    const errors = validateRegisterBody(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    const data = {
      full_name: String(req.body.fullName).trim(),
      email: String(req.body.email).trim().toLowerCase(),
      phone: req.body.phone ? String(req.body.phone).trim() : null,
      institution: req.body.institution
        ? String(req.body.institution).trim()
        : null,
      role: req.body.role,
      place: String(req.body.place).trim(),
    };

    /* ---------- 2. Save to DB ---------- */
    const record = insertRegistration(data);

    /* ---------- 3. Send both emails ---------- */
    let adminMail = "pending";
    let welcomeMail = "pending";
    let mailError = null;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const companyName = process.env.COMPANY_NAME || "Blended Pedagogy";

    // ✅ NEW LOGO LOGIC
    // Use LOGO_URL if provided; otherwise fall back to APP_BASE_URL + static path
    const explicitLogo = (process.env.LOGO_URL || "").trim();
    const baseUrl = (process.env.APP_BASE_URL || "").trim().replace(/\/+$/, "");
    const logoUrl = explicitLogo || (baseUrl ? `${baseUrl}/images/blearners-logo.png` : "");

    // 3a. Admin notification
    try {
      await deliverEmail({
        to: adminEmail,
        subject: `New BLearners Registration — ${data.full_name}`,
        template: "admin-notification.html",
        variables: {
          fullName: data.full_name,
          email: data.email,
          phone: data.phone || "—",
          institution: data.institution || "—",
          role: data.role,
          place: data.place,
          submittedAt: new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          recordId: record.id,
          companyName,
          logoUrl,
        },
      });
      adminMail = "sent";
    } catch (err) {
      console.error("⚠️ Admin notification failed:", err.message);
      adminMail = "failed";
      mailError = `admin: ${err.message}`;
    }

    // 3b. Welcome email to registrant
    try {
      await deliverEmail({
        to: data.email,
        subject: `Thanks for registering with ${companyName} 🎉`,
        template: "welcome-thanks.html",
        variables: {
          fullName: data.full_name,
          role: data.role,
          institution: data.institution || "—",
          place: data.place,
          companyName,
        },
      });
      welcomeMail = "sent";
    } catch (err) {
      console.error("⚠️ Welcome email failed:", err.message);
      welcomeMail = "failed";
      mailError = mailError
        ? `${mailError}; welcome: ${err.message}`
        : `welcome: ${err.message}`;
    }

    /* ---------- 4. Update statuses ---------- */
    updateRegistrationMailStatus(record.id, {
      adminMail,
      welcomeMail,
      error: mailError,
    });

    /* ---------- 5. Respond ---------- */
    res.status(201).json({
      success: true,
      message: "Registration received. Please check your email.",
      id: record.id,
      emails: { admin: adminMail, welcome: welcomeMail },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleRegister };