const mongoose = require("mongoose");

const revenueOpportunitySchema =
  new mongoose.Schema(
    {
      customerName: {
        type: String,
        required: true,
      },

      customerEmail: {
        type: String,
        required: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        default: "INR",
      },

      opportunityType: {
        type: String,
        enum: [
          "payment_failure",
          "checkout_abandonment",
          "failed_subscription",
          "b2b_receivable",
          "mandate_failure",
        ],
        required: true,
      },

      status: {
        type: String,
        enum: [
          "detected",
          "in_recovery",
          "recovered",
          "lost",
          "stopped",
        ],
        default: "detected",
      },

      riskScore: {
        type: Number,
        default: 0,
      },

      recoveryProbability: {
        type: Number,
        default: 0,
      },

      recoveredAmount: {
        type: Number,
        default: 0,
      },

      detectedAt: {
        type: Date,
        default: Date.now,
      },

      recoveredAt: {
        type: Date,
        default: null,
      },

      sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "RevenueOpportunity",
  revenueOpportunitySchema
);