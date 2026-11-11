// routes/apiRouter.js
const { Router } = require("express");
const { handleRegister } = require("../controllers/registerController");

const apiRouter = Router();

apiRouter.get("/health", (_req, res) =>
  res.json({ ok: true, uptime: process.uptime(), ts: new Date().toISOString() })
);

apiRouter.post("/api/register", handleRegister);

module.exports = apiRouter;