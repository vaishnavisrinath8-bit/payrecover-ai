const dns = require("dns");

// Fix MongoDB Atlas SRV DNS resolution
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Database connection
const connectDB = require("./config/db");

// Routes
const paymentRoutes = require("./routes/paymentRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// ============================================
// DATABASE
// ============================================

connectDB();

// ============================================
// HEALTH CHECK
// ============================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PayRecover AI Backend is running",
    port: process.env.PORT || 3001,
  });
});

// ============================================
// PAYMENT APIs
// ============================================

app.use("/api/payments", paymentRoutes);

// ============================================
// RECOVERY APIs
// ============================================

// IMPORTANT:
// Frontend page can be /recoveries
// Backend API is /api/recovery

app.use("/api/recovery", recoveryRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// ============================================
// PORT
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("========================================");
  console.log("PayRecover AI Backend");
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("========================================");
});