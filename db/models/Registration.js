// db/models/Registration.js
const { mongoose } = require("../mongoConnection");

const { Schema } = mongoose;

const RegistrationSchema = new Schema(
  {
    // Fields that come from the form (identical to the SQLite columns)
    full_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: { type: String, default: null, trim: true },
    institution: { type: String, default: null, trim: true },
    role: { type: String, required: true, trim: true },
    place: { type: String, required: true, trim: true },

    // Mail delivery bookkeeping (same values as before: pending/sent/failed)
    admin_mail: { type: String, default: "pending" },
    welcome_mail: { type: String, default: "pending" },
    mail_error: { type: String, default: null },

    // Replaces the SQLite `created_at TEXT DEFAULT (datetime('now'))`
    created_at: { type: Date, default: () => new Date() },
  },
  {
    // Expose `_id` as `id` when serialized so the JSON response shape matches
    // the old SQLite behaviour (which returned a numeric `id`).
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// Non-unique index on email (same as before)
RegistrationSchema.index({ email: 1 });

module.exports =
  mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);