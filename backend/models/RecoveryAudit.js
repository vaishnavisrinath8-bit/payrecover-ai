const mongoose = require("mongoose");

const recoveryAuditSchema = new mongoose.Schema(
  {
    recoveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recovery",
      required: true,
      index: true,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },

    event: {
      type: String,
      required: true,
      enum: [
        "recovery_created",
        "ai_strategy_selected",
        "retry_scheduled",
        "retry_initiated",
        "retry_success",
        "retry_failed",
        "reminder_sent",
        "payment_recovered",
        "recovery_failed",
        "recovery_unrecoverable",
        "manual_action",
        "status_changed",
      ],
      index: true,
    },

    action: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      default: null,
    },

    previousStatus: {
      type: String,
      default: null,
    },

    newStatus: {
      type: String,
      default: null,
    },

    strategy: {
      type: String,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    failureCode: {
      type: String,
      default: null,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    message: {
      type: String,
      required: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    performedBy: {
      type: String,
      default: "system",
      enum: [
        "system",
        "ai_engine",
        "admin",
        "customer",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

recoveryAuditSchema.index({
  recoveryId: 1,
  createdAt: -1,
});

recoveryAuditSchema.index({
  paymentId: 1,
  createdAt: -1,
});

recoveryAuditSchema.index({
  event: 1,
  createdAt: -1,
});

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model(
  "RecoveryAudit",
  recoveryAuditSchema
);