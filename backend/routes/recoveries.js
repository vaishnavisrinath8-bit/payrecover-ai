// ============================================================
// PayRecover AI - Recovery Routes
// ============================================================

const express = require("express");

const router = express.Router();

const Recovery = require("../models/Recovery");
const Payment = require("../models/Payment");

const {
  analyzeFailure,
  analyzeMultipleFailures,
  sortByRecoveryPriority,
} = require("../services/recoveryEngine");

// ============================================================
// HELPERS
// ============================================================

const normalizeRecovery = (recovery) => {
  if (!recovery) return null;

  const object =
    typeof recovery.toObject === "function"
      ? recovery.toObject()
      : recovery;

  return {
    ...object,

    id: String(object._id || object.id || ""),

    customerName:
      object.customerName || "Unknown Customer",

    customerEmail:
      object.customerEmail || "",

    amount: Number(object.amount) || 0,

    currency:
      object.currency || "INR",

    status:
      object.status || "pending",

    priority:
      object.priority || "MEDIUM",

    aiScore:
      Number(object.aiScore) || 0,

    recoveryProbability:
      Number(object.recoveryProbability) || 0,

    confidence:
      Number(object.confidence) || 0,

    failureCategory:
      object.failureCategory || "unknown",

    recommendedAction:
      object.recommendedAction ||
      object.action ||
      "send_email",

    recommendedChannel:
      object.recommendedChannel ||
      "email",

    explanation:
      object.explanation ||
      object.reason ||
      "",

    reason:
      object.reason ||
      object.explanation ||
      "",

    escalationLevel:
      Number(object.escalationLevel) || 0,

    attemptCount:
      Number(object.attemptCount) || 0,

    retryCount:
      Number(object.retryCount) || 0,

    maxAttempts:
      Number(object.maxAttempts) || 3,

    recoveredAmount:
      Number(object.recoveredAmount) || 0,

    daysOverdue:
      Number(object.daysOverdue) || 0,

    contactAttempts:
      Number(object.contactAttempts) || 0,
  };
};

// ============================================================
// BUILD AI FIELDS
// ============================================================

const applyAnalysisToRecovery = (
  recovery,
  analysis
) => {
  recovery.aiScore =
    Number(analysis.aiScore) || 0;

  recovery.recoveryProbability =
    Number(
      analysis.recoveryProbability
    ) || 0;

  recovery.confidence =
    Number(analysis.confidence) || 0;

  recovery.priority =
    analysis.priority || "MEDIUM";

  recovery.failureCategory =
    analysis.failureCategory || "unknown";

  recovery.rootCause =
    analysis.rootCause || "";

  recovery.action =
    analysis.action || "send_email";

  recovery.recommendedAction =
    analysis.recommendedAction ||
    analysis.action ||
    "send_email";

  recovery.recommendedChannel =
    analysis.recommendedChannel ||
    "email";

  recovery.reason =
    analysis.reason ||
    analysis.rootCause ||
    "";

  recovery.explanation =
    analysis.explanation ||
    analysis.reason ||
    "";

  recovery.escalationLevel =
    Number(
      analysis.escalationLevel
    ) || 0;

  recovery.stoppingReason =
    analysis.stoppingReason || null;

  if (analysis.ai) {
    recovery.ai = analysis.ai;
  }

  if (analysis.safety) {
    recovery.safety =
      analysis.safety;
  }

  return recovery;
};

// ============================================================
// GET ALL RECOVERIES
// ============================================================

router.get("/", async (req, res) => {
  try {
    const {
      status,
      priority,
      search,
      failureCategory,
      recoveryType,
      paymentMethod,
      minAmount,
      maxAmount,
      minAiScore,
      maxAiScore,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status =
        String(status).toLowerCase();
    }

    if (priority) {
      filter.priority =
        String(priority).toUpperCase();
    }

    if (failureCategory) {
      filter.failureCategory =
        String(
          failureCategory
        ).toLowerCase();
    }

    if (recoveryType) {
      filter.recoveryType =
        String(recoveryType);
    }

    if (paymentMethod) {
      filter.paymentMethod =
        String(paymentMethod);
    }

    if (
      minAmount !== undefined ||
      maxAmount !== undefined
    ) {
      filter.amount = {};

      if (minAmount !== undefined) {
        filter.amount.$gte =
          Number(minAmount) || 0;
      }

      if (maxAmount !== undefined) {
        filter.amount.$lte =
          Number(maxAmount) || 0;
      }
    }

    if (
      minAiScore !== undefined ||
      maxAiScore !== undefined
    ) {
      filter.aiScore = {};

      if (minAiScore !== undefined) {
        filter.aiScore.$gte =
          Number(minAiScore) || 0;
      }

      if (maxAiScore !== undefined) {
        filter.aiScore.$lte =
          Number(maxAiScore) || 100;
      }
    }

    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    if (search) {
      const safeSearch =
        String(search).replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const searchRegex =
        new RegExp(
          safeSearch,
          "i"
        );

      filter.$or = [
        {
          customerName:
            searchRegex,
        },
        {
          customerEmail:
            searchRegex,
        },
        {
          paymentId:
            searchRegex,
        },
        {
          failureReason:
            searchRegex,
        },
        {
          failureCategory:
            searchRegex,
        },
      ];
    }

    const pageNumber =
      Math.max(
        Number(page) || 1,
        1
      );

    const pageLimit =
      Math.min(
        Math.max(
          Number(limit) || 100,
          1
        ),
        500
      );

    const skip =
      (pageNumber - 1) *
      pageLimit;

    const [
      recoveries,
      total,
    ] = await Promise.all([
      Recovery.find(filter)
        .sort({
          priority: 1,
          aiScore: -1,
          recoveryProbability: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      Recovery.countDocuments(
        filter
      ),
    ]);

    const normalized =
      recoveries.map(
        normalizeRecovery
      );

    res.json({
      success: true,

      count:
        normalized.length,

      total,

      page:
        pageNumber,

      limit:
        pageLimit,

      pages:
        Math.ceil(
          total / pageLimit
        ),

      recoveries:
        normalized,

      data:
        normalized,
    });
  } catch (error) {
    console.error(
      "GET /recoveries error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load recoveries.",
      error:
        error.message,
    });
  }
});

// ============================================================
// GET RECOVERY QUEUE
// ============================================================

router.get(
  "/queue",
  async (req, res) => {
    try {
      const recoveries =
        await Recovery.find({
          status: {
            $in: [
              "pending",
              "queued",
              "processing",
              "in_progress",
              "retrying",
            ],
          },
        })
          .sort({
            aiScore: -1,
            recoveryProbability: -1,
            priority: 1,
            createdAt: 1,
          })
          .limit(500)
          .lean();

      let sorted =
        recoveries;

      if (
        typeof sortByRecoveryPriority ===
        "function"
      ) {
        sorted =
          sortByRecoveryPriority(
            recoveries
          );
      }

      const normalized =
        sorted.map(
          normalizeRecovery
        );

      res.json({
        success: true,

        count:
          normalized.length,

        queue:
          normalized,

        recoveries:
          normalized,

        data:
          normalized,
      });
    } catch (error) {
      console.error(
        "GET /recoveries/queue error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load recovery queue.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// GET RECOVERY STATISTICS
// ============================================================

router.get(
  "/stats",
  async (req, res) => {
    try {
      const activeStatuses = [
        "pending",
        "queued",
        "processing",
        "in_progress",
        "retrying",
      ];

      const [
        total,
        pending,
        recovered,
        unrecoverable,
        highPriority,
        aggregation,
      ] = await Promise.all([
        Recovery.countDocuments(),

        Recovery.countDocuments({
          status: {
            $in: activeStatuses,
          },
        }),

        Recovery.countDocuments({
          status: "recovered",
        }),

        Recovery.countDocuments({
          status: {
            $in: [
              "unrecoverable",
              "closed",
            ],
          },
        }),

        Recovery.countDocuments({
          priority: {
            $in: [
              "HIGH",
              "CRITICAL",
            ],
          },
          status: {
            $nin: [
              "recovered",
              "closed",
              "unrecoverable",
            ],
          },
        }),

        Recovery.aggregate([
          {
            $group: {
              _id: null,

              totalAmount: {
                $sum: "$amount",
              },

              recoveredAmount: {
                $sum:
                  "$recoveredAmount",
              },

              riskAmount: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$status",
                        activeStatuses,
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },

              averageAiScore: {
                $avg: "$aiScore",
              },

              averageProbability: {
                $avg:
                  "$recoveryProbability",
              },

              averageConfidence: {
                $avg:
                  "$confidence",
              },
            },
          },
        ]),
      ]);

      const values =
        aggregation[0] || {};

      const recoveryRate =
        total > 0
          ? Math.round(
              (recovered / total) *
                100
            )
          : 0;

      res.json({
        success: true,

        stats: {
          total,

          pending,

          active:
            pending,

          recovered,

          unrecoverable,

          highPriority,

          totalAmount:
            Number(
              values.totalAmount
            ) || 0,

          recoveredAmount:
            Number(
              values.recoveredAmount
            ) || 0,

          riskAmount:
            Number(
              values.riskAmount
            ) || 0,

          averageAiScore:
            Math.round(
              Number(
                values.averageAiScore
              ) || 0
            ),

          averageRecoveryProbability:
            Math.round(
              Number(
                values.averageProbability
              ) || 0
            ),

          averageConfidence:
            Math.round(
              Number(
                values.averageConfidence
              ) || 0
            ),

          recoveryRate,
        },
      });
    } catch (error) {
      console.error(
        "GET /recoveries/stats error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load recovery statistics.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// GET SINGLE RECOVERY
// ============================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const recovery =
        await Recovery.findById(
          req.params.id
        ).lean();

      if (!recovery) {
        return res.status(404).json({
          success: false,
          message:
            "Recovery not found.",
        });
      }

      const result =
        normalizeRecovery(
          recovery
        );

      res.json({
        success: true,

        recovery: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "GET /recoveries/:id error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load recovery.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// CREATE RECOVERY
// ============================================================

router.post(
  "/",
  async (req, res) => {
    try {
      const body =
        req.body || {};

      const {
        paymentId,
        payment,

        customerName,
        customerEmail,
        customerPhone,
        customerChannel,
        customerPreferredChannel,

        amount,
        currency,
        paymentMethod,
        paymentStatus,

        failureReason,
        failureCode,

        recoveryType =
          "payment_failure",

        retryCount = 0,
        attemptCount = 0,
        maxAttempts = 3,

        customerRequestedStop =
          false,

        contactAllowed =
          true,

        daysOverdue = 0,

        previousSuccessfulPayments =
          0,

        previousFailedPayments =
          0,

        customerLifetimeValue =
          0,
      } = body;

      // --------------------------------------------------------
      // PAYMENT LOOKUP
      // --------------------------------------------------------

      let paymentDocument =
        null;

      let resolvedPaymentId =
        paymentId || "";

      let resolvedCustomerName =
        customerName ||
        "Unknown Customer";

      let resolvedCustomerEmail =
        customerEmail ||
        "";

      let resolvedAmount =
        Number(amount) || 0;

      let resolvedCurrency =
        currency || "INR";

      let resolvedPaymentMethod =
        paymentMethod || "";

      let resolvedPaymentStatus =
        paymentStatus || "failed";

      let resolvedFailureReason =
        failureReason || "";

      let resolvedFailureCode =
        failureCode || "";

      if (payment) {
        try {
          paymentDocument =
            await Payment.findById(
              payment
            ).lean();
        } catch {
          paymentDocument =
            null;
        }
      }

      if (
        !paymentDocument &&
        paymentId
      ) {
        try {
          paymentDocument =
            await Payment.findOne({
              $or: [
                {
                  paymentId:
                    paymentId,
                },
              ],
            }).lean();
        } catch {
          paymentDocument =
            null;
        }
      }

      // --------------------------------------------------------
      // MERGE PAYMENT INFORMATION
      // --------------------------------------------------------

      if (paymentDocument) {
        resolvedPaymentId =
          resolvedPaymentId ||
          paymentDocument.paymentId ||
          paymentDocument._id;

        resolvedCustomerName =
          resolvedCustomerName !==
          "Unknown Customer"
            ? resolvedCustomerName
            : paymentDocument.customerName ||
              paymentDocument.customer?.name ||
              "Unknown Customer";

        resolvedCustomerEmail =
          resolvedCustomerEmail ||
          paymentDocument.customerEmail ||
          paymentDocument.customer?.email ||
          "";

        resolvedAmount =
          resolvedAmount ||
          Number(
            paymentDocument.amount
          ) ||
          0;

        resolvedCurrency =
          resolvedCurrency ||
          paymentDocument.currency ||
          "INR";

        resolvedPaymentMethod =
          resolvedPaymentMethod ||
          paymentDocument.paymentMethod ||
          paymentDocument.method ||
          "";

        resolvedPaymentStatus =
          resolvedPaymentStatus ||
          paymentDocument.status ||
          "failed";

        resolvedFailureReason =
          resolvedFailureReason ||
          paymentDocument.failureReason ||
          paymentDocument.reason ||
          "";

        resolvedFailureCode =
          resolvedFailureCode ||
          paymentDocument.failureCode ||
          "";
      }

      // --------------------------------------------------------
      // AI ANALYSIS
      // --------------------------------------------------------

      const analysis =
        analyzeFailure(
          {
            failureReason:
              resolvedFailureReason,

            failureCode:
              resolvedFailureCode,

            paymentMethod:
              resolvedPaymentMethod,

            retryCount:
              Number(retryCount) || 0,

            amount:
              resolvedAmount,

            paymentStatus:
              resolvedPaymentStatus,
          },
          {
            recoveryType,

            attemptCount:
              Number(
                attemptCount
              ) || 0,

            maxAttempts:
              Number(
                maxAttempts
              ) || 3,

            customerRequestedStop,

            contactAllowed,

            daysOverdue:
              Number(
                daysOverdue
              ) || 0,
          }
        );

      // --------------------------------------------------------
      // STATUS
      // --------------------------------------------------------

      let initialStatus =
        "pending";

      if (
        analysis.action ===
        "stop_recovery"
      ) {
        initialStatus =
          "closed";
      }

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      const recovery =
        new Recovery({
          payment:
            paymentDocument?._id ||
            payment ||
            null,

          paymentId:
            resolvedPaymentId
              ? String(
                  resolvedPaymentId
                )
              : "",

          customerName:
            resolvedCustomerName,

          customerEmail:
            resolvedCustomerEmail,

          customerPhone:
            customerPhone || "",

          customerChannel:
            customerChannel || "",

          customerPreferredChannel:
            customerPreferredChannel ||
            "",

          amount:
            resolvedAmount,

          currency:
            resolvedCurrency,

          paymentMethod:
            resolvedPaymentMethod,

          paymentStatus:
            resolvedPaymentStatus,

          failureReason:
            resolvedFailureReason,

          failureCode:
            resolvedFailureCode,

          failureCategory:
            analysis.failureCategory,

          rootCause:
            analysis.rootCause,

          recoveryType,

          status:
            initialStatus,

          attemptCount:
            Number(
              attemptCount
            ) || 0,

          retryCount:
            Number(
              retryCount
            ) || 0,

          maxAttempts:
            Number(
              maxAttempts
            ) || 3,

          aiScore:
            analysis.aiScore,

          recoveryProbability:
            analysis.recoveryProbability,

          confidence:
            analysis.confidence,

          priority:
            analysis.priority,

          recommendedAction:
            analysis.recommendedAction ||
            analysis.action,

          recommendedChannel:
            analysis.recommendedChannel ||
            "email",

          action:
            analysis.action,

          reason:
            analysis.reason,

          explanation:
            analysis.explanation ||
            analysis.reason,

          escalationLevel:
            analysis.escalationLevel,

          stoppingReason:
            analysis.stoppingReason,

          customerRequestedStop,

          contactAllowed,

          daysOverdue:
            Number(
              daysOverdue
            ) || 0,

          previousSuccessfulPayments:
            Number(
              previousSuccessfulPayments
            ) || 0,

          previousFailedPayments:
            Number(
              previousFailedPayments
            ) || 0,

          customerLifetimeValue:
            Number(
              customerLifetimeValue
            ) || 0,

          ai:
            analysis.ai || {
              score:
                analysis.aiScore,
              recoveryProbability:
                analysis.recoveryProbability,
              confidence:
                analysis.confidence || 0,
              priority:
                analysis.priority,
              failureCategory:
                analysis.failureCategory,
              recommendedAction:
                analysis.action,
              recommendedChannel:
                "email",
              escalationLevel:
                analysis.escalationLevel,
              explanation:
                analysis.reason ||
                analysis.rootCause,
              stoppingReason:
                analysis.stoppingReason,
              modelType:
                "bounded-rule-based",
              version:
                "2.0.0",
            },

          safety:
            analysis.safety || {
              contactAllowed,
              customerRequestedStop,
              maxAttempts:
                Number(
                  maxAttempts
                ) || 3,
              currentAttempts:
                Number(
                  attemptCount
                ) || 0,
              recoveryStopped:
                analysis.action ===
                "stop_recovery",
            },

          metadata: {
            createdBy:
              "recovery-engine",

            engineVersion:
              "2.0.0",

            generatedAt:
              new Date(),
          },
        });

      await recovery.save();

      const result =
        normalizeRecovery(
          recovery
        );

      res.status(201).json({
        success: true,

        message:
          "Recovery created successfully.",

        recovery: result,

        data: result,

        aiAnalysis:
          analysis,
      });
    } catch (error) {
      console.error(
        "POST /recoveries error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create recovery.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// UPDATE RECOVERY
// ============================================================

router.put(
  "/:id",
  async (req, res) => {
    try {
      const recovery =
        await Recovery.findById(
          req.params.id
        );

      if (!recovery) {
        return res.status(404).json({
          success: false,
          message:
            "Recovery not found.",
        });
      }

      const allowedFields = [
        "status",
        "priority",
        "attemptCount",
        "retryCount",
        "maxAttempts",
        "recommendedAction",
        "recommendedChannel",
        "action",
        "escalationLevel",
        "lastAttemptAt",
        "nextAttemptAt",
        "lastContactedAt",
        "contactAttempts",
        "lastCommunicationChannel",
        "lastCommunicationStatus",
        "recoveredAmount",
        "metadata",
      ];

      allowedFields.forEach(
        (field) => {
          if (
            Object.prototype.hasOwnProperty.call(
              req.body,
              field
            )
          ) {
            recovery[field] =
              req.body[field];
          }
        }
      );

      if (
        recovery.status ===
        "recovered"
      ) {
        recovery.recoveredAt =
          recovery.recoveredAt ||
          new Date();

        recovery.recoveredAmount =
          Number(
            req.body.recoveredAmount
          ) ||
          recovery.amount;
      }

      if (
        [
          "closed",
          "unrecoverable",
        ].includes(
          recovery.status
        )
      ) {
        recovery.closedAt =
          recovery.closedAt ||
          new Date();
      }

      await recovery.save();

      const result =
        normalizeRecovery(
          recovery
        );

      res.json({
        success: true,

        message:
          "Recovery updated successfully.",

        recovery: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "PUT /recoveries/:id error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update recovery.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// MARK RECOVERED
// ============================================================

router.patch(
  "/:id/recovered",
  async (req, res) => {
    try {
      const recovery =
        await Recovery.findById(
          req.params.id
        );

      if (!recovery) {
        return res.status(404).json({
          success: false,
          message:
            "Recovery not found.",
        });
      }

      recovery.status =
        "recovered";

      recovery.recoveredAt =
        new Date();

      recovery.recoveredAmount =
        Number(
          req.body?.recoveredAmount
        ) ||
        recovery.amount;

      recovery.closedAt =
        null;

      await recovery.save();

      const result =
        normalizeRecovery(
          recovery
        );

      res.json({
        success: true,

        message:
          "Recovery marked as recovered.",

        recovery: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "Mark recovered error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark recovery as recovered.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// MARK UNRECOVERABLE
// ============================================================

router.patch(
  "/:id/unrecoverable",
  async (req, res) => {
    try {
      const recovery =
        await Recovery.findById(
          req.params.id
        );

      if (!recovery) {
        return res.status(404).json({
          success: false,
          message:
            "Recovery not found.",
        });
      }

      recovery.status =
        "unrecoverable";

      recovery.closedAt =
        new Date();

      recovery.stoppingReason =
        req.body?.reason ||
        "marked_unrecoverable";

      await recovery.save();

      const result =
        normalizeRecovery(
          recovery
        );

      res.json({
        success: true,

        message:
          "Recovery marked as unrecoverable.",

        recovery: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "Mark unrecoverable error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark recovery as unrecoverable.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// RETRY / RE-ANALYZE RECOVERY
// ============================================================

router.post(
  "/:id/retry",
  async (req, res) => {
    try {
      const recovery =
        await Recovery.findById(
          req.params.id
        );

      if (!recovery) {
        return res.status(404).json({
          success: false,
          message:
            "Recovery not found.",
        });
      }

      if (
        recovery.customerRequestedStop ||
        recovery.contactAllowed ===
          false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Recovery cannot continue because customer contact is not allowed.",
        });
      }

      if (
        recovery.attemptCount >=
        recovery.maxAttempts
      ) {
        recovery.status =
          "closed";

        recovery.stoppingReason =
          "maximum_attempts";

        recovery.closedAt =
          new Date();

        await recovery.save();

        return res.status(400).json({
          success: false,
          message:
            "Maximum recovery attempts have been reached.",

          recovery:
            normalizeRecovery(
              recovery
            ),
        });
      }

      recovery.attemptCount += 1;
      recovery.retryCount += 1;

      recovery.lastAttemptAt =
        new Date();

      recovery.status =
        "retrying";

      const analysis =
        analyzeFailure(
          {
            failureReason:
              recovery.failureReason,

            failureCode:
              recovery.failureCode,

            paymentMethod:
              recovery.paymentMethod,

            retryCount:
              recovery.retryCount,

            amount:
              recovery.amount,

            paymentStatus:
              recovery.paymentStatus,
          },
          {
            recoveryType:
              recovery.recoveryType,

            attemptCount:
              recovery.attemptCount,

            maxAttempts:
              recovery.maxAttempts,

            customerRequestedStop:
              recovery.customerRequestedStop,

            contactAllowed:
              recovery.contactAllowed,

            daysOverdue:
              recovery.daysOverdue,
          }
        );

      applyAnalysisToRecovery(
        recovery,
        analysis
      );

      if (
        analysis.action ===
        "stop_recovery"
      ) {
        recovery.status =
          "closed";

        recovery.closedAt =
          new Date();
      }

      await recovery.save();

      const result =
        normalizeRecovery(
          recovery
        );

      res.json({
        success: true,

        message:
          "Recovery re-analyzed successfully.",

        recovery: result,

        data: result,

        aiAnalysis:
          analysis,
      });
    } catch (error) {
      console.error(
        "Retry recovery error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retry recovery.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// SEND RECOVERY REMINDER
// ============================================================

router.post(
  "/:id/reminder",
  async (req, res) => {
    try {
      const recovery =
        await Recovery.findById(
          req.params.id
        );

      if (!recovery) {
        return res.status(404).json({
          success: false,
          message:
            "Recovery not found.",
        });
      }

      if (
        recovery.contactAllowed ===
        false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Customer contact is not allowed.",
        });
      }

      if (
        recovery.customerRequestedStop
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Recovery has been stopped by the customer.",
        });
      }

      if (
        recovery.status ===
        "recovered"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recovery is already completed.",
        });
      }

      if (
        recovery.status ===
        "unrecoverable"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recovery has already been marked unrecoverable.",
        });
      }

      const channel =
        req.body?.channel ||
        recovery.recommendedChannel ||
        "email";

      recovery.contactAttempts += 1;

      recovery.lastContactedAt =
        new Date();

      recovery.lastCommunicationChannel =
        channel;

      recovery.lastCommunicationStatus =
        "queued";

      if (
        recovery.status ===
        "pending"
      ) {
        recovery.status =
          "processing";
      }

      await recovery.save();

      const result =
        normalizeRecovery(
          recovery
        );

      res.json({
        success: true,

        message:
          "Recovery reminder queued successfully.",

        channel,

        recovery: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "Send reminder error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to send recovery reminder.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// STOP RECOVERY
// ============================================================

router.patch(
  "/:id/stop",
  async (req, res) => {
    try {
      const recovery =
        await Recovery.findById(
          req.params.id
        );

      if (!recovery) {
        return res.status(404).json({
          success: false,
          message:
            "Recovery not found.",
        });
      }

      recovery.customerRequestedStop =
        true;

      recovery.contactAllowed =
        false;

      recovery.status =
        "closed";

      recovery.stoppingReason =
        req.body?.reason ||
        "customer_requested_stop";

      recovery.closedAt =
        new Date();

      if (recovery.safety) {
        recovery.safety.contactAllowed =
          false;

        recovery.safety.customerRequestedStop =
          true;

        recovery.safety.recoveryStopped =
          true;
      }

      await recovery.save();

      const result =
        normalizeRecovery(
          recovery
        );

      res.json({
        success: true,

        message:
          "Recovery stopped successfully.",

        recovery: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "Stop recovery error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to stop recovery.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;