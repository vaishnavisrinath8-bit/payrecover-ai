// backend/models/Recovery.js

const mongoose = require("mongoose");

const RecoverySchema = new mongoose.Schema(
  {
    // Payment reference
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // Keep paymentId for compatibility with existing recovery routes/data
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // Customer
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

    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    customerChannel: {
      type: String,
      default: "email",
    },

    customerPreferredChannel: {
      type: String,
      default: "email",
    },

    // Payment information
    amount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      default: "failed",
    },

    // Failure information
    failureReason: {
      type: String,
      default: "",
    },

    failureCode: {
      type: String,
      default: "",
    },

    failureCategory: {
      type: String,
      default: "",
    },

    rootCause: {
      type: String,
      default: "",
    },

    // Recovery type
    recoveryType: {
      type: String,
      enum: [
        "payment_failure",
        "checkout_abandonment",
        "failed_subscription",
        "b2b_receivable",
        "mandate_retry",
        "promise_to_pay",
      ],
      default: "payment_failure",
    },

    // Recovery status
    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "queued",
        "processing",
        "in_progress",
        "retrying",
        "contacted",
        "promised",
        "recovered",
        "unrecoverable",
        "closed",
      ],
      default: "pending",
    },

    // Recovery attempts
    attemptCount: {
      type: Number,
      default: 0,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    maxAttempts: {
      type: Number,
      default: 3,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },

    nextAttemptAt: {
      type: Date,
      default: null,
    },

    nextActionAt: {
      type: Date,
      default: null,
    },

    // AI scoring
    aiScore: {
      type: Number,
      default: 0,
    },

    recoveryProbability: {
      type: Number,
      default: 0,
    },

    confidence: {
      type: Number,
      default: 0,
    },

    priority: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },

    // AI recommendation
    recommendedAction: {
      type: String,
      default: "",
    },

    recommendedChannel: {
      type: String,
      default: "email",
    },

    action: {
      type: String,
      default: "",
    },

    // AI explanation
    reason: {
      type: String,
      default: "",
    },

    explanation: {
      type: String,
      default: "",
    },

    // Recovery workflow
    currentStep: {
      type: String,
      default: "analysis",
    },

    escalationLevel: {
      type: Number,
      default: 0,
    },

    stoppingReason: {
      type: String,
      default: "",
    },

    customerRequestedStop: {
      type: Boolean,
      default: false,
    },

    contactAllowed: {
      type: Boolean,
      default: true,
    },

    daysOverdue: {
      type: Number,
      default: 0,
    },

    // Customer history
    previousSuccessfulPayments: {
      type: Number,
      default: 0,
    },

    previousFailedPayments: {
      type: Number,
      default: 0,
    },

    customerLifetimeValue: {
      type: Number,
      default: 0,
    },

    // AI details
    ai: {
      score: {
        type: Number,
        default: 0,
      },

      probability: {
        type: Number,
        default: 0,
      },

      confidence: {
        type: Number,
        default: 0,
      },

      priority: {
        type: String,
        default: "MEDIUM",
      },

      failureCategory: {
        type: String,
        default: "",
      },

      recommendedAction: {
        type: String,
        default: "",
      },

      recommendedChannel: {
        type: String,
        default: "",
      },

      escalationLevel: {
        type: Number,
        default: 0,
      },

      explanation: {
        type: String,
        default: "",
      },

      stoppingReason: {
        type: String,
        default: "",
      },

      modelType: {
        type: String,
        default: "PayRecover AI",
      },

      version: {
        type: String,
        default: "1.0",
      },
    },

    // Safety / compliance
    safety: {
      contactAllowed: {
        type: Boolean,
        default: true,
      },

      customerRequestedStop: {
        type: Boolean,
        default: false,
      },

      maxAttempts: {
        type: Number,
        default: 3,
      },

      currentAttempts: {
        type: Number,
        default: 0,
      },

      recoveryStopped: {
        type: Boolean,
        default: false,
      },
    },

    // Recovery result
    recoveredAmount: {
      type: Number,
      default: 0,
    },

    recoveredAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    // Communication
    lastContactedAt: {
      type: Date,
      default: null,
    },

    contactAttempts: {
      type: Number,
      default: 0,
    },

    lastCommunicationChannel: {
      type: String,
      default: "",
    },

    lastCommunicationStatus: {
      type: String,
      default: "",
    },

    // Recovery action execution
    lastAction: {
      type: String,
      default: "",
    },

    lastActionStatus: {
      type: String,
      default: "",
    },

    lastActionAt: {
      type: Date,
      default: null,
    },

    lastActionMessage: {
      type: String,
      default: "",
    },

    actionSuccessful: {
      type: Boolean,
      default: false,
    },

    // Recovery message
    recoveryMessage: {
      type: String,
      default: "",
    },

    generatedMessage: {
      type: String,
      default: "",
    },

    paymentLink: {
      type: String,
      default: "",
    },

    messageLanguage: {
      type: String,
      default: "English",
    },

    recoveryChannel: {
      type: String,
      default: "email",
    },

    // Promise to pay
    promiseToPay: {
      promised: {
        type: Boolean,
        default: false,
      },

      promiseDate: {
        type: Date,
        default: null,
      },

      amount: {
        type: Number,
        default: 0,
      },

      fulfilled: {
        type: Boolean,
        default: false,
      },
    },

    // Campaign
    campaignId: {
      type: String,
      default: "",
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Audit trail
    auditTrail: {
      type: [
        {
          action: {
            type: String,
            default: "",
          },

          status: {
            type: String,
            default: "",
          },

          message: {
            type: String,
            default: "",
          },

          timestamp: {
            type: Date,
            default: Date.now,
          },

          actor: {
            type: String,
            default: "system",
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RecoverySchema.index({ customerEmail: 1 });
RecoverySchema.index({ paymentId: 1 });
RecoverySchema.index({ payment: 1 });
RecoverySchema.index({ status: 1, priority: 1 });
RecoverySchema.index({ aiScore: -1 });
RecoverySchema.index({ recoveryProbability: -1 });
RecoverySchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.Recovery ||
  mongoose.model("Recovery", RecoverySchema);