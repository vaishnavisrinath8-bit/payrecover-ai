
const mongoose = require("mongoose");

// ============================================================
// PAYRECOVER AI - RECOVERY RULE MODEL
// ============================================================
//
// Stores global compliance and stopping rules used by the
// recovery engine.
//
// These rules make the AI recovery workflow bounded,
// predictable, and auditable.
// ============================================================

const recoveryRuleSchema = new mongoose.Schema(
  {
    // ----------------------------------------------------------
    // Rule configuration
    // ----------------------------------------------------------

    maxPaymentRetries: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },

    maxReminders: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },

    reminderIntervalHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 168,
    },

    recoveryWindowDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 90,
    },

    // ----------------------------------------------------------
    // Automation controls
    // ----------------------------------------------------------

    autoStopOnRecovery: {
      type: Boolean,
      default: true,
    },

    autoStopOnRetryExhaustion: {
      type: Boolean,
      default: true,
    },

    autoStopOnWindowExpiry: {
      type: Boolean,
      default: true,
    },

    escalationEnabled: {
      type: Boolean,
      default: true,
    },

    // ----------------------------------------------------------
    // AI safety threshold
    // ----------------------------------------------------------

    minimumRecoveryProbability: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },

    minimumAIScore: {
      type: Number,
      default: 30,
      min: 0,
      max: 100,
    },

    // ----------------------------------------------------------
    // Duplicate contact protection
    // ----------------------------------------------------------

    preventDuplicateActions: {
      type: Boolean,
      default: true,
    },

    minimumContactIntervalHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 168,
    },

    // ----------------------------------------------------------
    // Compliance
    // ----------------------------------------------------------

    contactCustomersAutomatically: {
      type: Boolean,
      default: true,
    },

    allowEscalationToHuman: {
      type: Boolean,
      default: true,
    },

    // ----------------------------------------------------------
    // Audit
    // ----------------------------------------------------------

    updatedBy: {
      type: String,
      default: "system",
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);


// ============================================================
// INDEX
// ============================================================

recoveryRuleSchema.index({
  active: 1,
  updatedAt: -1,
});


// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.model(
    "RecoveryRule",
    recoveryRuleSchema
  );

