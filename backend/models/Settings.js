
const mongoose = require("mongoose");

// ============================================================
// PAYRECOVER AI - SETTINGS MODEL
// ============================================================

const SettingsSchema = new mongoose.Schema(
  {
    // ==========================================================
    // ACCOUNT
    // ==========================================================

    name: {
      type: String,
      default: "PayRecover Admin",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    company: {
      type: String,
      default: "PayRecover AI",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      default: "Administrator",
      trim: true,
    },

    // ==========================================================
    // RECOVERY SETTINGS
    // ==========================================================

    recovery: {
      autoRetry: {
        type: Boolean,
        default: true,
      },

      maxAttempts: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
      },

      defaultChannel: {
        type: String,
        enum: [
          "email",
          "sms",
          "whatsapp",
          "phone",
        ],
        default: "email",
      },

      escalationEnabled: {
        type: Boolean,
        default: true,
      },

      escalationAfterAttempts: {
        type: Number,
        default: 2,
        min: 1,
        max: 10,
      },
    },

    // ==========================================================
    // NOTIFICATIONS
    // ==========================================================

    notifications: {
      paymentFailureAlerts: {
        type: Boolean,
        default: true,
      },

      recoveryAlerts: {
        type: Boolean,
        default: true,
      },

      recoverySuccessAlerts: {
        type: Boolean,
        default: true,
      },

      dailyReport: {
        type: Boolean,
        default: true,
      },

      weeklyReport: {
        type: Boolean,
        default: true,
      },
    },

    // ==========================================================
    // COMPLIANCE
    // ==========================================================

    compliance: {
      contactAllowed: {
        type: Boolean,
        default: true,
      },

      honorCustomerStop: {
        type: Boolean,
        default: true,
      },

      maxContactAttempts: {
        type: Number,
        default: 3,
        min: 1,
        max: 20,
      },

      minimumContactIntervalHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 720,
      },

      requireConsent: {
        type: Boolean,
        default: true,
      },

      stopOnSuccessfulPayment: {
        type: Boolean,
        default: true,
      },
    },

    // ==========================================================
    // COMMUNICATION
    // ==========================================================

    communication: {
      emailEnabled: {
        type: Boolean,
        default: true,
      },

      smsEnabled: {
        type: Boolean,
        default: false,
      },

      whatsappEnabled: {
        type: Boolean,
        default: false,
      },

      phoneEnabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// SINGLE SETTINGS DOCUMENT
// ============================================================

SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create({});
  }

  return settings;
};

// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", SettingsSchema);

