const path = require("path");

// Load backend/.env explicitly
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Recovery = require("../models/Recovery");
const Payment = require("../models/Payment");

const fixRecoveryAmounts = async () => {
  try {
    console.log("======================================");
    console.log("PayRecover AI - Fix Recovery Amounts");
    console.log("======================================");

    await connectDB();

    console.log("MongoDB connection established.");
    console.log("Fetching recoveries...");

    const recoveries = await Recovery.find();

    console.log(`Found ${recoveries.length} recoveries.`);

    let updated = 0;
    let skipped = 0;

    for (const recovery of recoveries) {
      try {
        // If amount already exists, do nothing
        if (
          recovery.amount !== undefined &&
          recovery.amount !== null &&
          Number.isFinite(Number(recovery.amount))
        ) {
          skipped++;
          continue;
        }

        // Recovery must have a linked payment
        if (!recovery.paymentId) {
          console.log(
            `SKIPPED: ${recovery._id} - No paymentId`
          );
          skipped++;
          continue;
        }

        const payment = await Payment.findById(
          recovery.paymentId
        );

        if (!payment) {
          console.log(
            `SKIPPED: ${recovery._id} - Payment not found`
          );
          skipped++;
          continue;
        }

        if (
          payment.amount === undefined ||
          payment.amount === null ||
          !Number.isFinite(Number(payment.amount))
        ) {
          console.log(
            `SKIPPED: ${recovery._id} - Payment has no valid amount`
          );
          skipped++;
          continue;
        }

        recovery.amount = Number(payment.amount);

        if (!recovery.currency) {
          recovery.currency =
            payment.currency || "INR";
        }

        if (!recovery.customerName) {
          recovery.customerName =
            payment.customerName || "Customer";
        }

        if (!recovery.customerEmail) {
          recovery.customerEmail =
            payment.customerEmail ||
            "unknown@example.com";
        }

        if (!recovery.customerPhone) {
          recovery.customerPhone =
            payment.customerPhone || null;
        }

        await recovery.save();

        updated++;

        console.log(
          `[${updated}] UPDATED: ${recovery._id} | Amount: INR ${recovery.amount}`
        );
      } catch (error) {
        skipped++;

        console.log(
          `FAILED: ${recovery._id} | ${error.message}`
        );
      }
    }

    console.log("");
    console.log("======================================");
    console.log("RECOVERY AMOUNT FIX COMPLETE");
    console.log("======================================");
    console.log(
      `Total recoveries : ${recoveries.length}`
    );
    console.log(
      `Updated          : ${updated}`
    );
    console.log(
      `Skipped/failed   : ${skipped}`
    );
    console.log("======================================");

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("======================================");
    console.error("FIX FAILED");
    console.error("======================================");
    console.error(error.message);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
};

fixRecoveryAmounts();