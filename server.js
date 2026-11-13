// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectMongo } = require("./db/mongoConnection");
const apiRouter = require("./routes/apiRouter");
const { globalErrorHandler } = require("./middleware/globalErrorHandler");

const app = express();
const PORT = Number(process.env.PORT) || 1234;

// ---------------------------------------------------------------------------
// CORS allow-list
// - Splits on commas, trims whitespace, strips any trailing slashes so that
//   "https://example.com/" and "https://example.com" are treated the same.
// - Logs rejected origins + the current allow-list to Vercel Runtime Logs
//   so you can immediately see why a request was blocked.
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

console.log("✅ CORS allow-list:", JSON.stringify(allowedOrigins));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / curl / server-to-server
      const normalized = origin.replace(/\/+$/, "");
      if (allowedOrigins.includes(normalized)) return cb(null, true);
      console.error(`❌ CORS blocked origin: "${origin}"`);
      console.error(`   Allowed origins: ${JSON.stringify(allowedOrigins)}`);
      cb(new Error(`CORS blocked for ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));

// Static images are served by Vercel from /public/images — do NOT use express.static().
// Place the logo at public/images/blearners-logo.png so it is reachable at
// https://<your-backend>.vercel.app/images/blearners-logo.png

app.get("/", (_req, res) =>
  res.json({ ok: true, service: "blearners-mail-backend", version: "1.0.0" }),
);

app.use(apiRouter);
app.use(globalErrorHandler);

async function bootstrap() {
  await connectMongo();
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`),
  );
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
}

// ---------------------------------------------------------------------------
// Vercel serverless export
// - Connects to Mongo lazily on first invocation; warm invocations reuse it.
// - Note: we intentionally do NOT call app.listen() here — Vercel invokes the
//   handler directly, and app.listen would break the serverless runtime.
// ---------------------------------------------------------------------------
let vercelReady = false;
const handler = async (req, res) => {
  if (!vercelReady) {
    await connectMongo();
    vercelReady = true;
  }
  return app(req, res);
};

module.exports = handler;
module.exports.app = app;