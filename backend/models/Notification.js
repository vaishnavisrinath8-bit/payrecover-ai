const mongoose = require("mongoose");

// ============================================================
// PAYRECOVER AI - NOTIFICATION MODEL
// ============================================================

const NotificationSchema = new mongoose.Schema(
  {
    // ==========================================================
    // BASIC INFORMATION
    // ==========================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================================
    // NOTIFICATION TYPE
    // ==========================================================

    type: {
      type: String,
      enum: [
        "payment_failure",
        "recovery_started",
        "recovery_reminder",
        "recovery_success",
        "recovery_failed",
        "high_priority",
        "system",
      ],
      default: "system",
      index: true,
    },

    // ==========================================================
    // PRIORITY
    // ==========================================================

    priority: {
      type: String,
      enum: [
        "CRITICAL",
        "HIGH",
        "MEDIUM",
        "LOW",
      ],
      default: "MEDIUM",
      index: true,
    },

    // ==========================================================
    // READ STATUS
    // ==========================================================

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // ==========================================================
    // RECOVERY REFERENCE
    // ==========================================================

    recovery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recovery",
      default: null,
    },

    recoveryId: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================================
    // PAYMENT REFERENCE
    // ==========================================================

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    paymentId: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================================
    // CUSTOMER
    // ==========================================================

    customerName: {
      type: String,
      default: "",
      trim: true,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // ==========================================================
    // COMMUNICATION INFORMATION
    // ==========================================================

    channel: {
      type: String,
      enum: [
        "email",
        "sms",
        "whatsapp",
        "phone",
        "system",
      ],
      default: "system",
    },

    communicationStatus: {
      type: String,
      enum: [
        "pending",
        "queued",
        "sent",
        "delivered",
        "failed",
        "read",
      ],
      default: "pending",
    },

    // ==========================================================
    // ACTION
    // ==========================================================

    action: {
      type: String,
      default: "",
      trim: true,
    },

    actionRequired: {
      type: Boolean,
      default: false,
    },

    actionUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================================
    // METADATA
    // ==========================================================

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ==========================================================
    // EXPIRATION
    // ==========================================================

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

NotificationSchema.index({
  createdAt: -1,
});

NotificationSchema.index({
  read: 1,
  createdAt: -1,
});

NotificationSchema.index({
  type: 1,
  createdAt: -1,
});

NotificationSchema.index({
  priority: 1,
  read: 1,
});

NotificationSchema.index({
  recovery: 1,
});

NotificationSchema.index({
  payment: 1,
});

// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    NotificationSchema
  );