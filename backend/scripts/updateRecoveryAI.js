const path = require("path");

// ============================================================
// LOAD BACKEND .ENV
// ============================================================

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

// ============================================================
// DATABASE
// ============================================================

const connectDB = require("../config/db");

// ============================================================
// MODELS
// ============================================================

const Payment = require("../models/Payment");
const Recovery = require("../models/Recovery");

// ============================================================
// AI ENGINE
// ============================================================

const {
  analyzeFailure,
} = require("../services/recoveryEngine");

// ============================================================
// UPDATE RECOVERY AI DATA
// ============================================================

async function updateRecoveryAI() {
  try {
    console.log("======================================");
    console.log("PayRecover AI - Recovery AI Update");
    console.log("======================================");

    // --------------------------------------------------------
    // CONNECT DATABASE
    // --------------------------------------------------------

    await connectDB();

    console.log("MongoDB connection established.");
    console.log("Fetching recoveries...");

    // --------------------------------------------------------
    // GET ALL RECOVERIES
    // --------------------------------------------------------

    const recoveries =
      await Recovery.find();

    console.log(
      `Found ${recoveries.length} recoveries.`
    );

    let updated = 0;
    let skipped = 0;

    // --------------------------------------------------------
    // PROCESS EACH RECOVERY
    // --------------------------------------------------------

    for (const recovery of recoveries) {
      try {
        // ----------------------------------------------------
        // FIND PAYMENT
        // ----------------------------------------------------

        const payment =
          await Payment.findById(
            recovery.paymentId
          );

        if (!payment) {
          console.log(
            `SKIPPED: Payment not found for recovery ${recovery._id}`
          );

          skipped++;
          continue;
        }

        // ----------------------------------------------------
        // RUN AI ENGINE
        // ----------------------------------------------------

        const analysis =
          analyzeFailure(
            {
              failureReason:
                payment.failureReason ||
                recovery.failureReason ||
                "",

              failureCode:
                payment.failureCode ||
                "",

              paymentMethod:
                payment.paymentMethod ||
                "",

              retryCount:
                payment.retryCount ||
                0,

              amount:
                payment.amount ||
                recovery.amount ||
                0,

              paymentStatus:
                payment.paymentStatus ||
                "failed",
            },
            {
              recoveryType:
                recovery.recoveryType ||
                "payment_failure",

              attemptCount:
                recovery.attemptCount ||
                0,

              maxAttempts:
                recovery.maxAttempts ||
                3,

              contactAllowed:
                recovery.contactAllowed !==
                false,

              daysOverdue: 0,
            }
          );

        // ----------------------------------------------------
        // UPDATE RECOVERY
        // ----------------------------------------------------

        recovery.failureCategory =
          analysis.failureCategory;

        recovery.rootCause =
          analysis.rootCause;

        recovery.aiScore =
          Number(
            analysis.aiScore || 0
          );

        recovery.recoveryProbability =
          Number(
            analysis.recoveryProbability || 0
          );

        recovery.priority =
          analysis.priority ||
          "MEDIUM";

        recovery.recommendedAction =
          analysis.action ||
          "send_email";

        recovery.escalationLevel =
          Number(
            analysis.escalationLevel || 0
          );

        if (
          analysis.stoppingReason
        ) {
          recovery.stoppingReason =
            analysis.stoppingReason;
        }

        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------

        await recovery.save();

        updated++;

        console.log(
          `[${updated}/${recoveries.length}] UPDATED: ${recovery.customerName} | AI Score: ${recovery.aiScore} | Probability: ${recovery.recoveryProbability}% | Priority: ${recovery.priority}`
        );
      } catch (error) {
        skipped++;

        console.error(
          `FAILED: Recovery ${recovery._id}`,
          error.message
        );
      }
    }

    // ========================================================
    // COMPLETE
    // ========================================================

    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "AI UPDATE COMPLETE"
    );
    console.log(
      "======================================"
    );

    console.log(
      `Total recoveries : ${recoveries.length}`
    );

    console.log(
      `Updated          : ${updated}`
    );

    console.log(
      `Skipped/failed   : ${skipped}`
    );

    console.log(
      "======================================"
    );

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error(
      "======================================"
    );
    console.error(
      "AI UPDATE FAILED"
    );
    console.error(
      "======================================"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
}

// ============================================================
// START
// ============================================================

updateRecoveryAI();