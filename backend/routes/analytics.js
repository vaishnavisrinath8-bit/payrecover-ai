
const express = require("express");

const router = express.Router();

const Payment = require("../models/Payment");
const Recovery = require("../models/Recovery");

// ============================================================
// PAYRECOVER AI - ANALYTICS ROUTES
// ============================================================
// Provides:
// 1. Analytics overview
// 2. Revenue analytics
// 3. Recovery analytics
// 4. Failure analytics
// 5. Channel analytics
// 6. Trend analytics
// ============================================================


// ============================================================
// HELPER
// ============================================================

const safeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


const round = (value, decimals = 2) => {
  const factor = Math.pow(10, decimals);

  return Math.round(
    safeNumber(value) * factor
  ) / factor;
};


// ============================================================
// GET ANALYTICS OVERVIEW
// GET /api/analytics/overview
// ============================================================

router.get(
  "/overview",
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // PAYMENT COUNTS
      // --------------------------------------------------------

      const [
        totalPayments,
        successfulPayments,
        failedPayments,
        pendingPayments,
        refundedPayments,
        recoveryCount,
        recoveredCount,
        activeRecoveries,
        unrecoverableCount,
      ] = await Promise.all([
        Payment.countDocuments(),

        Payment.countDocuments({
          status: {
            $in: [
              "success",
              "successful",
              "paid",
              "completed",
            ],
          },
        }),

        Payment.countDocuments({
          status: {
            $in: [
              "failed",
              "failure",
            ],
          },
        }),

        Payment.countDocuments({
          status: {
            $in: [
              "pending",
              "processing",
            ],
          },
        }),

        Payment.countDocuments({
          status: {
            $in: [
              "refunded",
              "refund",
            ],
          },
        }),

        Recovery.countDocuments(),

        Recovery.countDocuments({
          status: "recovered",
        }),

        Recovery.countDocuments({
          status: {
            $in: [
              "pending",
              "queued",
              "processing",
              "in_progress",
              "retrying",
            ],
          },
        }),

        Recovery.countDocuments({
          status: {
            $in: [
              "unrecoverable",
              "closed",
            ],
          },
        }),
      ]);


      // --------------------------------------------------------
      // PAYMENT AMOUNTS
      // --------------------------------------------------------

      const paymentAmountAggregation =
        await Payment.aggregate([
          {
            $group: {
              _id: null,

              totalAmount: {
                $sum: {
                  $ifNull: [
                    "$amount",
                    0,
                  ],
                },
              },

              successfulAmount: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$status",
                        [
                          "success",
                          "successful",
                          "paid",
                          "completed",
                        ],
                      ],
                    },
                    {
                      $ifNull: [
                        "$amount",
                        0,
                      ],
                    },
                    0,
                  ],
                },
              },

              failedAmount: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$status",
                        [
                          "failed",
                          "failure",
                        ],
                      ],
                    },
                    {
                      $ifNull: [
                        "$amount",
                        0,
                      ],
                    },
                    0,
                  ],
                },
              },

              refundedAmount: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$status",
                        [
                          "refunded",
                          "refund",
                        ],
                      ],
                    },
                    {
                      $ifNull: [
                        "$amount",
                        0,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        ]);


      const paymentAmounts =
        paymentAmountAggregation[0] ||
        {};

      // --------------------------------------------------------
      // RECOVERY AMOUNTS
      // --------------------------------------------------------

      const recoveryAmountAggregation =
        await Recovery.aggregate([
          {
            $group: {
              _id: null,

              recoveryValue: {
                $sum: {
                  $ifNull: [
                    "$amount",
                    0,
                  ],
                },
              },

              recoveredAmount: {
                $sum: {
                  $ifNull: [
                    "$recoveredAmount",
                    0,
                  ],
                },
              },

              activeRiskAmount: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$status",
                        [
                          "pending",
                          "queued",
                          "processing",
                          "in_progress",
                          "retrying",
                        ],
                      ],
                    },
                    {
                      $ifNull: [
                        "$amount",
                        0,
                      ],
                    },
                    0,
                  ],
                },
              },

              averageAiScore: {
                $avg: "$aiScore",
              },

              averageRecoveryProbability: {
                $avg:
                  "$recoveryProbability",
              },

              averageConfidence: {
                $avg: "$confidence",
              },
            },
          },
        ]);


      const recoveryAmounts =
        recoveryAmountAggregation[0] ||
        {};


      // --------------------------------------------------------
      // CALCULATIONS
      // --------------------------------------------------------

      const totalAmount =
        safeNumber(
          paymentAmounts.totalAmount
        );

      const successfulAmount =
        safeNumber(
          paymentAmounts.successfulAmount
        );

      const failedAmount =
        safeNumber(
          paymentAmounts.failedAmount
        );

      const refundedAmount =
        safeNumber(
          paymentAmounts.refundedAmount
        );

      const recoveredAmount =
        safeNumber(
          recoveryAmounts.recoveredAmount
        );

      const activeRiskAmount =
        safeNumber(
          recoveryAmounts.activeRiskAmount
        );

      const recoveryValue =
        safeNumber(
          recoveryAmounts.recoveryValue
        );


      const paymentSuccessRate =
        totalPayments > 0
          ? round(
              (
                successfulPayments /
                totalPayments
              ) * 100
            )
          : 0;


      const paymentFailureRate =
        totalPayments > 0
          ? round(
              (
                failedPayments /
                totalPayments
              ) * 100
            )
          : 0;


      const recoveryRate =
        recoveryCount > 0
          ? round(
              (
                recoveredCount /
                recoveryCount
              ) * 100
            )
          : 0;


      const recoveryAmountRate =
        recoveryValue > 0
          ? round(
              (
                recoveredAmount /
                recoveryValue
              ) * 100
            )
          : 0;


      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      res.json({
        success: true,

        overview: {
          payments: {
            total:
              totalPayments,

            successful:
              successfulPayments,

            failed:
              failedPayments,

            pending:
              pendingPayments,

            refunded:
              refundedPayments,

            successRate:
              paymentSuccessRate,

            failureRate:
              paymentFailureRate,
          },

          revenue: {
            totalAmount:
              totalAmount,

            successfulAmount:
              successfulAmount,

            failedAmount:
              failedAmount,

            refundedAmount:
              refundedAmount,

            recoveredAmount:
              recoveredAmount,

            activeRiskAmount:
              activeRiskAmount,
          },

          recoveries: {
            total:
              recoveryCount,

            recovered:
              recoveredCount,

            active:
              activeRecoveries,

            unrecoverable:
              unrecoverableCount,

            recoveryRate:
              recoveryRate,

            recoveryAmountRate:
              recoveryAmountRate,

            recoveryValue:
              recoveryValue,
          },

          ai: {
            averageScore:
              round(
                recoveryAmounts.averageAiScore
              ),

            averageRecoveryProbability:
              round(
                recoveryAmounts
                  .averageRecoveryProbability
              ),

            averageConfidence:
              round(
                recoveryAmounts
                  .averageConfidence
              ),
          },
        },

        // Flat structure is included
        // for frontend compatibility.

        totalPayments,

        successfulPayments,

        failedPayments,

        pendingPayments,

        refundedPayments,

        totalAmount,

        successfulAmount,

        failedAmount,

        refundedAmount,

        recoveredAmount,

        activeRiskAmount,

        recoveryCount,

        recoveredCount,

        activeRecoveries,

        unrecoverableCount,

        paymentSuccessRate,

        paymentFailureRate,

        recoveryRate,

        recoveryAmountRate,

        averageAiScore:
          round(
            recoveryAmounts.averageAiScore
          ),

        averageRecoveryProbability:
          round(
            recoveryAmounts
              .averageRecoveryProbability
          ),

        averageConfidence:
          round(
            recoveryAmounts
              .averageConfidence
          ),
      });

    } catch (error) {
      console.error(
        "GET /analytics/overview error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to load analytics overview.",

        error:
          error.message,
      });
    }
  }
);


// ============================================================
// GET REVENUE ANALYTICS
// GET /api/analytics/revenue
// ============================================================

router.get(
  "/revenue",
  async (req, res) => {
    try {
      const revenue =
        await Payment.aggregate([
          {
            $group: {
              _id: "$status",

              count: {
                $sum: 1,
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$amount",
                    0,
                  ],
                },
              },
            },
          },

          {
            $sort: {
              amount: -1,
            },
          },
        ]);


      res.json({
        success: true,
        revenue,
        data: revenue,
      });

    } catch (error) {
      console.error(
        "GET /analytics/revenue error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load revenue analytics.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// GET RECOVERY ANALYTICS
// GET /api/analytics/recovery
// ============================================================

router.get(
  "/recovery",
  async (req, res) => {
    try {
      const recovery =
        await Recovery.aggregate([
          {
            $group: {
              _id: "$status",

              count: {
                $sum: 1,
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$amount",
                    0,
                  ],
                },
              },

              recoveredAmount: {
                $sum: {
                  $ifNull: [
                    "$recoveredAmount",
                    0,
                  ],
                },
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },
        ]);


      res.json({
        success: true,
        recovery,
        data: recovery,
      });

    } catch (error) {
      console.error(
        "GET /analytics/recovery error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load recovery analytics.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// GET FAILURE ANALYTICS
// GET /api/analytics/failures
// ============================================================

router.get(
  "/failures",
  async (req, res) => {
    try {
      const failures =
        await Recovery.aggregate([
          {
            $group: {
              _id:
                "$failureCategory",

              count: {
                $sum: 1,
              },

              amount: {
                $sum: {
                  $ifNull: [
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
            },
          },

          {
            $sort: {
              count: -1,
            },
          },
        ]);


      res.json({
        success: true,
        failures,
        data: failures,
      });

    } catch (error) {
      console.error(
        "GET /analytics/failures error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load failure analytics.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// GET CHANNEL ANALYTICS
// GET /api/analytics/channels
// ============================================================

router.get(
  "/channels",
  async (req, res) => {
    try {
      const channels =
        await Recovery.aggregate([
          {
            $group: {
              _id: {
                $ifNull: [
                  "$lastCommunicationChannel",
                  "unknown",
                ],
              },

              count: {
                $sum: 1,
              },

              recovered: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "recovered",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              recoveredAmount: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "recovered",
                      ],
                    },
                    {
                      $ifNull: [
                        "$recoveredAmount",
                        0,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },

          {
            $sort: {
              recoveredAmount: -1,
            },
          },
        ]);


      res.json({
        success: true,
        channels,
        data: channels,
      });

    } catch (error) {
      console.error(
        "GET /analytics/channels error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load channel analytics.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// GET PRIORITY ANALYTICS
// GET /api/analytics/priorities
// ============================================================

router.get(
  "/priorities",
  async (req, res) => {
    try {
      const priorities =
        await Recovery.aggregate([
          {
            $group: {
              _id: "$priority",

              count: {
                $sum: 1,
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$amount",
                    0,
                  ],
                },
              },

              averageScore: {
                $avg: "$aiScore",
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },
        ]);


      res.json({
        success: true,
        priorities,
        data: priorities,
      });

    } catch (error) {
      console.error(
        "GET /analytics/priorities error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load priority analytics.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// GET RECOVERY TYPES
// GET /api/analytics/recovery-types
// ============================================================

router.get(
  "/recovery-types",
  async (req, res) => {
    try {
      const recoveryTypes =
        await Recovery.aggregate([
          {
            $group: {
              _id: "$recoveryType",

              count: {
                $sum: 1,
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$amount",
                    0,
                  ],
                },
              },

              recoveredAmount: {
                $sum: {
                  $ifNull: [
                    "$recoveredAmount",
                    0,
                  ],
                },
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },
        ]);


      res.json({
        success: true,
        recoveryTypes,
        data: recoveryTypes,
      });

    } catch (error) {
      console.error(
        "GET /analytics/recovery-types error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load recovery type analytics.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// GET DAILY TREND
// GET /api/analytics/trend
// ============================================================

router.get(
  "/trend",
  async (req, res) => {
    try {
      const days =
        Math.min(
          Math.max(
            Number(req.query.days) || 30,
            1
          ),
          365
        );


      const startDate =
        new Date();

      startDate.setDate(
        startDate.getDate() -
          days
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );


      const trend =
        await Recovery.aggregate([
          {
            $match: {
              createdAt: {
                $gte: startDate,
              },
            },
          },

          {
            $group: {
              _id: {
                $dateToString: {
                  format:
                    "%Y-%m-%d",

                  date:
                    "$createdAt",
                },
              },

              total: {
                $sum: 1,
              },

              recovered: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "recovered",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$amount",
                    0,
                  ],
                },
              },

              recoveredAmount: {
                $sum: {
                  $ifNull: [
                    "$recoveredAmount",
                    0,
                  ],
                },
              },
            },
          },

          {
            $sort: {
              _id: 1,
            },
          },
        ]);


      res.json({
        success: true,
        days,
        trend,
        data: trend,
      });

    } catch (error) {
      console.error(
        "GET /analytics/trend error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load analytics trend.",
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

