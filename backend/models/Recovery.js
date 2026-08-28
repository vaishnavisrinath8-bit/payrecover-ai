const mongoose = require("mongoose");

const recoverySchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },

    customerEmail: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "email_sent",
        "recovered",
        "failed",
      ],
      default: "created",
    },

    recoveryMessage: {
      type: String,
      default: null,
    },

    paymentLink: {
      type: String,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recovery", recoverySchema);