// db/sqliteConnection.js
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || "./data/blearners.db";
const ABS_PATH = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.join(process.cwd(), DB_PATH);

fs.mkdirSync(path.dirname(ABS_PATH), { recursive: true });

const sqlite = new DatabaseSync(ABS_PATH);

sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT,
    institution   TEXT,
    role          TEXT NOT NULL,
    place         TEXT,
    admin_mail    TEXT DEFAULT 'pending',
    welcome_mail  TEXT DEFAULT 'pending',
    mail_error    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_registrations_email
    ON registrations (email);
`);

module.exports = sqlite;