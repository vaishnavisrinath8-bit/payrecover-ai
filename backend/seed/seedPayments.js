// ============================================================
// PayRecover AI - Demo Payment Dataset Seeder
// ============================================================

require("dotenv").config();

const dns = require("dns");

// ============================================================
// MongoDB Atlas DNS FIX
// ============================================================

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const mongoose = require("mongoose");

const Payment = require("../models/Payment");

// ============================================================
// Customer Dataset
// ============================================================

const customers = [
  {
    name: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    phone: "9876543210",
  },
  {
    name: "Priya Reddy",
    email: "priya.reddy@gmail.com",
    phone: "9876543211",
  },
  {
    name: "Arjun Kumar",
    email: "arjun.kumar@gmail.com",
    phone: "9876543212",
  },
  {
    name: "Sneha Patel",
    email: "sneha.patel@gmail.com",
    phone: "9876543213",
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@gmail.com",
    phone: "9876543214",
  },
  {
    name: "Ananya Gupta",
    email: "ananya.gupta@gmail.com",
    phone: "9876543215",
  },
  {
    name: "Rohan Mehta",
    email: "rohan.mehta@gmail.com",
    phone: "9876543216",
  },
  {
    name: "Kavya Nair",
    email: "kavya.nair@gmail.com",
    phone: "9876543217",
  },
  {
    name: "Aditya Verma",
    email: "aditya.verma@gmail.com",
    phone: "9876543218",
  },
  {
    name: "Neha Kapoor",
    email: "neha.kapoor@gmail.com",
    phone: "9876543219",
  },
  {
    name: "Suresh Iyer",
    email: "suresh.iyer@gmail.com",
    phone: "9876543220",
  },
  {
    name: "Pooja Shah",
    email: "pooja.shah@gmail.com",
    phone: "9876543221",
  },
  {
    name: "Karan Malhotra",
    email: "karan.malhotra@gmail.com",
    phone: "9876543222",
  },
  {
    name: "Meera Joshi",
    email: "meera.joshi@gmail.com",
    phone: "9876543223",
  },
  {
    name: "Amit Agarwal",
    email: "amit.agarwal@gmail.com",
    phone: "9876543224",
  },
];

// ============================================================
// Payment Methods
// ============================================================

const paymentMethods = [
  "upi",
  "card",
  "netbanking",
  "wallet",
];

// ============================================================
// Failure Reasons
// ============================================================

const failureReasons = [
  {
    reason: "Insufficient funds",
    code: "INSUFFICIENT_FUNDS",
  },
  {
    reason: "Bank timeout",
    code: "BANK_TIMEOUT",
  },
  {
    reason: "Card declined",
    code: "CARD_DECLINED",
  },
  {
    reason: "Payment gateway error",
    code: "GATEWAY_ERROR",
  },
  {
    reason: "Transaction limit exceeded",
    code: "LIMIT_EXCEEDED",
  },
  {
    reason: "Network error",
    code: "NETWORK_ERROR",
  },
];

// ============================================================
// Utility Functions
// ============================================================

const randomItem = (array) => {
  return array[
    Math.floor(Math.random() * array.length)
  ];
};

const randomAmount = () => {
  const amounts = [
    499,
    799,
    999,
    1200,
    1500,
    1999,
    2500,
    3500,
    5000,
    7500,
    10000,
    15000,
    20000,
    25000,
    50000,
  ];

  return randomItem(amounts);
};

const randomDate = () => {
  const now = new Date();

  const daysAgo =
    Math.floor(Math.random() * 30);

  const hoursAgo =
    Math.floor(Math.random() * 24);

  const minutesAgo =
    Math.floor(Math.random() * 60);

  const date = new Date(now);

  date.setDate(
    date.getDate() - daysAgo
  );

  date.setHours(
    date.getHours() - hoursAgo
  );

  date.setMinutes(
    date.getMinutes() - minutesAgo
  );

  return date;
};

const randomPhone = () => {
  return `9${Math.floor(
    100000000 + Math.random() * 900000000
  )}`;
};

// ============================================================
// Generate Payment
// ============================================================

const generatePayment = (index) => {
  const customer =
    randomItem(customers);

  const paymentMethod =
    randomItem(paymentMethods);

  const amount = randomAmount();

  const statusRandom = Math.random();

  let paymentStatus;

  // Approximately:
  // 72% success
  // 20% failed
  // 5% pending
  // 3% created

  if (statusRandom < 0.72) {
    paymentStatus = "success";
  } else if (statusRandom < 0.92) {
    paymentStatus = "failed";
  } else if (statusRandom < 0.97) {
    paymentStatus = "pending";
  } else {
    paymentStatus = "created";
  }

  let failureReason = null;
  let failureCode = null;

  let retryCount = 0;

  let recoveryStatus =
    "not_started";

  let recoveryPriority = null;

  let aiRecommendation = {
    action: null,
    reason: null,
    message: null,
  };

  // ==========================================================
  // Failed Payment
  // ==========================================================

  if (paymentStatus === "failed") {
    const failure =
      randomItem(failureReasons);

    failureReason = failure.reason;
    failureCode = failure.code;

    retryCount =
      Math.floor(Math.random() * 4);

    const recoveryRandom =
      Math.random();

    // Recovered
    if (recoveryRandom < 0.45) {
      recoveryStatus = "recovered";

      aiRecommendation = {
        action: "Retry payment",
        reason: failureReason,
        message:
          "Payment has a high recovery probability. An automated retry is recommended.",
      };

      recoveryPriority = "HIGH";
    }

    // In progress
    else if (recoveryRandom < 0.78) {
      recoveryStatus = "in_progress";

      aiRecommendation = {
        action:
          "Send recovery notification",
        reason: failureReason,
        message:
          "Customer should receive an automated recovery notification.",
      };

      recoveryPriority = "MEDIUM";
    }

    // Unrecoverable
    else if (recoveryRandom < 0.90) {
      recoveryStatus = "unrecoverable";

      aiRecommendation = {
        action: "Manual review",
        reason: failureReason,
        message:
          "Payment requires manual customer support intervention.",
      };

      recoveryPriority = "LOW";
    }

    // Not started
    else {
      recoveryStatus = "not_started";

      aiRecommendation = {
        action: "Start recovery",
        reason: failureReason,
        message:
          "Recovery workflow should be started immediately.",
      };

      recoveryPriority = "HIGH";
    }
  }

  // ==========================================================
  // Successful Payment
  // ==========================================================

  if (paymentStatus === "success") {
    recoveryStatus = "not_started";

    aiRecommendation = {
      action: null,
      reason: null,
      message: null,
    };

    recoveryPriority = null;
  }

  // ==========================================================
  // Pending Payment
  // ==========================================================

  if (paymentStatus === "pending") {
    recoveryStatus = "not_started";

    aiRecommendation = {
      action: "Monitor payment",
      reason: "Payment is still pending",
      message:
        "Monitor the transaction before starting recovery.",
    };

    recoveryPriority = "MEDIUM";
  }

  // ==========================================================
  // Created Payment
  // ==========================================================

  if (paymentStatus === "created") {
    recoveryStatus = "not_started";

    aiRecommendation = {
      action: "Wait for payment",
      reason: "Payment has not completed",
      message:
        "Wait for the payment to complete.",
    };

    recoveryPriority = "LOW";
  }

  // ==========================================================
  // Create MongoDB Document
  // ==========================================================

  return {
    razorpayPaymentId:
      `pay_demo_${String(index).padStart(5, "0")}`,

    razorpayOrderId:
      `order_demo_${String(index).padStart(5, "0")}`,

    amount,

    currency: "INR",

    customerName:
      customer.name,

    customerEmail:
      customer.email,

    customerPhone:
      customer.phone || randomPhone(),

    paymentStatus,

    failureReason,

    failureCode,

    paymentMethod,

    retryCount,

    recoveryStatus,

    aiRecommendation,

    recoveryPriority,

    createdAt: randomDate(),

    updatedAt: new Date(),
  };
};

// ============================================================
// Seed Database
// ============================================================

const seedDatabase = async () => {
  try {
    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "PayRecover AI - Database Seeder"
    );
    console.log(
      "========================================"
    );
    console.log("");

    // ----------------------------------------------------------
    // Check environment variable
    // ----------------------------------------------------------

    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing from .env"
      );
    }

    console.log(
      "Connecting to MongoDB..."
    );

    // ----------------------------------------------------------
    // Connect
    // ----------------------------------------------------------

    await mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 15000,
      }
    );

    console.log(
      "MongoDB connected successfully"
    );

    console.log("");

    // ----------------------------------------------------------
    // Delete existing demo payment data
    // ----------------------------------------------------------

    console.log(
      "Clearing existing payment data..."
    );

    await Payment.deleteMany({});

    console.log(
      "Existing payment data cleared"
    );

    console.log("");

    // ----------------------------------------------------------
    // Generate 300 payments
    // ----------------------------------------------------------

    console.log(
      "Generating payment dataset..."
    );

    const payments = [];

    for (let i = 1; i <= 300; i++) {
      payments.push(
        generatePayment(i)
      );
    }

    // ----------------------------------------------------------
    // Insert
    // ----------------------------------------------------------

    await Payment.insertMany(
      payments
    );

    console.log(
      `Successfully inserted ${payments.length} payments`
    );

    console.log("");

    // ----------------------------------------------------------
    // Display statistics
    // ----------------------------------------------------------

    const total =
      await Payment.countDocuments();

    const successful =
      await Payment.countDocuments({
        paymentStatus: "success",
      });

    const failed =
      await Payment.countDocuments({
        paymentStatus: "failed",
      });

    const pending =
      await Payment.countDocuments({
        paymentStatus: "pending",
      });

    const recovered =
      await Payment.countDocuments({
        recoveryStatus: "recovered",
      });

    const inProgress =
      await Payment.countDocuments({
        recoveryStatus: "in_progress",
      });

    const unrecoverable =
      await Payment.countDocuments({
        recoveryStatus: "unrecoverable",
      });

    console.log(
      "========================================"
    );

    console.log(
      "DATASET SUMMARY"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Total Payments       : ${total}`
    );

    console.log(
      `Successful Payments  : ${successful}`
    );

    console.log(
      `Failed Payments      : ${failed}`
    );

    console.log(
      `Pending Payments     : ${pending}`
    );

    console.log(
      `Recovered            : ${recovered}`
    );

    console.log(
      `In Progress          : ${inProgress}`
    );

    console.log(
      `Unrecoverable        : ${unrecoverable}`
    );

    console.log(
      "========================================"
    );

    console.log("");

    console.log(
      "Payment dataset created successfully!"
    );

    console.log("");

    await mongoose.connection.close();

    console.log(
      "MongoDB connection closed."
    );

    process.exit(0);
  } catch (error) {
    console.error("");

    console.error(
      "========================================"
    );

    console.error(
      "DATABASE SEED ERROR"
    );

    console.error(
      "========================================"
    );

    console.error(
      error.message
    );

    console.error("");

    if (
      error.message.includes(
        "querySrv"
      )
    ) {
      console.error(
        "MongoDB Atlas DNS resolution failed."
      );

      console.error(
        "Check your internet/DNS connection and MongoDB Atlas URI."
      );
    }

    console.error("");

    process.exit(1);
  }
};

seedDatabase();