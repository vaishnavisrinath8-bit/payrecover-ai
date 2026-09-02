const CheckoutSession = require("../models/CheckoutSession");
const Recovery = require("../models/Recovery");
const RecoveryAudit = require("../models/RecoveryAudit");

const { analyzeFailure } = require("../services/recoveryEngine");


// ============================================================
// START CHECKOUT
// POST /api/checkout/start
// ============================================================

const startCheckout = async (req, res) => {
  try {
    const {
      sessionId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      currency = "INR",
    } = req.body;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (
      !sessionId ||
      !customerName ||
      !customerEmail ||
      amount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "sessionId, customerName, customerEmail and amount are required.",
      });
    }

    const numericAmount = Number(amount);

    if (
      Number.isNaN(numericAmount) ||
      numericAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number.",
      });
    }

    // ----------------------------------------------------------
    // CHECK EXISTING SESSION
    // ----------------------------------------------------------

    const existingSession =
      await CheckoutSession.findOne({
        sessionId,
      });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        message:
          "Checkout session already exists.",
        data: existingSession,
      });
    }

    // ----------------------------------------------------------
    // CREATE SESSION
    // ----------------------------------------------------------

    const session =
      await CheckoutSession.create({
        sessionId,

        customerName,

        customerEmail,

        customerPhone:
          customerPhone || null,

        amount:
          numericAmount,

        currency:
          String(currency).toUpperCase(),

        status:
          "started",

        startedAt:
          new Date(),

        lastActivityAt:
          new Date(),

        recoveryCreated:
          false,

        recoveryId:
          null,
      });

    return res.status(201).json({
      success: true,

      message:
        "Checkout session started successfully.",

      data: session,
    });
  } catch (error) {
    console.error(
      "Start checkout error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to start checkout session.",

      error:
        error.message,
    });
  }
};


// ============================================================
// ABANDON CHECKOUT
// POST /api/checkout/:sessionId/abandon
// ============================================================

const abandonCheckout = async (
  req,
  res
) => {
  try {
    const { sessionId } =
      req.params;

    // ----------------------------------------------------------
    // FIND SESSION
    // ----------------------------------------------------------

    const session =
      await CheckoutSession.findOne({
        sessionId,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Checkout session not found.",
      });
    }

    // ----------------------------------------------------------
    // ALREADY COMPLETED
    // ----------------------------------------------------------

    if (
      session.status ===
      "completed"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Checkout was already completed. It cannot be marked as abandoned.",
      });
    }

    // ----------------------------------------------------------
    // ALREADY ABANDONED
    // ----------------------------------------------------------

    if (
      session.status ===
      "abandoned"
    ) {
      const existingRecovery =
        session.recoveryId
          ? await Recovery.findById(
              session.recoveryId
            )
          : null;

      return res.status(200).json({
        success: true,

        message:
          "Checkout abandonment was already processed.",

        data: {
          checkoutSession:
            session,

          recovery:
            existingRecovery,
        },
      });
    }

    // ----------------------------------------------------------
    // MARK ABANDONED
    // ----------------------------------------------------------

    session.status =
      "abandoned";

    session.abandonedAt =
      new Date();

    session.lastActivityAt =
      new Date();

    await session.save();


    // ==========================================================
    // AI ANALYSIS
    // ==========================================================

    const analysis =
      analyzeFailure(
        {
          failureReason:
            "Customer abandoned checkout",

          failureCode:
            "CHECKOUT_ABANDONED",

          paymentMethod:
            "checkout",

          amount:
            session.amount,

          paymentStatus:
            "failed",
        },

        {
          recoveryType:
            "checkout_abandonment",

          attemptCount:
            0,

          maxAttempts:
            3,

          contactAllowed:
            true,
        }
      );


    // ==========================================================
    // CREATE RECOVERY
    // ==========================================================

    const recovery =
      await Recovery.create({
        // Checkout abandonment happens
        // before an actual payment exists.
        paymentId:
          null,

        customerName:
          session.customerName,

        customerEmail:
          session.customerEmail,

        customerPhone:
          session.customerPhone,

        amount:
          session.amount,

        currency:
          session.currency,

        recoveryType:
          "checkout_abandonment",

        status:
          analysis.action ===
          "stop_recovery"
            ? "stopped"
            : "pending",

        failureReason:
          "Customer abandoned checkout",

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

        currentStep:
          1,

        maxAttempts:
          3,

        attemptCount:
          0,

        escalationLevel:
          analysis.escalationLevel,

        stoppingReason:
          analysis.stoppingReason,

        contactAllowed:
          true,

        messageLanguage:
          "english",

        generatedMessage:
          null,

        metadata: {
          source:
            "checkout_abandonment",

          checkoutSessionId:
            session._id,

          checkoutSessionIdValue:
            session.sessionId,

          priority:
            analysis.priority,

          auditTrail: [
            {
              action:
                "checkout_abandonment_detected",

              reason:
                "Customer started checkout but did not complete payment.",

              timestamp:
                new Date(),
            },

            {
              action:
                "ai_recovery_decision",

              reason:
                analysis.rootCause,

              timestamp:
                new Date(),
            },
          ],
        },
      });


    // ==========================================================
    // LINK RECOVERY TO CHECKOUT
    // ==========================================================

    session.recoveryCreated =
      true;

    session.recoveryId =
      recovery._id;

    await session.save();


    // ==========================================================
    // AUDIT EVENT 1 — DETECTION
    // ==========================================================

    await RecoveryAudit.create({
      recoveryId:
        recovery._id,

      paymentId:
        null,

      action:
        "Checkout abandonment detected",

      actionType:
        "detection",

      status:
        "success",

      reason:
        "Customer started checkout but did not complete payment.",

      amount:
        session.amount,

      metadata: {
        sessionId:
          session.sessionId,

        customerEmail:
          session.customerEmail,
      },
    });


    // ==========================================================
    // AUDIT EVENT 2 — AI ANALYSIS
    // ==========================================================

    await RecoveryAudit.create({
      recoveryId:
        recovery._id,

      paymentId:
        null,

      action:
        "AI analyzed checkout abandonment",

      actionType:
        "analysis",

      status:
        "success",

      reason:
        analysis.rootCause,

      amount:
        session.amount,

      metadata: {
        failureCategory:
          analysis.failureCategory,

        recoveryProbability:
          analysis.recoveryProbability,

        aiScore:
          analysis.aiScore,
      },
    });


    // ==========================================================
    // AUDIT EVENT 3 — DECISION
    // ==========================================================

    await RecoveryAudit.create({
      recoveryId:
        recovery._id,

      paymentId:
        null,

      action:
        `AI selected ${analysis.action}`,

      actionType:
        "decision",

      status:
        "success",

      reason:
        "Recovery intervention selected based on checkout abandonment signals.",

      amount:
        session.amount,

      metadata: {
        action:
          analysis.action,

        priority:
          analysis.priority,

        aiScore:
          analysis.aiScore,

        recoveryProbability:
          analysis.recoveryProbability,

        escalationLevel:
          analysis.escalationLevel,
      },
    });


    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.status(201).json({
      success: true,

      message:
        "Checkout abandonment detected and recovery workflow created.",

      data: {
        checkoutSession:
          session,

        recovery:
          recovery,

        aiDecision: {
          action:
            analysis.action,

          priority:
            analysis.priority,

          aiScore:
            analysis.aiScore,

          recoveryProbability:
            analysis.recoveryProbability,

          failureCategory:
            analysis.failureCategory,

          rootCause:
            analysis.rootCause,

          escalationLevel:
            analysis.escalationLevel,

          stoppingReason:
            analysis.stoppingReason,
        },
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
        "Unable to process checkout abandonment.",

      error:
        error.message,
    });
  }
};


// ============================================================
// COMPLETE CHECKOUT
// POST /api/checkout/:sessionId/complete
// ============================================================

const completeCheckout =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const session =
        await CheckoutSession.findOne({
          sessionId,
        });

      if (!session) {
        return res.status(404).json({
          success: false,

          message:
            "Checkout session not found.",
        });
      }

      session.status =
        "completed";

      session.completedAt =
        new Date();

      session.lastActivityAt =
        new Date();

      await session.save();

      return res.status(200).json({
        success: true,

        message:
          "Checkout completed successfully.",

        data:
          session,
      });
    } catch (error) {
      console.error(
        "Complete checkout error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to complete checkout.",

        error:
          error.message,
      });
    }
  };


// ============================================================
// GET CHECKOUT SESSION
// GET /api/checkout/:sessionId
// ============================================================

const getCheckoutSession =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const session =
        await CheckoutSession.findOne({
          sessionId,
        }).populate(
          "recoveryId"
        );

      if (!session) {
        return res.status(404).json({
          success: false,

          message:
            "Checkout session not found.",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          session,
      });
    } catch (error) {
      console.error(
        "Get checkout session error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch checkout session.",

        error:
          error.message,
      });
    }
  };


module.exports = {
  startCheckout,
  abandonCheckout,
  completeCheckout,
  getCheckoutSession,
};