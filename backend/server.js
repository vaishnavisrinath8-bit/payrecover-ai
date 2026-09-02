
// ============================================================
// PAYRECOVER AI - BACKEND SERVER
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");

// ============================================================
// DNS CONFIGURATION
// ============================================================

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

console.log("DNS configured: 8.8.8.8, 1.1.1.1");

// ============================================================
// ROUTES
// ============================================================

const paymentRoutes = require("./routes/paymentRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");

// ============================================================
// APP
// ============================================================

const app = express();

// ============================================================
// PORT
// ============================================================

const PORT = Number(process.env.PORT) || 3001;

// ============================================================
// MONGODB URI
// ============================================================

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(`
============================================================
ERROR: MONGO_URI IS MISSING
============================================================

Create this file:

backend/.env

Example:

MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/payrecover

PORT=3001

============================================================
`);

  process.exit(1);
}

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // such as Postman or direct backend requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(
        `CORS request from unallowed origin: ${origin}`
      );

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
    ],
  })
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: "5mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb",
  })
);

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration =
      Date.now() - startedAt;

    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`
    );
  });

  next();
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  const mongoConnected =
    mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    message: "PayRecover AI backend is running.",
    server: "PayRecover AI",
    port: PORT,
    database: mongoConnected
      ? "connected"
      : "disconnected",
    timestamp:
      new Date().toISOString(),
  });
});

// ============================================================
// DATABASE STATUS
// ============================================================

app.get("/api/db-status", (req, res) => {
  const state =
    mongoose.connection.readyState;

  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    success: state === 1,
    database:
      states[state] || "unknown",
    readyState: state,
  });
});

// ============================================================
// ROOT API
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PayRecover AI API",
    status: "running",
    version: "1.0.0",

    endpoints: {
      health:
        "/api/health",

      database:
        "/api/db-status",

      payments:
        "/api/payments",

      paymentStats:
        "/api/payments/stats",

      recentPayments:
        "/api/payments/recent",

      recoveries:
        "/api/recovery",

      recoveryQueue:
        "/api/recovery/queue",

      recoveryAnalytics:
        "/api/recovery/analytics",
    },

    frontend:
      "http://localhost:5173",

    backend:
      `http://localhost:${PORT}`,
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/recovery",
  recoveryRoutes
);

// ============================================================
// API 404 HANDLER
// ============================================================

app.use((req, res) => {
  console.log(
    `404 API endpoint not found: ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
    method: req.method,
    path: req.originalUrl,
    availableEndpoints: {
      health:
        "/api/health",

      payments:
        "/api/payments",

      recoveries:
        "/api/recovery",

      recoveryQueue:
        "/api/recovery/queue",

      recoveryAnalytics:
        "/api/recovery/analytics",
    },
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "============================================================"
    );

    console.error(
      "GLOBAL SERVER ERROR"
    );

    console.error(
      error
    );

    console.error(
      "============================================================"
    );

    if (res.headersSent) {
      return next(error);
    }

    const status =
      error.status ||
      error.statusCode ||
      500;

    res.status(status).json({
      success: false,

      message:
        error.message ||
        "Internal server error.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.stack
          : undefined,
    });
  }
);

// ============================================================
// MONGOOSE CONFIGURATION
// ============================================================

const mongooseOptions = {
  serverSelectionTimeoutMS: 15000,

  connectTimeoutMS: 15000,

  socketTimeoutMS: 45000,

  maxPoolSize: 10,

  minPoolSize: 2,

  family: 4,
};

// ============================================================
// MONGOOSE EVENTS
// ============================================================

mongoose.connection.on(
  "connected",
  () => {
    console.log(
      "MongoDB connection established."
    );
  }
);

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "MongoDB connection error:",
      error.message
    );
  }
);

mongoose.connection.on(
  "disconnected",
  () => {
    console.warn(
      "MongoDB disconnected."
    );
  }
);

// ============================================================
// START SERVER
// ============================================================

let server = null;

async function startServer() {
  try {
    console.log(`
============================================================
                 PAYRECOVER AI
                 BACKEND SERVER
============================================================
`);

    console.log(
      "Environment:",
      process.env.NODE_ENV ||
        "development"
    );

    console.log(
      "Port:",
      PORT
    );

    console.log(
      "DNS servers:",
      "8.8.8.8, 1.1.1.1"
    );

    console.log(
      "Connecting to MongoDB Atlas..."
    );

    await mongoose.connect(
      MONGO_URI,
      mongooseOptions
    );

    console.log(
      "MongoDB connected successfully."
    );

    server = app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(`
============================================================
              SERVER STARTED SUCCESSFULLY
============================================================

Backend:
http://localhost:${PORT}

Frontend:
http://localhost:5173

API:
http://localhost:${PORT}/api

Health:
http://localhost:${PORT}/api/health

Database:
http://localhost:${PORT}/api/db-status

Payments:
http://localhost:${PORT}/api/payments

Payment Stats:
http://localhost:${PORT}/api/payments/stats

Recent Payments:
http://localhost:${PORT}/api/payments/recent

Recoveries:
http://localhost:${PORT}/api/recovery

Recovery Queue:
http://localhost:${PORT}/api/recovery/queue

Recovery Analytics:
http://localhost:${PORT}/api/recovery/analytics

============================================================
`);
      }
    );

    server.on(
      "error",
      (error) => {
        console.error(
          "HTTP SERVER ERROR:",
          error
        );

        if (
          error.code ===
          "EADDRINUSE"
        ) {
          console.error(`
Port ${PORT} is already in use.

Stop the existing backend process
and start the server again.
`);
        }

        process.exit(1);
      }
    );

  } catch (error) {
    console.error(`
============================================================
              SERVER STARTUP FAILED
============================================================
`);

    console.error(
      "Error name:",
      error.name
    );

    console.error(
      "Error message:",
      error.message
    );

    // --------------------------------------------------------
    // MongoDB error handling
    // --------------------------------------------------------

    if (
      error.name ===
      "MongoServerSelectionError"
    ) {
      console.error(`
MongoDB Atlas could not be reached.

Check:

1. MongoDB Atlas is running.
2. Your IP address is allowed in MongoDB Atlas Network Access.
3. MONGO_URI exists in backend/.env.
4. MongoDB username is correct.
5. MongoDB password is correct.
6. The database hostname is correct.
7. Your internet connection is working.
`);
    }

    // --------------------------------------------------------
    // DNS error
    // --------------------------------------------------------

    if (
      error.code ===
      "ENOTFOUND"
    ) {
      console.error(`
DNS resolution failed.

Configured DNS servers:

8.8.8.8
1.1.1.1

Check your MongoDB Atlas hostname
inside MONGO_URI.
`);
    }

    // --------------------------------------------------------
    // Connection refused
    // --------------------------------------------------------

    if (
      error.code ===
      "ECONNREFUSED"
    ) {
      console.error(`
Connection refused.

Check MongoDB Atlas and your network connection.
`);
    }

    // --------------------------------------------------------
    // Invalid URI
    // --------------------------------------------------------

    if (
      error.name ===
      "MongoParseError"
    ) {
      console.error(`
MONGO_URI is invalid.

Check backend/.env.

Example:

MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/payrecover
`);
    }

    process.exit(1);
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

async function shutdown(
  signal
) {
  console.log(
    `\n${signal} received.`
  );

  try {
    // --------------------------------------------------------
    // Stop accepting HTTP requests
    // --------------------------------------------------------

    if (server) {
      await new Promise(
        (resolve) => {
          server.close(() => {
            console.log(
              "HTTP server closed."
            );

            resolve();
          });
        }
      );
    }

    // --------------------------------------------------------
    // Close MongoDB
    // --------------------------------------------------------

    if (
      mongoose.connection.readyState !==
      0
    ) {
      await mongoose.connection.close();

      console.log(
        "MongoDB connection closed."
      );
    }

    console.log(
      "PayRecover AI backend stopped safely."
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "Shutdown error:",
      error.message
    );

    process.exit(1);
  }
}

// ============================================================
// PROCESS SIGNALS
// ============================================================

process.on(
  "SIGINT",
  () => {
    shutdown("SIGINT");
  }
);

process.on(
  "SIGTERM",
  () => {
    shutdown("SIGTERM");
  }
);

// ============================================================
// UNHANDLED PROMISE ERROR
// ============================================================

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "UNHANDLED PROMISE REJECTION:",
      reason
    );
  }
);

// ============================================================
// UNCAUGHT EXCEPTION
// ============================================================

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "UNCAUGHT EXCEPTION:",
      error
    );

    shutdown(
      "uncaughtException"
    );
  }
);

// ============================================================
// START APPLICATION
// ============================================================

startServer();

