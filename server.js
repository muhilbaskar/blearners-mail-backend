// server.js (only the changed parts are shown; the rest remains the same)
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectMongo } = require("./db/mongoConnection");
const apiRouter = require("./routes/apiRouter");
const { globalErrorHandler } = require("./middleware/globalErrorHandler");

const app = express();
const PORT = Number(process.env.PORT) || 1234;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",").map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked for ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "100kb" }));

// ❌ Deleted: app.use("/images", express.static(...));
// ✅ Move the logo to public/images/; Vercel automatically serves it at /images/blearners-logo.png

app.get("/", (_req, res) =>
  res.json({ ok: true, service: "blearners-mail-backend", version: "1.0.0" })
);

app.use(apiRouter);
app.use(globalErrorHandler);

async function bootstrap() {
  await connectMongo();
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

if (require.main === module) {
  bootstrap().catch(err => { console.error("❌ Failed:", err); process.exit(1); });
}

// Vercel serverless export (keep unchanged)
let vercelReady = false;
const handler = async (req, res) => {
  if (!vercelReady) { await connectMongo(); vercelReady = true; }
  return app(req, res);
};
module.exports = handler;
module.exports.app = app;