// db/registrationRepo.js
const sqlite = require("./sqliteConnection");

const insertStatement = sqlite.prepare(`
  INSERT INTO registrations
    (full_name, email, phone, institution, role, place)
  VALUES
    (?, ?, ?, ?, ?, ?)
`);

const updateMailStatusStatement = sqlite.prepare(`
  UPDATE registrations
     SET admin_mail = ?, welcome_mail = ?, mail_error = ?
   WHERE id = ?
`);

const findByIdStatement = sqlite.prepare(
  `SELECT * FROM registrations WHERE id = ?`
);

function insertRegistration(data) {
  const result = insertStatement.run(
    data.full_name,
    data.email,
    data.phone,
    data.institution,
    data.role,
    data.place
  );
  return findByIdStatement.get(result.lastInsertRowid);
}

function findRegistrationById(id) {
  return findByIdStatement.get(id);
}

function updateRegistrationMailStatus(id, { adminMail, welcomeMail, error }) {
  updateMailStatusStatement.run(
    adminMail || "pending",
    welcomeMail || "pending",
    error || null,
    id
  );
}

module.exports = {
  insertRegistration,
  findRegistrationById,
  updateRegistrationMailStatus,
};