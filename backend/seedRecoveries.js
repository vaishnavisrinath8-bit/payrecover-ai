const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const connectDB = require("./config/db");

const Payment = require("./models/payment");
const Recovery = require("./models/Recovery");

const {
  analyzeFailure,
} = require("./services/recoveryEngine");

const {
  generateRecoveryMessage,
} = require("./services/aiRecoveryService");

const seedRecoveries = async () => {
  try {
    await connectDB();

    console.log("Connected to MongoDB");

    // Find all failed payments
    const failedPayments = await Payment.find({
      paymentStatus: "failed",
    });

    console.log(
      `Found ${failedPayments.length} failed payments`
    );

    let created = 0;
    let skipped = 0;

    for (const payment of failedPayments) {
      // Check whether recovery already exists
      const existingRecovery =
        await Recovery.findOne({
          paymentId: payment._id,
        });

      if (existingRecovery) {
        skipped++;
        continue;
      }

      // Analyze failure
      const analysis =
        analyzeFailure(payment);

      // Generate recovery message
      const aiResult =
        generateRecoveryMessage(payment);

      // Decide recovery status based on payment
      let recoveryStatus = "created";

      if (
        payment.recoveryStatus ===
        "recovered"
      ) {
        recoveryStatus = "recovered";
      } else if (
        payment.recoveryStatus ===
        "in_progress"
      ) {
        recoveryStatus = "pending";
      } else if (
        payment.recoveryStatus ===
        "unrecoverable"
      ) {
        recoveryStatus = "failed";
      }

      // Create recovery
      const recovery =
        await Recovery.create({
          paymentId: payment._id,

          customerEmail:
            payment.customerEmail,

          customerName:
            payment.customerName,

          reason:
            payment.failureReason ||
            analysis.reason ||
            "Payment failed",

          status: recoveryStatus,

          recoveryMessage:
            aiResult.message,

          paymentLink:
            aiResult.paymentLink,

          attempts:
            payment.retryCount || 0,

          lastAttemptAt:
            payment.retryCount > 0
              ? payment.updatedAt
              : null,
        });

      created++;

      console.log(
        `Created recovery: ${recovery._id} for ${payment.razorpayPaymentId}`
      );
    }

    console.log("--------------------------------");
    console.log(
      `Recoveries created: ${created}`
    );
    console.log(
      `Recoveries skipped: ${skipped}`
    );
    console.log("--------------------------------");

    process.exit(0);
  } catch (error) {
    console.error(
      "Seed recoveries error:",
      error
    );

    process.exit(1);
  }
};

seedRecoveries();
