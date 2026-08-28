const dns = require("dns");
const mongoose = require("mongoose");

// ============================================================
// MongoDB Atlas DNS FIX
// ============================================================

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

// ============================================================
// Connect MongoDB
// ============================================================

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in .env file"
      );
    }

    const conn = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 15000,
      }
    );

    console.log(
      `MongoDB connected: ${conn.connection.host}`
    );

    return conn;
  } catch (error) {
    console.error(
      "MongoDB connection error:",
      error.message
    );

    throw error;
  }
};

module.exports = connectDB;