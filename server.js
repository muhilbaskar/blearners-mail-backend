// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Boot SQLite (creates file + schema on first run)
require("./db/sqliteConnection");

const apiRouter = require("./routes/apiRouter");
const { globalErrorHandler } = require("./middleware/globalErrorHandler");

const app = express();
const PORT = Number(process.env.PORT) || 1234;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked for ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) =>
  res.json({ ok: true, service: "blearners-mail-backend", version: "1.0.0" })
);

app.use(apiRouter);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(", ")}`);
});