const mongoose = require("mongoose");

// ============================================================
// PAYRECOVER AI - PAYMENT MODEL
// ============================================================

const paymentSchema = new mongoose.Schema(
{
// ==========================================================
// RAZORPAY REFERENCES
// ==========================================================


razorpayPaymentId: {
  type: String,
  default: null,
  trim: true,
},

razorpayOrderId: {
  type: String,
  default: null,
  trim: true,
},

// ==========================================================
// PAYMENT INFORMATION
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
  trim: true,
},

paymentMethod: {
  type: String,
  default: null,
  trim: true,
},

paymentStatus: {
  type: String,
  enum: [
    "created",
    "pending",
    "success",
    "failed",
  ],
  default: "created",
  index: true,
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
  trim: true,
  lowercase: true,
},

customerPhone: {
  type: String,
  default: null,
  trim: true,
},

// ==========================================================
// FAILURE INFORMATION
// ==========================================================

failureReason: {
  type: String,
  default: null,
  trim: true,
},

failureCode: {
  type: String,
  default: null,
  trim: true,
},

// ==========================================================
// RETRY / RECOVERY
// ==========================================================

retryCount: {
  type: Number,
  default: 0,
  min: 0,
},

recoveryStatus: {
  type: String,
  enum: [
    "not_started",
    "in_progress",
    "recovered",
    "unrecoverable",
  ],
  default: "not_started",
  index: true,
},

recoveryPriority: {
  type: String,
  enum: [
    "LOW",
    "MEDIUM",
    "HIGH",
    null,
  ],
  default: null,
  index: true,
},

// ==========================================================
// AI RECOMMENDATION
// ==========================================================

aiRecommendation: {
  action: {
    type: String,
    default: null,
    trim: true,
  },

  reason: {
    type: String,
    default: null,
    trim: true,
  },

  message: {
    type: String,
    default: null,
    trim: true,
  },
},

// ==========================================================
// METADATA
// ==========================================================

metadata: {
  type: mongoose.Schema.Types.Mixed,
  default: {},
},


},
{
timestamps: true,
}
);

// ============================================================
// INDEXES
// ============================================================

paymentSchema.index({
customerEmail: 1,
});

paymentSchema.index({
paymentStatus: 1,
createdAt: -1,
});

paymentSchema.index({
recoveryStatus: 1,
});

paymentSchema.index({
recoveryPriority: 1,
});

paymentSchema.index({
createdAt: -1,
});

// ============================================================
// EXPORT
// ============================================================

module.exports =
mongoose.models.Payment ||
mongoose.model(
"Payment",
paymentSchema
);
