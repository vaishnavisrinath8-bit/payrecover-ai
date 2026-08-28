const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["created", "pending", "success", "failed"],
      default: "created",
    },
    failureReason: {
      type: String,
      default: null,
    },
    failureCode: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    recoveryStatus: {
      type: String,
      enum: ["not_started", "in_progress", "recovered", "unrecoverable"],
      default: "not_started",
    },
    aiRecommendation: {
      action: { type: String, default: null },
      reason: { type: String, default: null },
      message: { type: String, default: null },
    },
    recoveryPriority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", null],
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);