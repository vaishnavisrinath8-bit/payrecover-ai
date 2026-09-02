const express = require("express");
const router = express.Router();

const Payment = require("../models/payment");
const Recovery = require("../models/Recovery");
const { analyzeFailure } = require("../services/recoveryEngine");

// ============================================================
// START CHECKOUT
// POST /api/checkout/start
// ============================================================

router.post("/start", async (req, res) => {
  try {
    const {
      sessionId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      currency = "INR",
    } = req.body;

    if (
      !sessionId ||
      !customerName ||
      !customerEmail ||
      !amount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "sessionId, customerName, customerEmail and amount are required",
      });
    }

    // --------------------------------------------------------
    // Prevent duplicate checkout sessions
    // --------------------------------------------------------

    const existingPayment = await Payment.findOne({
      razorpayOrderId: sessionId,
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Checkout session already exists",
        data: existingPayment,
      });
    }

    // --------------------------------------------------------
    // Create checkout payment record
    // --------------------------------------------------------

    const payment = await Payment.create({
      razorpayOrderId: sessionId,
      amount: Number(amount),
      currency: String(currency).toUpperCase(),

      customerName,
      customerEmail,
      customerPhone: customerPhone || null,

      paymentStatus: "created",

      failureReason: "Checkout started",
      failureCode: "CHECKOUT_STARTED",

      paymentMethod: null,

      recoveryStatus: "not_started",
    });

    return res.status(201).json({
      success: true,
      message: "Checkout session started",
      data: {
        sessionId,
        paymentId: payment._id,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.paymentStatus,
      },
    });
  } catch (error) {
    console.error(
      "Start checkout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to start checkout",
      error: error.message,
    });
  }
});


// ============================================================
// ABANDON CHECKOUT
// POST /api/checkout/abandon
// ============================================================

router.post("/abandon", async (req, res) => {
  try {
    const {
      sessionId,
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
      });
    }

    // --------------------------------------------------------
    // Find checkout session
    // --------------------------------------------------------

    const payment = await Payment.findOne({
      razorpayOrderId: sessionId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Checkout session not found",
      });
    }

    // --------------------------------------------------------
    // Mark payment as failed/abandoned
    // --------------------------------------------------------

    payment.paymentStatus = "failed";

    payment.failureReason =
      "Customer abandoned checkout";

    payment.failureCode =
      "CHECKOUT_ABANDONED";

    payment.recoveryStatus =
      "in_progress";

    // --------------------------------------------------------
    // AI ANALYSIS
    // --------------------------------------------------------

    const analysis = analyzeFailure(
      payment.toObject(),
      {
        recoveryType:
          "checkout_abandonment",

        attemptCount: 0,

        maxAttempts: 3,

        contactAllowed: true,
      }
    );

    // --------------------------------------------------------
    // Save AI recommendation to Payment
    // --------------------------------------------------------

    payment.aiRecommendation = {
      action: analysis.action,

      reason: analysis.reason,

      message: null,
    };

    payment.recoveryPriority =
      analysis.priority;

    await payment.save();

    // --------------------------------------------------------
    // Prevent duplicate recovery
    // --------------------------------------------------------

    let recovery =
      await Recovery.findOne({
        paymentId: payment._id,
      });

    if (!recovery) {
      recovery = await Recovery.create({
        paymentId: payment._id,

        customerName:
          payment.customerName,

        customerEmail:
          payment.customerEmail,

        customerPhone:
          payment.customerPhone,

        amount:
          payment.amount,

        currency:
          payment.currency,

        recoveryType:
          "checkout_abandonment",

        status:
          analysis.action ===
          "stop_recovery"
            ? "stopped"
            : "pending",

        failureReason:
          payment.failureReason,

        failureCategory:
          analysis.failureCategory,

        rootCause:
          analysis.rootCause,

        aiScore:
          analysis.aiScore,

        recoveryProbability:
          analysis.recoveryProbability,

        recommendedAction:
          analysis.action,

        currentStep: 0,

        maxAttempts: 3,

        attemptCount: 0,

        escalationLevel:
          analysis.escalationLevel,

        contactAllowed: true,

        stoppingReason:
          analysis.stoppingReason,

        messageLanguage:
          "english",

        metadata: {
          source:
            "checkout_abandonment",

          sessionId,

          auditTrail: [
            {
              action:
                "Checkout abandoned",

              reason:
                "Customer started checkout but did not complete payment.",

              timestamp:
                new Date(),
            },

            {
              action:
                "AI recovery analysis",

              reason:
                analysis.reason,

              timestamp:
                new Date(),
            },
          ],
        },
      });
    }

    return res.status(201).json({
      success: true,

      message:
        "Checkout abandonment detected and recovery created",

      data: {
        paymentId:
          payment._id,

        recoveryId:
          recovery._id,

        recoveryType:
          recovery.recoveryType,

        status:
          recovery.status,

        failureCategory:
          recovery.failureCategory,

        rootCause:
          recovery.rootCause,

        aiScore:
          recovery.aiScore,

        recoveryProbability:
          recovery.recoveryProbability,

        recommendedAction:
          recovery.recommendedAction,

        priority:
          payment.recoveryPriority,
      },
    });
  } catch (error) {
    console.error(
      "Abandon checkout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process checkout abandonment",
      error: error.message,
    });
  }
});


// ============================================================
// GET CHECKOUT SESSION
// GET /api/checkout/:sessionId
// ============================================================

router.get("/:sessionId", async (req, res) => {
  try {
    const payment =
      await Payment.findOne({
        razorpayOrderId:
          req.params.sessionId,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Checkout session not found",
      });
    }

    const recovery =
      await Recovery.findOne({
        paymentId: payment._id,
      });

    return res.status(200).json({
      success: true,

      data: {
        payment,

        recovery,
      },
    });
  } catch (error) {
    console.error(
      "Get checkout session error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch checkout session",
      error: error.message,
    });
  }
});
// ============================================================
// FAILED SUBSCRIPTION
// POST /api/checkout/subscription-failure
// ============================================================

router.post(
  "/subscription-failure",
  async (req, res) => {
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        amount,
        currency = "INR",
      } = req.body;

      if (
        !customerName ||
        !customerEmail ||
        !amount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "customerName, customerEmail and amount are required",
        });
      }

      const payment =
        await Payment.create({
          razorpayOrderId:
            `subscription_${Date.now()}`,

          amount: Number(amount),

          currency:
            String(currency).toUpperCase(),

          customerName,

          customerEmail,

          customerPhone:
            customerPhone || null,

          paymentStatus: "failed",

          failureReason:
            "Subscription payment failed",

          failureCode:
            "SUBSCRIPTION_FAILURE",

          paymentMethod:
            "subscription",

          recoveryStatus:
            "in_progress",
        });

      const analysis =
        analyzeFailure(
          payment.toObject(),
          {
            recoveryType:
              "failed_subscription",

            attemptCount: 0,

            maxAttempts: 3,

            contactAllowed: true,
          }
        );

      payment.aiRecommendation = {
        action:
          analysis.action,

        reason:
          analysis.reason,

        message: null,
      };

      payment.recoveryPriority =
        analysis.priority;

      await payment.save();

      const recovery =
        await Recovery.create({
          paymentId:
            payment._id,

          customerName:
            payment.customerName,

          customerEmail:
            payment.customerEmail,

          customerPhone:
            payment.customerPhone,

          amount:
            payment.amount,

          currency:
            payment.currency,

          recoveryType:
            "failed_subscription",

          status:
            analysis.action ===
            "stop_recovery"
              ? "stopped"
              : "pending",

          failureReason:
            payment.failureReason,

          failureCategory:
            analysis.failureCategory,

          rootCause:
            analysis.rootCause,

          aiScore:
            analysis.aiScore,

          recoveryProbability:
            analysis.recoveryProbability,

          recommendedAction:
            analysis.action,

          currentStep: 0,

          maxAttempts: 3,

          attemptCount: 0,

          escalationLevel:
            analysis.escalationLevel,

          contactAllowed: true,

          stoppingReason:
            analysis.stoppingReason,

          messageLanguage:
            "english",

          metadata: {
            source:
              "failed_subscription",

            auditTrail: [
              {
                action:
                  "Subscription payment failed",

                reason:
                  "Recurring subscription payment could not be completed.",

                timestamp:
                  new Date(),
              },

              {
                action:
                  "AI recovery analysis",

                reason:
                  analysis.reason,

                timestamp:
                  new Date(),
              },
            ],
          },
        });

      return res.status(201).json({
        success: true,

        message:
          "Failed subscription recovery created",

        data: {
          paymentId:
            payment._id,

          recoveryId:
            recovery._id,

          recoveryType:
            recovery.recoveryType,

          status:
            recovery.status,

          failureCategory:
            recovery.failureCategory,

          rootCause:
            recovery.rootCause,

          aiScore:
            recovery.aiScore,

          recoveryProbability:
            recovery.recoveryProbability,

          recommendedAction:
            recovery.recommendedAction,

          priority:
            payment.recoveryPriority,
        },
      });
    } catch (error) {
      console.error(
        "Subscription failure error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to create subscription recovery",

        error:
          error.message,
      });
    }
  }
);

// ============================================================
// B2B OVERDUE RECEIVABLE
// POST /api/checkout/b2b-receivable
// ============================================================

router.post(
  "/b2b-receivable",
  async (req, res) => {
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        amount,
        currency = "INR",
        daysOverdue = 0,
      } = req.body;

      if (
        !customerName ||
        !customerEmail ||
        !amount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "customerName, customerEmail and amount are required",
        });
      }

      const payment =
        await Payment.create({
          razorpayOrderId:
            `b2b_${Date.now()}`,

          amount: Number(amount),

          currency:
            String(currency).toUpperCase(),

          customerName,

          customerEmail,

          customerPhone:
            customerPhone || null,

          paymentStatus: "failed",

          failureReason:
            `Invoice overdue by ${Number(daysOverdue) || 0} days`,

          failureCode:
            "INVOICE_OVERDUE",

          paymentMethod:
            "invoice",

          recoveryStatus:
            "in_progress",
        });

      const analysis =
        analyzeFailure(
          payment.toObject(),
          {
            recoveryType:
              "b2b_receivable",

            attemptCount: 0,

            maxAttempts: 3,

            contactAllowed: true,

            daysOverdue:
              Number(daysOverdue) || 0,
          }
        );

      payment.aiRecommendation = {
        action:
          analysis.action,

        reason:
          analysis.reason,

        message: null,
      };

      payment.recoveryPriority =
        analysis.priority;

      await payment.save();

      const recovery =
        await Recovery.create({
          paymentId:
            payment._id,

          customerName:
            payment.customerName,

          customerEmail:
            payment.customerEmail,

          customerPhone:
            payment.customerPhone,

          amount:
            payment.amount,

          currency:
            payment.currency,

          recoveryType:
            "b2b_receivable",

          status:
            analysis.action ===
            "stop_recovery"
              ? "stopped"
              : "pending",

          failureReason:
            payment.failureReason,

          failureCategory:
            analysis.failureCategory,

          rootCause:
            analysis.rootCause,

          aiScore:
            analysis.aiScore,

          recoveryProbability:
            analysis.recoveryProbability,

          recommendedAction:
            analysis.action,

          currentStep: 0,

          maxAttempts: 3,

          attemptCount: 0,

          escalationLevel:
            analysis.escalationLevel,

          contactAllowed: true,

          stoppingReason:
            analysis.stoppingReason,

          messageLanguage:
            "english",

          metadata: {
            source:
              "b2b_receivable",

            daysOverdue:
              Number(daysOverdue) || 0,

            auditTrail: [
              {
                action:
                  "B2B receivable detected",

                reason:
                  `Invoice is overdue by ${Number(daysOverdue) || 0} days.`,

                timestamp:
                  new Date(),
              },

              {
                action:
                  "AI recovery analysis",

                reason:
                  analysis.reason,

                timestamp:
                  new Date(),
              },
            ],
          },
        });

      return res.status(201).json({
        success: true,

        message:
          "B2B overdue receivable recovery created",

        data: {
          paymentId:
            payment._id,

          recoveryId:
            recovery._id,

          recoveryType:
            recovery.recoveryType,

          status:
            recovery.status,

          failureCategory:
            recovery.failureCategory,

          rootCause:
            recovery.rootCause,

          aiScore:
            recovery.aiScore,

          recoveryProbability:
            recovery.recoveryProbability,

          recommendedAction:
            recovery.recommendedAction,

          priority:
            payment.recoveryPriority,

          daysOverdue:
            Number(daysOverdue) || 0,
        },
      });
    } catch (error) {
      console.error(
        "B2B receivable error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to create B2B receivable recovery",

        error:
          error.message,
      });
    }
  }
);

// POST /api/checkout/mandate-failure
router.post("/mandate-failure", async (req, res) => {
  try {
    const {
      sessionId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      currency = "INR",
    } = req.body;

    if (
      !sessionId ||
      !customerName ||
      !customerEmail ||
      !amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Required checkout details are missing",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Mandate failure recorded successfully",
      data: {
        sessionId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        amount: Number(amount),
        currency,
        recoveryType: "mandate_retry",
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Mandate failure error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to record mandate failure",
      error: error.message,
    });
  }
});
// ============================================================
// PROMISE TO PAY
// ============================================================

// POST /api/checkout/promise-to-pay

router.post("/promise-to-pay", async (req, res) => {
  try {
    const {
      sessionId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      promisedAmount,
      promisedDate,
      currency = "INR",
    } = req.body;

    if (
      !sessionId ||
      !customerName ||
      !customerEmail ||
      !amount ||
      !promisedAmount ||
      !promisedDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Required promise-to-pay details are missing",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promise to pay recorded successfully",

      data: {
        sessionId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,

        amount: Number(amount),

        currency,

        recoveryType: "promise_to_pay",

        status: "promised",

        promiseToPay: {
          promised: true,
          promisedAmount: Number(promisedAmount),
          promisedDate: new Date(promisedDate),
          fulfilled: false,
        },
      },
    });
  } catch (error) {
    console.error("Promise to pay error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to record promise to pay",
      error: error.message,
    });
  }
});

module.exports = router;
