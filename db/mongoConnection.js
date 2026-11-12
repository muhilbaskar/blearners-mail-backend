// db/mongoConnection.js
const mongoose = require("mongoose");

let connected = false;

/**
 * Connect to MongoDB. Safe to call from anywhere — it will only open one
 * connection per process. In Vercel's serverless runtime the connection is
 * cached on the module so warm invocations reuse it.
 */
async function connectMongo() {
  if (connected && mongoose.connection.readyState === 1) return mongoose;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI. Set it in .env (local) or Vercel Environment Variables."
    );
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, {
      // Serverless-friendly defaults
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      // Use a dedicated db if MONGODB_DB is set (optional)
      dbName: process.env.MONGODB_DB || undefined,
    });
    connected = true;
    console.log("✅ MongoDB connected");
  } else {
    // Already connecting or connected
    await mongoose.connection.asPromise();
    connected = true;
  }

  return mongoose;
}

module.exports = { connectMongo, mongoose };