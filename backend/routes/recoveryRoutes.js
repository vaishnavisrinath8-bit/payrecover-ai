// backend/routes/recoveryRoutes.js

const express = require("express");
const router = express.Router();

const Recovery = require("../models/Recovery");
const Payment = require("../models/payment");

// ============================================================
// GET ALL RECOVERIES
// GET /api/recovery
// ============================================================

router.get("/", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [recoveries, total] = await Promise.all([
      Recovery.find(filter)
        .populate("paymentId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Recovery.countDocuments(filter),
    ]);

    const data = recoveries.map((recovery) => {
      const payment = recovery.paymentId || recovery.payment || null;

      return {
        ...recovery,

        paymentId:
          payment?._id?.toString?.() ||
          recovery.paymentId?.toString?.() ||
          null,

        payment: payment
          ? {
              _id: payment._id,
              razorpayPaymentId: payment.razorpayPaymentId,
              razorpayOrderId: payment.razorpayOrderId,
              amount: payment.amount,
              currency: payment.currency,
              paymentStatus: payment.paymentStatus,
              paymentMethod: payment.paymentMethod,
              failureReason: payment.failureReason,
              failureCode: payment.failureCode,
              customerName: payment.customerName,
              customerEmail: payment.customerEmail,
              customerPhone: payment.customerPhone,
              retryCount: payment.retryCount,
              recoveryStatus: payment.recoveryStatus,
              recoveryPriority: payment.recoveryPriority,
              createdAt: payment.createdAt,
              updatedAt: payment.updatedAt,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error("GET /api/recovery ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch recoveries.",
      error: error.message,
    });
  }
});

// ============================================================
// GET RECOVERY QUEUE
// GET /api/recovery/queue
// ============================================================

router.get("/queue", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const recoveries = await Recovery.find({
      status: {
        $in: [
          "created",
          "pending",
          "queued",
          "processing",
          "in_progress",
          "retrying",
          "contacted",
          "promised",
        ],
      },
    })
      .populate("paymentId")
      .sort({
        priority: 1,
        aiScore: -1,
        createdAt: -1,
      })
      .limit(limit)
      .lean();

    const data = recoveries.map((recovery) => {
      const payment = recovery.paymentId || recovery.payment || null;

      return {
        ...recovery,

        paymentId:
          payment?._id?.toString?.() ||
          recovery.paymentId?.toString?.() ||
          null,

        payment: payment || null,
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GET /api/recovery/queue ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch recovery queue.",
      error: error.message,
    });
  }
});

// ============================================================
// GET RECOVERY ANALYTICS
// GET /api/recovery/analytics
// ============================================================

router.get("/analytics", async (req, res) => {
  try {
    const recoveries = await Recovery.find({})
      .populate("paymentId")
      .lean();

    let totalAtRisk = 0;
    let recoveredAmount = 0;
    let activeAmount = 0;
    let unrecoverableAmount = 0;

    let totalRecoveries = recoveries.length;
    let recoveredCount = 0;
    let activeCount = 0;
    let unrecoverableCount = 0;

    const statusBreakdown = {};
    const priorityBreakdown = {};
    const channelBreakdown = {};
    const failureBreakdown = {};

    recoveries.forEach((recovery) => {
      const amount = Number(recovery.amount || 0);

      totalAtRisk += amount;

      const status = recovery.status || "pending";
      const priority = recovery.priority || "MEDIUM";
      const channel =
        recovery.recoveryChannel ||
        recovery.recommendedChannel ||
        "email";

      const failureCategory =
        recovery.failureCategory ||
        recovery.rootCause ||
        "Unknown";

      statusBreakdown[status] =
        (statusBreakdown[status] || 0) + 1;

      priorityBreakdown[priority] =
        (priorityBreakdown[priority] || 0) + 1;

      channelBreakdown[channel] =
        (channelBreakdown[channel] || 0) + 1;

      failureBreakdown[failureCategory] =
        (failureBreakdown[failureCategory] || 0) + 1;

      if (status === "recovered") {
        recoveredCount += 1;

        recoveredAmount += Number(
          recovery.recoveredAmount || amount
        );
      } else if (status === "unrecoverable") {
        unrecoverableCount += 1;
        unrecoverableAmount += amount;
      } else {
        activeCount += 1;
        activeAmount += amount;
      }
    });

    const recoveryRate =
      totalAtRisk > 0
        ? (recoveredAmount / totalAtRisk) * 100
        : 0;

    res.status(200).json({
      success: true,

      data: {
        totalRecoveries,
        recoveredCount,
        activeCount,
        unrecoverableCount,

        totalAtRisk,
        recoveredAmount,
        activeAmount,
        unrecoverableAmount,

        recoveryRate: Number(recoveryRate.toFixed(2)),

        statusBreakdown,
        priorityBreakdown,
        channelBreakdown,
        failureBreakdown,
      },
    });
  } catch (error) {
    console.error("GET /api/recovery/analytics ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch recovery analytics.",
      error: error.message,
    });
  }
});

// ============================================================
// GET SINGLE RECOVERY
// GET /api/recovery/:id
// ============================================================

router.get("/:id", async (req, res) => {
  try {
    const recovery = await Recovery.findById(req.params.id)
      .populate("paymentId")
      .lean();

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Recovery not found.",
      });
    }

    const payment = recovery.paymentId || recovery.payment || null;

    res.status(200).json({
      success: true,
      data: {
        ...recovery,

        paymentId:
          payment?._id?.toString?.() ||
          recovery.paymentId?.toString?.() ||
          null,

        payment: payment || null,
      },
    });
  } catch (error) {
    console.error("GET /api/recovery/:id ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch recovery.",
      error: error.message,
    });
  }
});

// ============================================================
// CREATE RECOVERY
// POST /api/recovery/create
// ============================================================

router.post("/create", async (req, res) => {
  try {
    const {
      paymentId,
      recoveryMessage = "",
      recommendedAction = "",
    } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "paymentId is required.",
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    const existingRecovery = await Recovery.findOne({
      paymentId: payment._id,
      status: {
        $nin: ["recovered", "unrecoverable", "closed"],
      },
    });

    if (existingRecovery) {
      return res.status(200).json({
        success: true,
        message: "Recovery already exists for this payment.",
        data: existingRecovery,
      });
    }

    const recovery = await Recovery.create({
      payment: payment._id,
      paymentId: payment._id,

      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      customerPhone: payment.customerPhone,

      amount: payment.amount,
      currency: payment.currency,

      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,

      failureReason: payment.failureReason,
      failureCode: payment.failureCode,

      recoveryType: "payment_failure",

      status: "pending",

      retryCount: payment.retryCount || 0,
      attemptCount: 0,
      maxAttempts: 3,

      recoveryPriority:
        payment.recoveryPriority || "MEDIUM",

      priority:
        payment.recoveryPriority || "MEDIUM",

      recommendedAction:
        recommendedAction ||
        payment.aiRecommendation?.action ||
        "Send recovery message",

      recommendedChannel: "email",

      action:
        recommendedAction ||
        payment.aiRecommendation?.action ||
        "Send recovery message",

      reason:
        payment.aiRecommendation?.reason ||
        payment.failureReason ||
        "Payment failure requires recovery.",

      explanation:
        payment.aiRecommendation?.reason ||
        "AI identified this payment as recoverable.",

      recoveryMessage,

      generatedMessage: recoveryMessage,

      aiScore:
        payment.recoveryPriority === "HIGH"
          ? 85
          : payment.recoveryPriority === "MEDIUM"
          ? 65
          : 40,

      recoveryProbability:
        payment.recoveryPriority === "HIGH"
          ? 80
          : payment.recoveryPriority === "MEDIUM"
          ? 60
          : 40,

      contactAllowed: true,

      safety: {
        contactAllowed: true,
        customerRequestedStop: false,
        maxAttempts: 3,
        currentAttempts: 0,
        recoveryStopped: false,
      },

      auditTrail: [
        {
          action: "recovery_created",
          status: "pending",
          message: "Recovery workflow created.",
          actor: "system",
          timestamp: new Date(),
        },
      ],
    });

    await Payment.findByIdAndUpdate(payment._id, {
      recoveryStatus: "in_progress",
    });

    res.status(201).json({
      success: true,
      message: "Recovery created successfully.",
      data: recovery,
    });
  } catch (error) {
    console.error("POST /api/recovery/create ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create recovery.",
      error: error.message,
    });
  }
});

// ============================================================
// SEND RECOVERY
// POST /api/recovery/send
// ============================================================

router.post("/send", async (req, res) => {
  try {
    const {
      recoveryId,
      message,
      channel = "email",
    } = req.body;

    if (!recoveryId) {
      return res.status(400).json({
        success: false,
        message: "recoveryId is required.",
      });
    }

    const recovery = await Recovery.findById(recoveryId);

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Recovery not found.",
      });
    }

    recovery.status = "contacted";

    recovery.lastAction = "recovery_message_sent";
    recovery.lastActionStatus = "success";
    recovery.lastActionAt = new Date();

    recovery.lastActionMessage =
      message ||
      recovery.generatedMessage ||
      recovery.recoveryMessage ||
      "Recovery message sent.";

    recovery.actionSuccessful = true;

    recovery.lastContactedAt = new Date();
    recovery.contactAttempts =
      Number(recovery.contactAttempts || 0) + 1;

    recovery.lastCommunicationChannel = channel;
    recovery.lastCommunicationStatus = "sent";

    recovery.attemptCount =
      Number(recovery.attemptCount || 0) + 1;

    recovery.retryCount =
      Number(recovery.retryCount || 0) + 1;

    recovery.lastAttemptAt = new Date();

    recovery.auditTrail.push({
      action: "recovery_message_sent",
      status: "success",
      message:
        recovery.lastActionMessage,
      actor: "system",
      timestamp: new Date(),
    });

    await recovery.save();

    res.status(200).json({
      success: true,
      message: "Recovery communication recorded successfully.",
      data: recovery,
    });
  } catch (error) {
    console.error("POST /api/recovery/send ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to send recovery communication.",
      error: error.message,
    });
  }
});

// ============================================================
// MARK RECOVERY AS RECOVERED
// POST /api/recovery/:id/recovered
// ============================================================

router.post("/:id/recovered", async (req, res) => {
  try {
    const { recoveredAmount } = req.body;

    const recovery = await Recovery.findById(
      req.params.id
    );

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Recovery not found.",
      });
    }

    const amount =
      recoveredAmount !== undefined
        ? Number(recoveredAmount)
        : Number(recovery.amount || 0);

    recovery.status = "recovered";
    recovery.recoveredAmount = amount;
    recovery.recoveredAt = new Date();
    recovery.closedAt = new Date();

    recovery.lastAction = "payment_recovered";
    recovery.lastActionStatus = "success";
    recovery.lastActionAt = new Date();
    recovery.actionSuccessful = true;

    recovery.stoppingReason =
      "Payment successfully recovered.";

    if (recovery.promiseToPay) {
      recovery.promiseToPay.fulfilled = true;
    }

    recovery.auditTrail.push({
      action: "payment_recovered",
      status: "success",
      message: `Payment recovered for ${amount}.`,
      actor: "system",
      timestamp: new Date(),
    });

    await recovery.save();

    if (recovery.paymentId) {
      await Payment.findByIdAndUpdate(
        recovery.paymentId,
        {
          paymentStatus: "success",
          recoveryStatus: "recovered",
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Recovery marked as recovered.",
      data: recovery,
    });
  } catch (error) {
    console.error(
      "POST /api/recovery/:id/recovered ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to mark recovery as recovered.",
      error: error.message,
    });
  }
});

// ============================================================
// MARK RECOVERY AS UNRECOVERABLE
// POST /api/recovery/:id/unrecoverable
// ============================================================

router.post("/:id/unrecoverable", async (req, res) => {
  try {
    const { reason = "Recovery attempts exhausted." } =
      req.body;

    const recovery = await Recovery.findById(
      req.params.id
    );

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Recovery not found.",
      });
    }

    recovery.status = "unrecoverable";

    recovery.stoppingReason = reason;

    recovery.closedAt = new Date();

    recovery.lastAction = "recovery_stopped";
    recovery.lastActionStatus = "stopped";
    recovery.lastActionAt = new Date();

    recovery.actionSuccessful = false;

    recovery.safety.recoveryStopped = true;

    recovery.auditTrail.push({
      action: "recovery_stopped",
      status: "unrecoverable",
      message: reason,
      actor: "system",
      timestamp: new Date(),
    });

    await recovery.save();

    if (recovery.paymentId) {
      await Payment.findByIdAndUpdate(
        recovery.paymentId,
        {
          recoveryStatus: "unrecoverable",
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Recovery marked as unrecoverable.",
      data: recovery,
    });
  } catch (error) {
    console.error(
      "POST /api/recovery/:id/unrecoverable ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to mark recovery as unrecoverable.",
      error: error.message,
    });
  }
});

module.exports = router;
