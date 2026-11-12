// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// MongoDB connection (async — awaited before we start accepting requests)
const { connectMongo } = require("./db/mongoConnection");

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

// Serve public images so email clients can load the logo over HTTPS
app.use("/images", express.static(path.join(__dirname, "public", "images")));

app.get("/", (_req, res) =>
  res.json({ ok: true, service: "blearners-mail-backend", version: "1.0.0" })
);

app.use(apiRouter);
app.use(globalErrorHandler);

/**
 * Local dev: connect once, then listen on PORT.
 * Vercel (serverless): the exported handler below connects lazily per cold
 * start (warm invocations reuse the module-level Mongoose connection).
 */
async function bootstrap() {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Allowed origins: ${allowedOrigins.join(", ")}`);
  });
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
}

// ---- Vercel serverless export ----
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