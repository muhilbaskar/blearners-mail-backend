// middleware/globalErrorHandler.js
function globalErrorHandler(err, _req, res, _next) {
  console.error("🔥 Unhandled:", err.stack || err.message || err);

  if (String(err.message).startsWith("CORS")) {
    return res.status(403).json({ success: false, error: err.message });
  }

  res.status(500).json({ success: false, error: "Internal server error" });
}

module.exports = { globalErrorHandler };