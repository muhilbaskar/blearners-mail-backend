// controllers/registerController.js
const {
  insertRegistration,
  updateRegistrationMailStatus,
} = require("../db/registrationRepo");
const { deliverEmail } = require("../services/emailSender");

// Preset roles offered by the frontend dropdown. "Others" is a special value
// that means "the user typed a custom role in the free-text input".
const PRESET_ROLES = ["Administrator", "Teacher", "Student", "Parent", "Others"];

// Safety cap so a malicious client cannot push a giant blob into the DB
// or into an email. Does not affect any legitimate use case.
const MAX_ROLE_LENGTH = 80;

/**
 * Normalize the incoming role from the request body.
 *
 * Supports THREE shapes so old and new clients both work:
 *
 *   1) { role: "Teacher" }                    -> "Teacher"
 *   2) { role: "Others", customRole: "X" }    -> "X" (trimmed, capped)
 *   3) { role: "Working Person" }             -> "Working Person"
 *      (this is what the current frontend sends when the user picks "Others"
 *       and types a custom role — previously rejected with a 400)
 *
 * Returns { role } on success, or { error } on failure.
 */
function resolveRole(body) {
  const rawRole = typeof body.role === "string" ? body.role.trim() : "";
  const rawCustom =
    typeof body.customRole === "string" ? body.customRole.trim() : "";

  // Case 1: "Others" picked + explicit customRole field sent
  if (rawRole === "Others") {
    if (!rawCustom) {
      return { error: "Please specify your role" };
    }
    if (rawCustom.length > MAX_ROLE_LENGTH) {
      return { error: `Role must be ${MAX_ROLE_LENGTH} characters or less` };
    }
    return { role: rawCustom };
  }

  // Case 2: known preset (Administrator / Teacher / Student / Parent)
  if (PRESET_ROLES.includes(rawRole)) {
    return { role: rawRole };
  }

  // Case 3: client sent a custom role string directly in `role`
  //         (this is what your frontend currently sends for "Others")
  if (rawRole.length > 0 && rawRole.length <= MAX_ROLE_LENGTH) {
    return { role: rawRole };
  }

  // Nothing usable
  return {
    error: `Role must be one of: ${PRESET_ROLES.join(", ")} or a custom role`,
  };
}

/**
 * Validate the register body. Returns { errors, role }.
 * Only "role" is normalized here; the other fields are validated in place.
 */
function validateRegisterBody(body) {
  const errors = {};

  if (!body.fullName || String(body.fullName).trim().length < 2) {
    errors.fullName = "Full name is required (min 2 chars)";
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = "A valid email is required";
  }
  if (!body.place || String(body.place).trim().length < 1) {
    errors.place = "Place is required";
  }

  const roleResult = resolveRole(body);
  if (roleResult.error) {
    errors.role = roleResult.error;
  }

  return { errors, role: roleResult.role };
}

async function handleRegister(req, res, next) {
  try {
    /* ---------- 1. Validate ---------- */
    const { errors, role } = validateRegisterBody(req.body);
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
      role, // already normalized by resolveRole()
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

    // ✅ Logo logic (unchanged from your original)
    const explicitLogo = (process.env.LOGO_URL || "").trim();
    const baseUrl = (process.env.APP_BASE_URL || "").trim().replace(/\/+$/, "");
    const logoUrl =
      explicitLogo || (baseUrl ? `${baseUrl}/images/blearners-logo.png` : "");

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