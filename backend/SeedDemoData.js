
require("dotenv").config();

const mongoose = require("mongoose");
const dns = require("dns");

// ============================================================
// DNS CONFIGURATION
// ============================================================

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

// ============================================================
// MODELS
// ============================================================

const Payment = require("./models/Payment");
const Recovery = require("./models/Recovery");

// ============================================================
// MONGODB CONFIGURATION
// ============================================================

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(`
============================================================
MONGODB URI MISSING
============================================================

MONGO_URI was not found in backend/.env

Example:

MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/payrecover

============================================================
`);

  process.exit(1);
}

// ============================================================
// DEMO DATA CONFIGURATION
// ============================================================

const TOTAL_PAYMENTS = 500;

// ============================================================
// REALISTIC CUSTOMER DATA
// ============================================================

const firstNames = [
  "Aarav",
  "Aanya",
  "Aditya",
  "Akash",
  "Ananya",
  "Arjun",
  "Arnav",
  "Aryan",
  "Bhavya",
  "Chaitanya",
  "Dhruv",
  "Diya",
  "Divya",
  "Ishaan",
  "Ishita",
  "Kabir",
  "Karan",
  "Karthik",
  "Kiara",
  "Krishna",
  "Manav",
  "Meera",
  "Mihir",
  "Nandini",
  "Neha",
  "Nikhil",
  "Nisha",
  "Pooja",
  "Pranav",
  "Priya",
  "Rahul",
  "Riya",
  "Rohan",
  "Rohit",
  "Sahil",
  "Sakshi",
  "Sameer",
  "Sanjay",
  "Shivam",
  "Shreya",
  "Sneha",
  "Tanvi",
  "Varun",
  "Vikas",
  "Vikram",
  "Yash",
];

const lastNames = [
  "Sharma",
  "Verma",
  "Patel",
  "Mehta",
  "Kapoor",
  "Singh",
  "Kumar",
  "Iyer",
  "Rao",
  "Nair",
  "Menon",
  "Desai",
  "Malhotra",
  "Joshi",
  "Gupta",
  "Reddy",
  "Choudhary",
  "Agarwal",
  "Bansal",
  "Mishra",
];

// ============================================================
// FAILURE CONFIGURATION
// ============================================================

const failureTypes = [
  {
    reason: "Insufficient funds",
    code: "INSUFFICIENT_FUNDS",
    category: "insufficient_funds",
    probability: 0.22,
    priority: "HIGH",
    action: "send_email",
    channel: "email",
    score: [82, 96],
    recoveryProbability: [68, 91],
  },

  {
    reason: "Bank declined the transaction",
    code: "BANK_DECLINED",
    category: "bank_decline",
    probability: 0.17,
    priority: "HIGH",
    action: "retry_payment",
    channel: "payment_retry",
    score: [75, 94],
    recoveryProbability: [60, 86],
  },

  {
    reason: "Card payment declined",
    code: "CARD_DECLINED",
    category: "card_decline",
    probability: 0.14,
    priority: "MEDIUM",
    action: "retry_payment",
    channel: "payment_retry",
    score: [65, 89],
    recoveryProbability: [52, 79],
  },

  {
    reason: "Authentication failed",
    code: "AUTH_FAILED",
    category: "authentication",
    probability: 0.10,
    priority: "MEDIUM",
    action: "send_hinglish_email",
    channel: "email",
    score: [65, 87],
    recoveryProbability: [55, 78],
  },

  {
    reason: "Network timeout",
    code: "TIMEOUT",
    category: "timeout",
    probability: 0.10,
    priority: "HIGH",
    action: "retry_payment",
    channel: "payment_retry",
    score: [80, 97],
    recoveryProbability: [72, 94],
  },

  {
    reason: "Payment gateway network error",
    code: "NETWORK_ERROR",
    category: "network",
    probability: 0.08,
    priority: "MEDIUM",
    action: "retry_payment",
    channel: "payment_retry",
    score: [70, 92],
    recoveryProbability: [60, 88],
  },

  {
    reason: "Expired card",
    code: "EXPIRED_CARD",
    category: "expired_card",
    probability: 0.07,
    priority: "LOW",
    action: "contact_customer",
    channel: "manual",
    score: [25, 55],
    recoveryProbability: [12, 35],
  },

  {
    reason: "Invalid payment details",
    code: "INVALID_DETAILS",
    category: "invalid_details",
    probability: 0.07,
    priority: "MEDIUM",
    action: "retry_payment",
    channel: "payment_retry",
    score: [65, 90],
    recoveryProbability: [55, 86],
  },

  {
    reason: "Payment authentication timeout",
    code: "AUTH_TIMEOUT",
    category: "authentication",
    probability: 0.05,
    priority: "MEDIUM",
    action: "send_email",
    channel: "email",
    score: [60, 85],
    recoveryProbability: [50, 80],
  },
];

// ============================================================
// PAYMENT METHODS
// ============================================================

const paymentMethods = [
  "upi",
  "upi",
  "upi",
  "card",
  "card",
  "card",
  "netbanking",
  "netbanking",
];

// ============================================================
// AMOUNT OPTIONS
// ============================================================

const amounts = [
  499,
  799,
  999,
  1199,
  1299,
  1499,
  1599,
  1799,
  1899,
  1999,
  2199,
  2499,
  2799,
  2999,
  3199,
  3499,
  3999,
  4299,
  4499,
  4999,
  5499,
  5999,
  6499,
  6999,
  7499,
  7999,
  8499,
  8999,
  9999,
  10999,
  11999,
  12999,
  14999,
  17999,
  19999,
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function randomItem(array) {
  return array[
    Math.floor(Math.random() * array.length)
  ];
}

function randomNumber(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function randomBoolean(probability) {
  return Math.random() < probability;
}

function generateCustomerName() {
  return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
}

function generateEmail(name, index) {
  const cleanName = name
    .toLowerCase()
    .replace(/\s+/g, ".");

  return `${cleanName}${index}@example.com`;
}

function generatePhone(index) {
  return `+9198${String(
    10000000 + index
  ).slice(-8)}`;
}

function getRandomAmount() {
  return randomItem(amounts);
}

function getPaymentMethod() {
  return randomItem(paymentMethods);
}

// ============================================================
// SELECT FAILURE TYPE
// ============================================================

function getFailureType() {
  const random = Math.random();

  let cumulative = 0;

  for (const failure of failureTypes) {
    cumulative += failure.probability;

    if (random <= cumulative) {
      return failure;
    }
  }

  return failureTypes[0];
}

// ============================================================
// DATE GENERATOR
// ============================================================

function generateCreatedAt(index) {
  const now = Date.now();

  // Spread records across approximately 90 days.
  const daysAgo =
    (index % 90) +
    Math.random();

  const hoursAgo =
    Math.floor(Math.random() * 24);

  const minutesAgo =
    Math.floor(Math.random() * 60);

  return new Date(
    now -
      daysAgo *
        24 *
        60 *
        60 *
        1000 -
      hoursAgo *
        60 *
        60 *
        1000 -
      minutesAgo *
        60 *
        1000
  );
}

// ============================================================
// CREATE PAYMENT
// ============================================================

function buildPayment(index) {
  const customerName =
    generateCustomerName();

  const customerEmail =
    generateEmail(
      customerName,
      index + 1
    );

  const customerPhone =
    generatePhone(index + 1);

  const amount =
    getRandomAmount();

  const paymentMethod =
    getPaymentMethod();

  const createdAt =
    generateCreatedAt(index);

  // Approximately 72% successful
  // and 28% failed.
  const isFailed =
    randomBoolean(0.28);

  if (!isFailed) {
    return {
      razorpayPaymentId:
        `pay_demo_${String(
          index + 1
        ).padStart(5, "0")}`,

      razorpayOrderId:
        `order_demo_${String(
          index + 1
        ).padStart(5, "0")}`,

      amount,

      currency: "INR",

      customerName,

      customerEmail,

      customerPhone,

      paymentStatus: "success",

      failureReason: null,

      failureCode: null,

      paymentMethod,

      retryCount: 0,

      recoveryStatus: "not_started",

      aiRecommendation: {
        action: null,
        reason: null,
        message: null,
      },

      recoveryPriority: null,

      metadata: {
        demo: true,
        source: "seedDemoData",
        seedIndex: index + 1,
      },

      createdAt,

      updatedAt: createdAt,
    };
  }

  const failure =
    getFailureType();

  const aiScore =
    randomNumber(
      failure.score[0],
      failure.score[1]
    );

  const recoveryProbability =
    randomNumber(
      failure.recoveryProbability[0],
      failure.recoveryProbability[1]
    );

  let recoveryStatus =
    "in_progress";

  // Expired cards and very low probability
  // cases become unrecoverable.
  if (
    failure.category ===
      "expired_card" ||
    recoveryProbability < 25
  ) {
    recoveryStatus =
      "unrecoverable";
  }

  // Some high probability cases are
  // already recovered.
  if (
    recoveryProbability >= 88 &&
    randomBoolean(0.35)
  ) {
    recoveryStatus =
      "recovered";
  }

  const message =
    failure.category ===
    "insufficient_funds"
      ? "Your recent payment could not be completed due to insufficient funds. Please retry when convenient."
      : failure.category ===
        "expired_card"
      ? "Your saved card has expired. Please update your payment method and try again."
      : failure.category ===
        "timeout"
      ? "Your payment timed out before completion. Please retry the transaction."
      : "Your recent payment could not be completed. Please retry the payment.";

  return {
    razorpayPaymentId:
      `pay_demo_${String(
        index + 1
      ).padStart(5, "0")}`,

    razorpayOrderId:
      `order_demo_${String(
        index + 1
      ).padStart(5, "0")}`,

    amount,

    currency: "INR",

    customerName,

    customerEmail,

    customerPhone,

    paymentStatus: "failed",

    failureReason:
      failure.reason,

    failureCode:
      failure.code,

    paymentMethod,

    retryCount:
      recoveryStatus === "recovered"
        ? randomNumber(1, 2)
        : randomBoolean(0.25)
        ? 1
        : 0,

    recoveryStatus,

    aiRecommendation: {
      action: failure.action,

      reason:
        failure.category ===
        "insufficient_funds"
          ? "Customer has a strong probability of successful recovery through a timely payment reminder."
          : failure.category ===
            "expired_card"
          ? "Customer intervention is required because the payment method has expired."
          : failure.category ===
            "timeout"
          ? "The transaction timed out and has a strong probability of succeeding on retry."
          : "AI analysis recommends a recovery action based on the payment failure pattern.",

      message,
    },

    recoveryPriority:
      failure.priority,

    metadata: {
      demo: true,
      source: "seedDemoData",
      seedIndex: index + 1,
    },

    createdAt,

    updatedAt: createdAt,
  };
}

// ============================================================
// BUILD RECOVERY
// ============================================================

function buildRecovery(payment, index) {
  if (
    payment.paymentStatus !==
    "failed"
  ) {
    return null;
  }

  const aiRecommendation =
    payment.aiRecommendation;

  const probability =
    extractProbability(
      payment,
      index
    );

  let status =
    "in_progress";

  if (
    payment.recoveryStatus ===
    "recovered"
  ) {
    status = "recovered";
  }

  if (
    payment.recoveryStatus ===
    "unrecoverable"
  ) {
    status = "unrecoverable";
  }

  if (
    status === "in_progress" &&
    randomBoolean(0.30)
  ) {
    status = "pending";
  }

  if (
    status === "in_progress" &&
    randomBoolean(0.20)
  ) {
    status = "contacted";
  }

  const isRecovered =
    status === "recovered";

  const isUnrecoverable =
    status === "unrecoverable";

  const createdAt =
    payment.createdAt;

  const lastActionAt =
    isRecovered
      ? new Date(
          createdAt.getTime() +
            randomNumber(
              1,
              72
            ) *
              60 *
              60 *
              1000
        )
      : null;

  const nextActionAt =
    isRecovered ||
    isUnrecoverable
      ? null
      : new Date(
          Date.now() +
            randomNumber(
              2,
              72
            ) *
              60 *
              60 *
              1000
        );

  const attemptCount =
    isRecovered
      ? randomNumber(1, 3)
      : randomNumber(0, 2);

  let stoppingReason = null;

  if (isRecovered) {
    stoppingReason =
      "recovered";
  }

  if (isUnrecoverable) {
    stoppingReason =
      "unrecoverable";
  }

  return {
    paymentId:
      payment._id,

    customerName:
      payment.customerName,

    customerEmail:
      payment.customerEmail,

    customerPhone:
      payment.customerPhone,

    amount:
      payment.amount,

    currency:
      payment.currency,

    recoveredAmount:
      isRecovered
        ? payment.amount
        : 0,

    recoveredAt:
      isRecovered
        ? lastActionAt
        : null,

    recoveryType:
      "payment_failure",

    status,

    failureReason:
      payment.failureReason,

    failureCategory:
      getFailureCategory(
        payment.failureCode
      ),

    rootCause:
      payment.failureReason,

    aiScore:
      randomNumber(
        70,
        97
      ),

    recoveryProbability:
      probability,

    priority:
      payment.recoveryPriority ||
      "MEDIUM",

    recommendedAction:
      aiRecommendation.action ||
      "send_email",

    currentStep:
      isRecovered
        ? randomNumber(2, 4)
        : randomNumber(0, 2),

    maxAttempts: 3,

    attemptCount,

    nextActionAt,

    lastActionAt,

    recoveryChannel:
      getRecoveryChannel(
        aiRecommendation.action
      ),

    promiseToPay: {
      promised:
        [
          "in_progress",
          "contacted",
        ].includes(status) &&
        randomBoolean(0.25),

      promisedAmount:
        status ===
          "in_progress" &&
        randomBoolean(0.25)
          ? payment.amount
          : 0,

      promisedDate:
        status ===
          "in_progress" &&
        randomBoolean(0.25)
          ? new Date(
              Date.now() +
                randomNumber(
                  1,
                  7
                ) *
                  24 *
                  60 *
                  60 *
                  1000
            )
          : null,

      fulfilled:
        isRecovered,

      fulfilledAt:
        isRecovered
          ? lastActionAt
          : null,
    },

    stoppingReason,

    escalationLevel:
      payment.recoveryPriority ===
      "HIGH"
        ? randomNumber(1, 3)
        : randomNumber(0, 2),

    contactAllowed:
      !isUnrecoverable,

    messageLanguage:
      aiRecommendation.action ===
      "send_hinglish_email"
        ? "hinglish"
        : "english",

    generatedMessage:
      aiRecommendation.message,

    campaignId:
      `DEMO-CAMPAIGN-${String(
        ((index % 25) + 1)
      ).padStart(3, "0")}`,

    metadata: {
      demo: true,
      source: "seedDemoData",
      paymentSeedIndex:
        index + 1,
    },

    auditTrail:
      buildAuditTrail(
        payment,
        status,
        isRecovered,
        isUnrecoverable,
        index
      ),

    createdAt,

    updatedAt:
      lastActionAt ||
      createdAt,
  };
}

// ============================================================
// FAILURE CATEGORY
// ============================================================

function getFailureCategory(
  failureCode
) {
  const map = {
    INSUFFICIENT_FUNDS:
      "insufficient_funds",

    BANK_DECLINED:
      "bank_decline",

    CARD_DECLINED:
      "card_decline",

    AUTH_FAILED:
      "authentication",

    AUTH_TIMEOUT:
      "authentication",

    TIMEOUT:
      "timeout",

    NETWORK_ERROR:
      "network",

    EXPIRED_CARD:
      "expired_card",

    INVALID_DETAILS:
      "invalid_details",
  };

  return (
    map[failureCode] ||
    "unknown"
  );
}

// ============================================================
// RECOVERY CHANNEL
// ============================================================

function getRecoveryChannel(
  action
) {
  switch (action) {
    case "retry_payment":
      return "payment_retry";

    case "send_email":
      return "email";

    case "send_hinglish_email":
      return "email";

    case "contact_customer":
      return "manual";

    case "send_voice_message":
      return "voice";

    default:
      return "email";
  }
}

// ============================================================
// RECOVERY PROBABILITY
// ============================================================

function extractProbability(
  payment,
  index
) {
  const category =
    getFailureCategory(
      payment.failureCode
    );

  const config =
    failureTypes.find(
      (item) =>
        item.category ===
        category
    );

  if (!config) {
    return randomNumber(
      50,
      85
    );
  }

  return randomNumber(
    config.recoveryProbability[0],
    config.recoveryProbability[1]
  );
}

// ============================================================
// AUDIT TRAIL
// ============================================================

function buildAuditTrail(
  payment,
  status,
  isRecovered,
  isUnrecoverable,
  index
) {
  const trail = [];

  trail.push({
    timestamp:
      payment.createdAt,

    actor: "ai",

    action:
      "recovery_case_created",

    previousStatus: null,

    newStatus: status,

    reason:
      "Payment failure automatically identified for recovery.",

    customerName:
      payment.customerName,

    customerEmail:
      payment.customerEmail,

    amount:
      payment.amount,

    recoveryId: null,

    metadata: {
      source:
        "AI recovery engine",
    },
  });

  if (
    !isRecovered &&
    !isUnrecoverable
  ) {
    trail.push({
      timestamp:
        new Date(
          payment.createdAt.getTime() +
            60 *
              60 *
              1000
        ),

      actor: "system",

      action:
        "recovery_action_scheduled",

      previousStatus:
        "created",

      newStatus:
        status,

      reason:
        "Automated recovery workflow scheduled next action.",

      customerName:
        payment.customerName,

      customerEmail:
        payment.customerEmail,

      amount:
        payment.amount,

      recoveryId: null,

      metadata: {
        attempt:
          1,
      },
    });
  }

  if (isRecovered) {
    trail.push({
      timestamp:
        new Date(
          payment.createdAt.getTime() +
            randomNumber(
              2,
              48
            ) *
              60 *
              60 *
              1000
        ),

      actor: "system",

      action:
        "payment_recovered",

      previousStatus:
        "in_progress",

      newStatus:
        "recovered",

      reason:
        "Payment successfully recovered after automated recovery action.",

      customerName:
        payment.customerName,

      customerEmail:
        payment.customerEmail,

      amount:
        payment.amount,

      recoveryId: null,

      metadata: {
        recovered:
          true,
      },
    });
  }

  if (isUnrecoverable) {
    trail.push({
      timestamp:
        new Date(
          payment.createdAt.getTime() +
            randomNumber(
              12,
              72
            ) *
              60 *
              60 *
              1000
        ),

      actor: "ai",

      action:
        "recovery_stopped",

      previousStatus:
        "in_progress",

      newStatus:
        "unrecoverable",

      reason:
        "Recovery probability is too low or customer intervention is required.",

      customerName:
        payment.customerName,

      customerEmail:
        payment.customerEmail,

      amount:
        payment.amount,

      recoveryId: null,

      metadata: {
        stopped:
          true,
      },
    });
  }

  return trail;
}

// ============================================================
// SEED DATABASE
// ============================================================

async function seedDatabase() {
  try {
    console.log(`
============================================================
             PAYRECOVER AI DEMO DATA SEED
============================================================
`);

    console.log(
      "Connecting to MongoDB..."
    );

    await mongoose.connect(
      MONGO_URI,
      {
        serverSelectionTimeoutMS:
          15000,
      }
    );

    console.log(
      "MongoDB connected successfully.\n"
    );

    // ========================================================
    // DELETE OLD DEMO RECOVERIES
    // ========================================================

    console.log(
      "Removing previous demo recovery records..."
    );

    const deletedRecoveries =
      await Recovery.deleteMany({
        "metadata.demo": true,
      });

    console.log(
      `Removed ${deletedRecoveries.deletedCount} recovery record(s).`
    );

    // ========================================================
    // DELETE OLD DEMO PAYMENTS
    // ========================================================

    console.log(
      "Removing previous demo payment records..."
    );

    const deletedPayments =
      await Payment.deleteMany({
        "metadata.demo": true,
      });

    console.log(
      `Removed ${deletedPayments.deletedCount} payment record(s).\n`
    );

    // ========================================================
    // CREATE PAYMENTS
    // ========================================================

    console.log(
      `Creating ${TOTAL_PAYMENTS} realistic demo payment records...`
    );

    const paymentData = [];

    for (
      let index = 0;
      index < TOTAL_PAYMENTS;
      index++
    ) {
      paymentData.push(
        buildPayment(index)
      );
    }

    const createdPayments =
      await Payment.insertMany(
        paymentData
      );

    console.log(
      `Created ${createdPayments.length} payment record(s).\n`
    );

    // ========================================================
    // CREATE RECOVERIES
    // ========================================================

    console.log(
      "Creating recovery cases..."
    );

    const recoveriesToInsert =
      createdPayments
        .map(
          (payment, index) =>
            buildRecovery(
              payment,
              index
            )
        )
        .filter(Boolean);

    const createdRecoveries =
      await Recovery.insertMany(
        recoveriesToInsert
      );

    console.log(
      `Created ${createdRecoveries.length} recovery record(s).\n`
    );

    // ========================================================
    // UPDATE PAYMENT RECOVERY STATUS
    // ========================================================

    console.log(
      "Updating payment recovery statuses..."
    );

    for (
      const recovery of createdRecoveries
    ) {
      let recoveryStatus =
        "in_progress";

      if (
        recovery.status ===
        "recovered"
      ) {
        recoveryStatus =
          "recovered";
      }

      if (
        recovery.status ===
        "unrecoverable"
      ) {
        recoveryStatus =
          "unrecoverable";
      }

      await Payment.findByIdAndUpdate(
        recovery.paymentId,
        {
          recoveryStatus,
        }
      );
    }

    // ========================================================
    // STATISTICS
    // ========================================================

    const successfulPayments =
      createdPayments.filter(
        (payment) =>
          payment.paymentStatus ===
          "success"
      );

    const failedPayments =
      createdPayments.filter(
        (payment) =>
          payment.paymentStatus ===
          "failed"
      );

    const activeRecoveries =
      createdRecoveries.filter(
        (recovery) =>
          [
            "created",
            "pending",
            "in_progress",
            "contacted",
            "promised",
          ].includes(
            recovery.status
          )
      );

    const recoveredCases =
      createdRecoveries.filter(
        (recovery) =>
          recovery.status ===
          "recovered"
      );

    const unrecoverableCases =
      createdRecoveries.filter(
        (recovery) =>
          recovery.status ===
          "unrecoverable"
      );

    const totalPaymentValue =
      createdPayments.reduce(
        (total, payment) =>
          total + payment.amount,
        0
      );

    const failedPaymentValue =
      failedPayments.reduce(
        (total, payment) =>
          total + payment.amount,
        0
      );

    const recoveredValue =
      recoveredCases.reduce(
        (total, recovery) =>
          total +
          recovery.recoveredAmount,
        0
      );

    // ========================================================
    // PAYMENT METHOD STATISTICS
    // ========================================================

    const upiPayments =
      createdPayments.filter(
        (payment) =>
          payment.paymentMethod ===
          "upi"
      ).length;

    const cardPayments =
      createdPayments.filter(
        (payment) =>
          payment.paymentMethod ===
          "card"
      ).length;

    const netbankingPayments =
      createdPayments.filter(
        (payment) =>
          payment.paymentMethod ===
          "netbanking"
      ).length;

    // ========================================================
    // FINAL OUTPUT
    // ========================================================

    console.log(`
============================================================
                  SEED SUCCESSFUL
============================================================

Payments             : ${createdPayments.length}
Successful Payments  : ${successfulPayments.length}
Failed Payments      : ${failedPayments.length}

Total Payment Value  : ₹${totalPaymentValue.toLocaleString(
      "en-IN"
    )}

Failed Payment Value : ₹${failedPaymentValue.toLocaleString(
      "en-IN"
    )}

Recovery Cases       : ${createdRecoveries.length}
Active Recoveries    : ${activeRecoveries.length}
Recovered Cases      : ${recoveredCases.length}
Unrecoverable Cases  : ${unrecoverableCases.length}

Recovered Value      : ₹${recoveredValue.toLocaleString(
      "en-IN"
    )}

------------------------------------------------------------

UPI Payments         : ${upiPayments}
Card Payments        : ${cardPayments}
Netbanking Payments  : ${netbankingPayments}

============================================================
`);

    console.log(
      "Demo data is ready."
    );

    console.log(
      "Refresh the PayRecover AI dashboard."
    );

    console.log(
      "Payments page should now display 400 records."
    );

    console.log(
      "Recoveries page should display the generated recovery cases."
    );

    console.log(
      "Analytics should now have enough data for charts."
    );

  } catch (error) {
    console.error(`
============================================================
                    SEED FAILED
============================================================
`);

    console.error(
      error.message
    );

    if (
      error.code ===
      "ECONNREFUSED"
    ) {
      console.error(`
MongoDB is not reachable.

Check:
1. MongoDB Atlas is accessible.
2. Your internet connection works.
3. backend/.env contains MONGO_URI.
`);
    }

    if (
      error.code ===
      "ENOTFOUND"
    ) {
      console.error(`
MongoDB hostname could not be resolved.

Check your MongoDB Atlas connection string.
`);
    }

    if (
      error.code ===
      "ERR_INVALID_URL"
    ) {
      console.error(`
Your MONGO_URI is invalid.

Check backend/.env.
`);
    }

    process.exitCode = 1;

  } finally {
    if (
      mongoose.connection.readyState !==
      0
    ) {
      await mongoose.connection.close();
    }

    console.log(
      "\nMongoDB connection closed."
    );
  }
}

// ============================================================
// START
// ============================================================

seedDatabase();

