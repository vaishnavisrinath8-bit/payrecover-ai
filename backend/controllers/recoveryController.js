
// ============================================================
// PayRecover AI - Recovery Controller
// ============================================================

const Recovery = require("../models/Recovery");
const { analyzeFailure } = require("../services/recoveryEngine");

// ============================================================
// HELPER
// ============================================================

const findRecovery = async (id) => {
  if (!id) {
    return null;
  }

  return await Recovery.findById(id);
};

// ============================================================
// GET ALL RECOVERIES
// ============================================================

const getAllRecoveries = async (req, res) => {
  try {
    const {
      status,
      priority,
      failureCategory,
      search,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (failureCategory) {
      filter.failureCategory = failureCategory;
    }

    if (search) {
      filter.$or = [
        {
          customerName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          customerEmail: {
            $regex: search,
            $options: "i",
          },
        },
        {
          failureCategory: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const recoveries = await Recovery.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: recoveries.length,
      recoveries,
    });
  } catch (error) {
    console.error(
      "Get recoveries error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recoveries.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET RECOVERY QUEUE
// ============================================================

const getRecoveryQueue = async (req, res) => {
  try {
    const recoveries = await Recovery.find({
      status: {
        $in: [
          "pending",
          "created",
          "processing",
          "in_progress",
          "active",
          "queued",
          "retrying",
        ],
      },
    })
      .sort({
        priority: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: recoveries.length,
      recoveries,
    });
  } catch (error) {
    console.error(
      "Get recovery queue error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recovery queue.",
    });
  }
};

// ============================================================
// GET SINGLE RECOVERY
// ============================================================

const getRecoveryById = async (req, res) => {
  try {
    const recovery = await findRecovery(
      req.params.id
    );

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found.",
      });
    }

    return res.status(200).json({
      success: true,
      recovery,
    });
  } catch (error) {
    console.error(
      "Get recovery error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recovery.",
    });
  }
};

// ============================================================
// CREATE RECOVERY
// ============================================================

const createRecovery = async (req, res) => {
  try {
    const data = req.body || {};

    const analysis = analyzeFailure(
      {
        failureReason:
          data.failureReason || "",
        failureCode:
          data.failureCode || "",
        paymentMethod:
          data.paymentMethod || "",
        retryCount:
          Number(data.retryCount || 0),
        amount:
          Number(data.amount || 0),
        paymentStatus:
          data.paymentStatus ||
          data.status ||
          "failed",
      },
      {
        recoveryType:
          data.recoveryType ||
          "payment_failure",

        attemptCount:
          Number(data.attemptCount || 0),

        maxAttempts:
          Number(data.maxAttempts || 3),

        customerRequestedStop:
          data.customerRequestedStop ||
          false,

        contactAllowed:
          data.contactAllowed !== false,

        daysOverdue:
          Number(data.daysOverdue || 0),
      }
    );

    const recovery = new Recovery({
      ...data,

      failureCategory:
        data.failureCategory ||
        analysis.failureCategory,

      rootCause:
        data.rootCause ||
        analysis.rootCause,

      recommendedAction:
        data.recommendedAction ||
        analysis.action,

      priority:
        data.priority ||
        analysis.priority,

      aiScore:
        data.aiScore ??
        analysis.aiScore,

      recoveryProbability:
        data.recoveryProbability ??
        analysis.recoveryProbability,

      escalationLevel:
        data.escalationLevel ??
        analysis.escalationLevel,

      stoppingReason:
        data.stoppingReason ||
        analysis.stoppingReason ||
        null,

      status:
        data.status ||
        "pending",
    });

    await recovery.save();

    return res.status(201).json({
      success: true,
      message: "Recovery case created.",
      recovery,
      analysis,
    });
  } catch (error) {
    console.error(
      "Create recovery error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create recovery.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// UPDATE RECOVERY
// ============================================================

const updateRecovery = async (req, res) => {
  try {
    const recovery =
      await Recovery.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body || {},
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recovery updated.",
      recovery,
    });
  } catch (error) {
    console.error(
      "Update recovery error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update recovery.",
    });
  }
};

// ============================================================
// RETRY RECOVERY
// ============================================================

const retryRecovery = async (req, res) => {
  try {
    const recovery =
      await Recovery.findById(req.params.id);

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found.",
      });
    }

    const currentStatus =
      String(
        recovery.status || ""
      ).toLowerCase();

    if (
      [
        "recovered",
        "success",
        "successful",
        "completed",
      ].includes(currentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This recovery is already recovered.",
      });
    }

    if (
      recovery.customerRequestedStop === true ||
      recovery.contactAllowed === false
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Recovery action is blocked by customer preferences.",
      });
    }

    const attemptCount =
      Number(
        recovery.attemptCount || 0
      );

    const analysis = analyzeFailure(
      {
        failureReason:
          recovery.failureReason ||
          recovery.failureCategory ||
          "",

        failureCode:
          recovery.failureCode || "",

        paymentMethod:
          recovery.paymentMethod || "",

        retryCount:
          attemptCount,

        amount:
          Number(recovery.amount || 0),

        paymentStatus:
          recovery.status || "failed",
      },
      {
        recoveryType:
          recovery.recoveryType ||
          "payment_failure",

        attemptCount,

        maxAttempts:
          Number(
            recovery.maxAttempts || 3
          ),

        customerRequestedStop:
          recovery.customerRequestedStop ||
          false,

        contactAllowed:
          recovery.contactAllowed !== false,

        daysOverdue:
          Number(
            recovery.daysOverdue || 0
          ),
      }
    );

    if (
      analysis.action ===
      "stop_recovery"
    ) {
      recovery.status =
        "unrecoverable";

      recovery.lastAction =
        "stop_recovery";

      recovery.stoppingReason =
        analysis.stoppingReason ||
        "recovery_rule";

      recovery.closedAt =
        new Date();

      await recovery.save();

      return res.status(200).json({
        success: true,
        action: "stop_recovery",
        message:
          "Recovery stopped by AI safety rules.",
        recovery,
        analysis,
      });
    }

    recovery.attemptCount =
      attemptCount + 1;

    recovery.lastAttemptAt =
      new Date();

    recovery.lastAction =
      "retry_payment";

    recovery.status =
      "retrying";

    recovery.aiScore =
      analysis.aiScore;

    recovery.recoveryProbability =
      analysis.recoveryProbability;

    recovery.priority =
      analysis.priority;

    recovery.failureCategory =
      analysis.failureCategory;

    recovery.rootCause =
      analysis.rootCause;

    recovery.recommendedAction =
      analysis.action;

    recovery.escalationLevel =
      analysis.escalationLevel;

    await recovery.save();

    return res.status(200).json({
      success: true,
      action: "retry_payment",
      message:
        "Payment recovery retry has been queued.",
      recovery,
      analysis,
    });
  } catch (error) {
    console.error(
      "Retry recovery error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retry recovery.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// SEND RECOVERY REMINDER
// ============================================================

const sendRecoveryReminder =
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
            "Recovery case not found.",
        });
      }

      if (
        recovery.contactAllowed ===
        false
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer contact is not allowed.",
        });
      }

      const currentAttempts =
        Number(
          recovery.attemptCount || 0
        );

      const maxAttempts =
        Number(
          recovery.maxAttempts || 3
        );

      if (
        currentAttempts >=
        maxAttempts
      ) {
        recovery.status =
          "unrecoverable";

        recovery.stoppingReason =
          "maximum_attempts";

        recovery.lastAction =
          "stop_recovery";

        await recovery.save();

        return res.status(400).json({
          success: false,
          message:
            "Maximum recovery attempts have been reached.",
          recovery,
        });
      }

      recovery.attemptCount =
        currentAttempts + 1;

      recovery.lastAction =
        "send_email";

      recovery.lastContactAt =
        new Date();

      recovery.status =
        "processing";

      await recovery.save();

      return res.status(200).json({
        success: true,
        action: "send_email",
        message:
          "Recovery reminder has been queued.",
        recovery,
      });
    } catch (error) {
      console.error(
        "Send recovery reminder error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to send recovery reminder.",
      });
    }
  };

// ============================================================
// MARK RECOVERED
// ============================================================

const markRecovered = async (
  req,
  res
) => {
  try {
    const recovery =
      await Recovery.findById(
        req.params.id
      );

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message:
          "Recovery case not found.",
      });
    }

    recovery.status =
      "recovered";

    recovery.lastAction =
      "recovered";

    recovery.recoveredAt =
      new Date();

    recovery.stoppingReason =
      null;

    await recovery.save();

    return res.status(200).json({
      success: true,
      message:
        "Recovery marked as recovered.",
      recovery,
    });
  } catch (error) {
    console.error(
      "Mark recovered error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to mark recovery as recovered.",
    });
  }
};

// ============================================================
// MARK UNRECOVERABLE
// ============================================================

const markUnrecoverable =
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
            "Recovery case not found.",
        });
      }

      recovery.status =
        "unrecoverable";

      recovery.lastAction =
        "stop_recovery";

      recovery.stoppingReason =
        "manually_closed";

      recovery.closedAt =
        new Date();

      await recovery.save();

      return res.status(200).json({
        success: true,
        message:
          "Recovery case closed successfully.",
        recovery,
      });
    } catch (error) {
      console.error(
        "Mark unrecoverable error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to close recovery case.",
      });
    }
  };

// ============================================================
// RECOVERY STATISTICS
// ============================================================

const getRecoveryStats = async (
  req,
  res
) => {
  try {
    const recoveries =
      await Recovery.find({}).lean();

    const total =
      recoveries.length;

    const recovered =
      recoveries.filter((item) =>
        [
          "recovered",
          "success",
          "successful",
          "completed",
        ].includes(
          String(
            item.status || ""
          ).toLowerCase()
        )
      );

    const active =
      recoveries.filter((item) =>
        [
          "pending",
          "created",
          "processing",
          "in_progress",
          "active",
          "queued",
          "retrying",
        ].includes(
          String(
            item.status || ""
          ).toLowerCase()
        )
      );

    const closed =
      recoveries.filter((item) =>
        [
          "unrecoverable",
          "closed",
          "failed",
        ].includes(
          String(
            item.status || ""
          ).toLowerCase()
        )
      );

    const amountAtRisk =
      active.reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

    const recoveredAmount =
      recovered.reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

    const recoveryRate =
      total > 0
        ? Math.round(
            (recovered.length /
              total) *
              100
          )
        : 0;

    return res.status(200).json({
      success: true,

      stats: {
        total,
        active: active.length,
        recovered:
          recovered.length,
        closed:
          closed.length,
        amountAtRisk,
        recoveredAmount,
        recoveryRate,
      },
    });
  } catch (error) {
    console.error(
      "Recovery stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to calculate recovery statistics.",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getAllRecoveries,
  getRecoveryQueue,
  getRecoveryById,
  createRecovery,
  updateRecovery,
  retryRecovery,
  sendRecoveryReminder,
  markRecovered,
  markUnrecoverable,
  getRecoveryStats,
};

