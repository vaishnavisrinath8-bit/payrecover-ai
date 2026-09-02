const mongoose = require("mongoose");

const checkoutSessionSchema = new mongoose.Schema(
  {
    // ==========================================================
    // CHECKOUT IDENTIFICATION
    // ==========================================================

    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // ==========================================================
    // CUSTOMER
    // ==========================================================

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      default: null,
      trim: true,
    },

    // ==========================================================
    // CHECKOUT VALUE
    // ==========================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    // ==========================================================
    // CHECKOUT STATUS
    // ==========================================================

    status: {
      type: String,
      enum: [
        "started",
        "active",
        "abandoned",
        "completed",
      ],
      default: "started",
      index: true,
    },

    // ==========================================================
    // TIMELINE
    // ==========================================================

    startedAt: {
      type: Date,
      default: Date.now,
    },

    abandonedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // ==========================================================
    // RECOVERY
    // ==========================================================

    recoveryCreated: {
      type: Boolean,
      default: false,
    },

    recoveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recovery",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CheckoutSession",
  checkoutSessionSchema
);