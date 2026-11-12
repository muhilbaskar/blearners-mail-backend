// db/registrationRepo.js
const Registration = require("./models/Registration");

/**
 * Insert a new registration. Returns the created document as plain JSON
 * with the same shape as the old SQLite row:
 *   { id, full_name, email, phone, institution, role, place,
 *     admin_mail, welcome_mail, mail_error, created_at }
 */
async function insertRegistration(data) {
  const doc = await Registration.create({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    institution: data.institution,
    role: data.role,
    place: data.place,
  });
  return doc.toJSON();
}

async function findRegistrationById(id) {
  const doc = await Registration.findById(id);
  if (!doc) return null;
  return doc.toJSON();
}

/**
 * Update the email delivery statuses for a given registration.
 * Values are the same as before: 'pending' | 'sent' | 'failed'.
 */
async function updateRegistrationMailStatus(
  id,
  { adminMail, welcomeMail, error }
) {
  await Registration.findByIdAndUpdate(id, {
    admin_mail: adminMail || "pending",
    welcome_mail: welcomeMail || "pending",
    mail_error: error || null,
  });
}

module.exports = {
  insertRegistration,
  findRegistrationById,
  updateRegistrationMailStatus,
};