const Payment = require("../models/payment");
const Recovery = require("../models/Recovery");

const {
  analyzeFailure,
} = require("./recoveryEngine");

const {
  generateRecoveryMessage,
} = require("./aiRecoveryService");

const {
  sendEmail,
} = require("./emailService");

const {
  paymentRecoveryTemplate,
} = require("./emailTemplates");


// ============================================================
// DEFAULT COMPLIANCE RULES
// ============================================================

const DEFAULT_COMPLIANCE_RULES = {
  maxPaymentRetries: 3,
  maxReminders: 3,
  reminderIntervalHours: 24,
  recoveryWindowDays: 7,
  autoStopOnRecovery: true,
  autoStopOnRetryExhaustion: true,
  escalationEnabled: true,
  lowProbabilityThreshold: 30,
};


// ============================================================
// IN-MEMORY RULE CONFIG
// ============================================================

let complianceRules = {
  ...DEFAULT_COMPLIANCE_RULES,
};


// ============================================================
// HELPERS
// ============================================================

const calculateNextAction = (
  attemptCount,
  reminderIntervalHours =
    complianceRules.reminderIntervalHours
) => {
  const delays = {
    1: reminderIntervalHours,
    2: reminderIntervalHours,
    3: reminderIntervalHours,
  };

  const hours =
    delays[attemptCount] ||
    reminderIntervalHours;

  return new Date(
    Date.now() +
      hours * 60 * 60 * 1000
  );
};


// ============================================================
// RECOVERY WINDOW
// ============================================================

const calculateRecoveryExpiry = (
  createdAt = new Date()
) => {
  return new Date(
    new Date(createdAt).getTime() +
      complianceRules.recoveryWindowDays *
        24 *
        60 *
        60 *
        1000
  );
};


// ============================================================
// LEGACY AUDIT EVENT
// ============================================================

const createAuditEvent = ({
  action,
  status,
  reason,
  metadata = {},
}) => {
  return {
    timestamp: new Date(),

    action,

    status,

    reason,

    metadata,
  };
};


// ============================================================
// STRUCTURED AUDIT EVENT
// ============================================================

const createStructuredAuditEvent = ({
  recovery,
  actor = "system",
  action,
  previousStatus = null,
  newStatus = null,
  reason = null,
  amount = null,
  metadata = {},
}) => {
  return {
    timestamp: new Date(),

    actor,

    action,

    previousStatus,

    newStatus,

    reason,

    customerName:
      recovery?.customerName || null,

    customerEmail:
      recovery?.customerEmail || null,

    amount:
      amount !== null
        ? Number(amount)
        : Number(
            recovery?.amount || 0
          ),

    recoveryId:
      recovery?._id
        ? recovery._id.toString()
        : null,

    metadata,
  };
};


// ============================================================
// ADD AUDIT EVENT
// ============================================================

const addAuditEvent = (
  recovery,
  {
    actor = "system",
    action,
    previousStatus = null,
    newStatus = null,
    reason = null,
    amount = null,
    metadata = {},
  }
) => {
  if (!recovery) {
    return;
  }

  if (!Array.isArray(recovery.auditTrail)) {
    recovery.auditTrail = [];
  }

  recovery.auditTrail.push(
    createStructuredAuditEvent({
      recovery,
      actor,
      action,
      previousStatus,
      newStatus,
      reason,
      amount,
      metadata,
    })
  );
};


// ============================================================
// ADD LEGACY + STRUCTURED AUDIT
// ============================================================

const addAudit = (
  recovery,
  {
    actor = "system",
    action,
    previousStatus = null,
    newStatus = null,
    reason = null,
    metadata = {},
  }
) => {
  addAuditEvent(
    recovery,
    {
      actor,
      action,
      previousStatus,
      newStatus,
      reason,
      metadata,
    }
  );

  recovery.metadata =
    recovery.metadata || {};

  recovery.metadata.auditTrail =
    recovery.metadata.auditTrail ||
    [];

  recovery.metadata.auditTrail.push(
    createAuditEvent({
      action,
      status:
        newStatus ||
        "success",
      reason,
      metadata,
    })
  );
};


// ============================================================
// CHECK RECOVERY WINDOW
// ============================================================

const isRecoveryWindowExpired = (
  recovery
) => {
  if (!recovery) {
    return false;
  }

  if (
    recovery.status ===
      "recovered" ||
    recovery.status ===
      "unrecoverable" ||
    recovery.status ===
      "stopped"
  ) {
    return false;
  }

  const expiryDate =
    calculateRecoveryExpiry(
      recovery.createdAt
    );

  return (
    new Date() >= expiryDate
  );
};


// ============================================================
// STOP RECOVERY INTERNALLY
// ============================================================

const stopRecoveryInternal = async ({
  recovery,
  reason = "manual_stop",
  details = null,
  actor = "system",
}) => {
  if (!recovery) {
    throw new Error(
      "Recovery record not found"
    );
  }

  const previousStatus =
    recovery.status;

  recovery.status = "stopped";

  recovery.stoppingReason =
    reason;

  recovery.nextActionAt = null;

  recovery.lastActionAt =
    new Date();

  addAudit(
    recovery,
    {
      actor,

      action:
        "recovery_stopped",

      previousStatus,

      newStatus:
        "stopped",

      reason:
        details ||
        reason,

      metadata: {
        stoppingReason:
          reason,

        recoveryWindowDays:
          complianceRules.recoveryWindowDays,
      },
    }
  );

  await recovery.save();

  return recovery;
};


// ============================================================
// CREATE RECOVERY
// ============================================================

const createRecovery = async (
  paymentId,
  options = {}
) => {
  try {
    // --------------------------------------------------------
    // Find payment
    // --------------------------------------------------------

    const payment =
      await Payment.findById(
        paymentId
      );

    if (!payment) {
      throw new Error(
        "Payment not found"
      );
    }


    // --------------------------------------------------------
    // Validate payment
    // --------------------------------------------------------

    if (
      payment.paymentStatus !==
      "failed"
    ) {
      throw new Error(
        "Recovery can only be created for failed payments"
      );
    }


    // --------------------------------------------------------
    // Prevent duplicate active recoveries
    // --------------------------------------------------------

    const existingRecovery =
      await Recovery.findOne({
        paymentId:
          payment._id,

        status: {
          $nin: [
            "recovered",
            "unrecoverable",
            "stopped",
          ],
        },
      });

    if (existingRecovery) {
      return existingRecovery;
    }


    // --------------------------------------------------------
    // AI failure analysis
    // --------------------------------------------------------

    const analysis =
      analyzeFailure(payment);


    // --------------------------------------------------------
    // AI message
    // --------------------------------------------------------

    const aiResult =
      generateRecoveryMessage(
        payment
      );


    // --------------------------------------------------------
    // Recovery configuration
    // --------------------------------------------------------

    const recoveryType =
      options.recoveryType ||
      "payment_failure";

    const recoveryStatus =
      options.status ||
      "created";

    const recoveryChannel =
      options.recoveryChannel ||
      "email";

    const nextActionAt =
      options.nextActionAt ||
      new Date();


    const maxAttempts =
      Number(
        options.maxAttempts ||
        complianceRules.maxPaymentRetries
      );


    // --------------------------------------------------------
    // Create recovery first
    // --------------------------------------------------------

    const recovery =
      new Recovery({
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
          payment.currency ||
          "INR",

        recoveryType,

        status:
          recoveryStatus,

        failureReason:
          payment.failureReason ||
          analysis.failureReason ||
          "Payment failed",

        failureCategory:
          analysis.failureCategory ||
          "unknown",

        rootCause:
          analysis.rootCause ||
          analysis.reason ||
          "Payment failure detected",

        aiScore:
          Number(
            analysis.aiScore || 0
          ),

        recoveryProbability:
          Number(
            analysis.recoveryProbability ||
            0
          ),

        recommendedAction:
          analysis.action ||
          "send_email",

        priority:
          analysis.priority ||
          "MEDIUM",

        currentStep: 0,

        maxAttempts,

        attemptCount: 0,

        nextActionAt,

        lastActionAt: null,

        recoveredAmount: 0,

        recoveredAt: null,

        recoveryChannel,

        promiseToPay: {
          promised: false,

          promisedAmount: 0,

          promisedDate: null,

          fulfilled: false,

          fulfilledAt: null,
        },

        stoppingReason:
          null,

        escalationLevel:
          Number(
            analysis.escalationLevel ||
            0
          ),

        contactAllowed:
          options.contactAllowed !==
          false,

        messageLanguage:
          options.messageLanguage ||
          "english",

        generatedMessage:
          aiResult.message ||
          null,

        campaignId:
          options.campaignId ||
          null,

        metadata: {
          paymentLink:
            aiResult.paymentLink ||
            null,

          generatedBy:
            aiResult.generatedBy ||
            "rule-based-ai",

          originalPaymentStatus:
            payment.paymentStatus,

          createdFrom:
            "PayRecover AI recovery engine",

          complianceRules: {
            maxPaymentRetries:
              complianceRules.maxPaymentRetries,

            maxReminders:
              complianceRules.maxReminders,

            reminderIntervalHours:
              complianceRules.reminderIntervalHours,

            recoveryWindowDays:
              complianceRules.recoveryWindowDays,
          },
        },

        auditTrail: [],
      });


    // --------------------------------------------------------
    // Save once to obtain recovery ID
    // --------------------------------------------------------

    await recovery.save();


    // --------------------------------------------------------
    // Recovery created audit
    // --------------------------------------------------------

    addAudit(
      recovery,
      {
        actor:
          "system",

        action:
          "recovery_created",

        previousStatus:
          null,

        newStatus:
          recovery.status,

        reason:
          "AI recovery workflow created",

        metadata: {
          paymentId:
            payment._id.toString(),

          recoveryType,

          amount:
            payment.amount,

          currency:
            payment.currency ||
            "INR",

          aiScore:
            analysis.aiScore,

          recoveryProbability:
            analysis.recoveryProbability,

          priority:
            analysis.priority,

          recommendedAction:
            analysis.action,

          maxAttempts,

          recoveryWindowDays:
            complianceRules.recoveryWindowDays,
        },
      }
    );


    // --------------------------------------------------------
    // AI decision audit
    // --------------------------------------------------------

    addAudit(
      recovery,
      {
        actor:
          "ai",

        action:
          "ai_recovery_decision",

        previousStatus:
          recovery.status,

        newStatus:
          recovery.status,

        reason:
          analysis.reason ||
          "AI analyzed payment failure",

        metadata: {
          failureCategory:
            analysis.failureCategory,

          rootCause:
            analysis.rootCause,

          aiScore:
            Number(
              analysis.aiScore || 0
            ),

          recoveryProbability:
            Number(
              analysis.recoveryProbability ||
              0
            ),

          recommendedAction:
            analysis.action,

          priority:
            analysis.priority,
        },
      }
    );


    // --------------------------------------------------------
    // Low probability escalation
    // --------------------------------------------------------

    if (
      complianceRules
        .escalationEnabled &&
      Number(
        analysis.recoveryProbability ||
        0
      ) <
        complianceRules
          .lowProbabilityThreshold
    ) {
      recovery.escalationLevel =
        Math.min(
          Number(
            recovery.escalationLevel ||
            0
          ) + 1,
          5
        );

      addAudit(
        recovery,
        {
          actor:
            "ai",

          action:
            "recovery_escalation_triggered",

          previousStatus:
            recovery.status,

          newStatus:
            recovery.status,

          reason:
            "Recovery probability below configured threshold",

          metadata: {
            recoveryProbability:
              Number(
                analysis.recoveryProbability ||
                0
              ),

            threshold:
              complianceRules
                .lowProbabilityThreshold,

            escalationLevel:
              recovery.escalationLevel,
          },
        }
      );
    }


    await recovery.save();


    // --------------------------------------------------------
    // Update payment
    // --------------------------------------------------------

    payment.recoveryStatus =
      recoveryStatus ===
      "stopped"
        ? "unrecoverable"
        : "in_progress";


    payment.aiRecommendation = {
      action:
        analysis.action ||
        null,

      reason:
        analysis.reason ||
        payment.failureReason ||
        null,

      message:
        aiResult.message ||
        null,
    };


    payment.recoveryPriority =
      analysis.priority ||
      null;


    await payment.save();


    return recovery;

  } catch (error) {
    console.error(
      "Create recovery error:",
      error.message
    );

    throw error;
  }
};


// ============================================================
// SEND RECOVERY EMAIL
// ============================================================

const sendRecoveryEmail = async (
  recoveryId
) => {
  try {
    // --------------------------------------------------------
    // Find recovery
    // --------------------------------------------------------

    const recovery =
      await Recovery.findById(
        recoveryId
      );

    if (!recovery) {
      throw new Error(
        "Recovery record not found"
      );
    }


    // --------------------------------------------------------
    // Already recovered
    // --------------------------------------------------------

    if (
      recovery.status ===
      "recovered"
    ) {
      throw new Error(
        "This recovery is already recovered"
      );
    }


    // --------------------------------------------------------
    // Already stopped
    // --------------------------------------------------------

    if (
      [
        "stopped",
        "unrecoverable",
      ].includes(
        recovery.status
      )
    ) {
      throw new Error(
        "This recovery has already been stopped"
      );
    }


    // --------------------------------------------------------
    // Customer contact restriction
    // --------------------------------------------------------

    if (
      recovery.contactAllowed ===
      false
    ) {
      const previousStatus =
        recovery.status;

      recovery.status =
        "stopped";

      recovery.stoppingReason =
        "compliance_limit";

      recovery.nextActionAt =
        null;

      recovery.lastActionAt =
        new Date();

      addAudit(
        recovery,
        {
          actor:
            "system",

          action:
            "customer_contact_blocked",

          previousStatus,

          newStatus:
            "stopped",

          reason:
            "Customer contact is not allowed",

          metadata: {
            complianceCheck:
              true,
          },
        }
      );

      await recovery.save();

      throw new Error(
        "Customer contact is not allowed for this recovery"
      );
    }


    // --------------------------------------------------------
    // Recovery window
    // --------------------------------------------------------

    if (
      isRecoveryWindowExpired(
        recovery
      )
    ) {
      await stopRecoveryInternal({
        recovery,

        reason:
          "expired",

        details:
          "Recovery window expired before successful recovery",

        actor:
          "system",
      });

      throw new Error(
        "Recovery window has expired"
      );
    }


    // --------------------------------------------------------
    // Maximum attempts
    // --------------------------------------------------------

    if (
      recovery.attemptCount >=
      recovery.maxAttempts
    ) {
      await stopRecoveryInternal({
        recovery,

        reason:
          "maximum_attempts",

        details:
          "Maximum recovery attempts reached",

        actor:
          "system",
      });

      throw new Error(
        "Maximum recovery attempts reached"
      );
    }


    // --------------------------------------------------------
    // Reminder compliance limit
    // --------------------------------------------------------

    if (
      recovery.attemptCount >=
      complianceRules.maxReminders
    ) {
      await stopRecoveryInternal({
        recovery,

        reason:
          "compliance_limit",

        details:
          "Maximum customer reminders reached",

        actor:
          "system",
      });

      throw new Error(
        "Maximum customer reminders reached"
      );
    }


    // --------------------------------------------------------
    // Minimum reminder interval
    // --------------------------------------------------------

    if (recovery.lastActionAt) {
      const minimumInterval =
        complianceRules
          .reminderIntervalHours *
        60 *
        60 *
        1000;

      const elapsed =
        Date.now() -
        new Date(
          recovery.lastActionAt
        ).getTime();

      if (
        elapsed <
        minimumInterval
      ) {
        const remainingMinutes =
          Math.ceil(
            (
              minimumInterval -
              elapsed
            ) /
              (60 * 1000)
          );

        throw new Error(
          `Reminder interval not reached. Try again in approximately ${remainingMinutes} minutes.`
        );
      }
    }


    // --------------------------------------------------------
    // Find payment
    // --------------------------------------------------------

    const payment =
      await Payment.findById(
        recovery.paymentId
      );

    if (!payment) {
      throw new Error(
        "Payment not found"
      );
    }


    // --------------------------------------------------------
    // Create email
    // --------------------------------------------------------

    const email =
      paymentRecoveryTemplate({
        customerName:
          recovery.customerName,

        amount:
          payment.amount,

        currency:
          payment.currency,

        recoveryMessage:
          recovery.generatedMessage ||
          "Please retry your payment.",

        paymentLink:
          recovery.metadata?.paymentLink ||
          null,
      });


    // --------------------------------------------------------
    // Email attempt audit
    // --------------------------------------------------------

    const previousStatus =
      recovery.status;

    addAudit(
      recovery,
      {
        actor:
          "system",

        action:
          "recovery_email_attempted",

        previousStatus,

        newStatus:
          previousStatus,

        reason:
          "Recovery email delivery initiated",

        metadata: {
          attempt:
            recovery.attemptCount + 1,

          channel:
            "email",
        },
      }
    );


    // --------------------------------------------------------
    // Send email
    // --------------------------------------------------------

    const result =
      await sendEmail({
        to:
          recovery.customerEmail,

        subject:
          email.subject,

        text:
          email.text,

        html:
          email.html,
      });


    // --------------------------------------------------------
    // Email failed
    // --------------------------------------------------------

    if (
      !result.success
    ) {
      recovery.status =
        "failed";

      recovery.lastActionAt =
        new Date();

      addAudit(
        recovery,
        {
          actor:
            "system",

          action:
            "send_email",

          previousStatus,

          newStatus:
            "failed",

          reason:
            result.error ||
            "Email delivery failed",

          metadata: {
            attempt:
              recovery.attemptCount + 1,

            channel:
              "email",
          },
        }
      );

      await recovery.save();

      throw new Error(
        result.error ||
        "Failed to send recovery email"
      );
    }


    // --------------------------------------------------------
    // Successful email
    // --------------------------------------------------------

    recovery.status =
      "contacted";

    recovery.attemptCount +=
      1;

    recovery.lastActionAt =
      new Date();

    recovery.nextActionAt =
      recovery.attemptCount >=
        recovery.maxAttempts ||
      recovery.attemptCount >=
        complianceRules.maxReminders
        ? null
        : calculateNextAction(
            recovery.attemptCount
          );

    recovery.recoveryChannel =
      "email";

    recovery.currentStep +=
      1;


    // --------------------------------------------------------
    // Email success audit
    // --------------------------------------------------------

    addAudit(
      recovery,
      {
        actor:
          "system",

        action:
          "send_email",

        previousStatus,

        newStatus:
          "contacted",

        reason:
          "Recovery email sent successfully",

        metadata: {
          messageId:
            result.messageId ||
            null,

          attempt:
            recovery.attemptCount,

          nextActionAt:
            recovery.nextActionAt,

          channel:
            "email",
        },
      }
    );


    // --------------------------------------------------------
    // Retry exhaustion warning
    // --------------------------------------------------------

    if (
      recovery.attemptCount >=
      recovery.maxAttempts
    ) {
      addAudit(
        recovery,
        {
          actor:
            "system",

          action:
            "retry_limit_reached",

          previousStatus:
            "contacted",

          newStatus:
            "contacted",

          reason:
            "Maximum configured retry attempts reached",

          metadata: {
            maxAttempts:
              recovery.maxAttempts,
          },
        }
      );
    }


    await recovery.save();


    return {
      success: true,

      message:
        "Recovery email sent successfully",

      messageId:
        result.messageId,

      recovery,
    };

  } catch (error) {
    console.error(
      "Send recovery email error:",
      error.message
    );

    throw error;
  }
};


// ============================================================
// MARK RECOVERY AS RECOVERED
// ============================================================

const markRecoveryRecovered =
  async (
    recoveryId,
    recoveredAmount
  ) => {
    const recovery =
      await Recovery.findById(
        recoveryId
      );

    if (!recovery) {
      throw new Error(
        "Recovery record not found"
      );
    }


    if (
      recovery.status ===
      "recovered"
    ) {
      return recovery;
    }


    const amount =
      Number(recoveredAmount) ||
      Number(recovery.amount) ||
      0;


    const previousStatus =
      recovery.status;


    // --------------------------------------------------------
    // Update recovery
    // --------------------------------------------------------

    recovery.status =
      "recovered";

    recovery.recoveredAmount =
      Math.min(
        amount,
        Number(
          recovery.amount || amount
        )
      );

    recovery.recoveredAt =
      new Date();

    recovery.lastActionAt =
      new Date();

    recovery.nextActionAt =
      null;

    recovery.stoppingReason =
      "recovered";


    recovery.promiseToPay =
      recovery.promiseToPay ||
      {};

    if (
      recovery.promiseToPay.promised
    ) {
      recovery.promiseToPay.fulfilled =
        true;

      recovery.promiseToPay.fulfilledAt =
        new Date();
    }


    // --------------------------------------------------------
    // Recovery audit
    // --------------------------------------------------------

    addAudit(
      recovery,
      {
        actor:
          "system",

        action:
          "payment_recovered",

        previousStatus,

        newStatus:
          "recovered",

        reason:
          "Revenue successfully recovered",

        amount:
          recovery.recoveredAmount,

        metadata: {
          recoveredAmount:
            recovery.recoveredAmount,

          recoveryRate:
            recovery.amount > 0
              ? Number(
                  (
                    recovery.recoveredAmount /
                    recovery.amount
                  ) *
                    100
                ).toFixed(2)
              : 0,

          automaticStopping:
            complianceRules
              .autoStopOnRecovery,
        },
      }
    );


    // --------------------------------------------------------
    // Automatic stopping audit
    // --------------------------------------------------------

    if (
      complianceRules
        .autoStopOnRecovery
    ) {
      addAudit(
        recovery,
        {
          actor:
            "system",

          action:
            "recovery_workflow_stopped",

          previousStatus:
            "recovered",

          newStatus:
            "recovered",

          reason:
            "Workflow automatically stopped after successful recovery",

          metadata: {
            stoppingRule:
              "auto_stop_on_recovery",
          },
        }
      );
    }


    await recovery.save();


    // --------------------------------------------------------
    // Update payment
    // --------------------------------------------------------

    const payment =
      await Payment.findById(
        recovery.paymentId
      );

    if (payment) {
      payment.paymentStatus =
        "success";

      payment.recoveryStatus =
        "recovered";

      await payment.save();
    }


    return recovery;
  };


// ============================================================
// MARK RECOVERY UNRECOVERABLE
// ============================================================

const markRecoveryUnrecoverable =
  async (
    recoveryId,
    reason = "unrecoverable"
  ) => {
    const recovery =
      await Recovery.findById(
        recoveryId
      );

    if (!recovery) {
      throw new Error(
        "Recovery record not found"
      );
    }


    const previousStatus =
      recovery.status;


    recovery.status =
      "unrecoverable";

    recovery.stoppingReason =
      reason ===
      "maximum_attempts"
        ? "maximum_attempts"
        : "unrecoverable";

    recovery.nextActionAt =
      null;

    recovery.lastActionAt =
      new Date();


    // --------------------------------------------------------
    // Audit
    // --------------------------------------------------------

    addAudit(
      recovery,
      {
        actor:
          "system",

        action:
          "recovery_stopped",

        previousStatus,

        newStatus:
          "unrecoverable",

        reason,

        metadata: {
          stoppingReason:
            recovery.stoppingReason,
        },
      }
    );


    await recovery.save();


    // --------------------------------------------------------
    // Update payment
    // --------------------------------------------------------

    const payment =
      await Payment.findById(
        recovery.paymentId
      );

    if (payment) {
      payment.recoveryStatus =
        "unrecoverable";

      await payment.save();
    }


    return recovery;
  };


// ============================================================
// MANUAL STOP RECOVERY
// ============================================================

const stopRecovery = async ({
  recoveryId,
  reason = "manual_stop",
  details = "Recovery manually stopped",
  actor = "admin",
}) => {
  const recovery =
    await Recovery.findById(
      recoveryId
    );

  if (!recovery) {
    throw new Error(
      "Recovery record not found"
    );
  }


  if (
    recovery.status ===
    "recovered"
  ) {
    throw new Error(
      "A recovered recovery cannot be stopped"
    );
  }


  const stoppedRecovery =
    await stopRecoveryInternal({
      recovery,

      reason,

      details,

      actor,
    });


  // ----------------------------------------------------------
  // Update payment
  // ----------------------------------------------------------

  const payment =
    await Payment.findById(
      recovery.paymentId
    );

  if (payment) {
    payment.recoveryStatus =
      "unrecoverable";

    await payment.save();
  }


  return stoppedRecovery;
};


// ============================================================
// ESCALATE RECOVERY
// ============================================================

const escalateRecovery =
  async ({
    recoveryId,
    reason =
      "Manual escalation requested",
    actor = "admin",
  }) => {
    const recovery =
      await Recovery.findById(
        recoveryId
      );

    if (!recovery) {
      throw new Error(
        "Recovery record not found"
      );
    }


    if (
      [
        "recovered",
        "unrecoverable",
        "stopped",
      ].includes(
        recovery.status
      )
    ) {
      throw new Error(
        "Cannot escalate a completed recovery"
      );
    }


    const previousLevel =
      Number(
        recovery.escalationLevel ||
        0
      );

    const previousStatus =
      recovery.status;


    recovery.escalationLevel =
      Math.min(
        previousLevel + 1,
        5
      );


    recovery.status =
      "in_progress";


    recovery.lastActionAt =
      new Date();


    addAudit(
      recovery,
      {
        actor,

        action:
          "recovery_escalated",

        previousStatus,

        newStatus:
          "in_progress",

        reason,

        metadata: {
          previousEscalationLevel:
            previousLevel,

          newEscalationLevel:
            recovery.escalationLevel,
        },
      }
    );


    await recovery.save();


    return recovery;
  };


// ============================================================
// GET RECOVERY BY ID
// ============================================================

const getRecoveryById =
  async (
    recoveryId
  ) => {
    const recovery =
      await Recovery.findById(
        recoveryId
      ).populate(
        "paymentId"
      );

    if (!recovery) {
      throw new Error(
        "Recovery record not found"
      );
    }

    return recovery;
  };


// ============================================================
// GET ALL RECOVERIES
// ============================================================

const getAllRecoveries =
  async () => {
    return await Recovery.find()
      .populate(
        "paymentId"
      )
      .sort({
        createdAt: -1,
      });
  };


// ============================================================
// GET RECOVERY ANALYTICS
// ============================================================

const getRecoveryAnalytics =
  async () => {
    const recoveries =
      await Recovery.find();


    let revenueAtRisk = 0;

    let recoveredRevenue = 0;

    let inProgressRevenue = 0;

    let unrecoverableRevenue = 0;


    let recoveredCount = 0;

    let inProgressCount = 0;

    let unrecoverableCount = 0;

    let stoppedCount = 0;

    let escalatedCount = 0;

    let totalAttempts = 0;


    const typeStats = {};

    const failureStats = {};


    for (
      const recovery of recoveries
    ) {
      const amount =
        Number(
          recovery.amount || 0
        );


      // ------------------------------------------------------
      // Attempts
      // ------------------------------------------------------

      totalAttempts +=
        Number(
          recovery.attemptCount ||
          0
        );


      // ------------------------------------------------------
      // Revenue at risk
      // ------------------------------------------------------

      if (
        recovery.status !==
          "recovered" &&
        recovery.status !==
          "unrecoverable" &&
        recovery.status !==
          "stopped"
      ) {
        revenueAtRisk +=
          amount;
      }


      // ------------------------------------------------------
      // Recovered
      // ------------------------------------------------------

      if (
        recovery.status ===
        "recovered"
      ) {
        recoveredRevenue +=
          Number(
            recovery.recoveredAmount ||
            amount
          );

        recoveredCount++;
      }


      // ------------------------------------------------------
      // In progress
      // ------------------------------------------------------

      if (
        [
          "created",
          "pending",
          "in_progress",
          "contacted",
          "promised",
          "failed",
        ].includes(
          recovery.status
        )
      ) {
        inProgressRevenue +=
          amount;

        inProgressCount++;
      }


      // ------------------------------------------------------
      // Unrecoverable
      // ------------------------------------------------------

      if (
        [
          "unrecoverable",
          "stopped",
        ].includes(
          recovery.status
        )
      ) {
        unrecoverableRevenue +=
          amount;

        unrecoverableCount++;
      }


      if (
        recovery.status ===
        "stopped"
      ) {
        stoppedCount++;
      }


      // ------------------------------------------------------
      // Escalation
      // ------------------------------------------------------

      if (
        Number(
          recovery.escalationLevel ||
          0
        ) > 0
      ) {
        escalatedCount++;
      }


      // ------------------------------------------------------
      // Recovery type
      // ------------------------------------------------------

      const type =
        recovery.recoveryType ||
        "payment_failure";


      if (
        !typeStats[type]
      ) {
        typeStats[type] = {
          count: 0,
          amount: 0,
          recovered: 0,
        };
      }


      typeStats[type].count++;

      typeStats[type].amount +=
        amount;


      if (
        recovery.status ===
        "recovered"
      ) {
        typeStats[type].recovered +=
          Number(
            recovery.recoveredAmount ||
            amount
          );
      }


      // ------------------------------------------------------
      // Failure category
      // ------------------------------------------------------

      const category =
        recovery.failureCategory ||
        "unknown";


      if (
        !failureStats[category]
      ) {
        failureStats[category] = {
          count: 0,
          amount: 0,
          recovered: 0,
        };
      }


      failureStats[category].count++;

      failureStats[category].amount +=
        amount;


      if (
        recovery.status ===
        "recovered"
      ) {
        failureStats[category].recovered +=
          Number(
            recovery.recoveredAmount ||
            amount
          );
      }
    }


    // --------------------------------------------------------
    // Recovery rate
    // --------------------------------------------------------

    const totalRecoveryValue =
      recoveredRevenue +
      revenueAtRisk +
      unrecoverableRevenue;


    const recoveryRate =
      totalRecoveryValue > 0
        ? (
            recoveredRevenue /
            totalRecoveryValue
          ) * 100
        : 0;


    // --------------------------------------------------------
    // Average recovery amount
    // --------------------------------------------------------

    const averageRecoveredAmount =
      recoveredCount > 0
        ? recoveredRevenue /
          recoveredCount
        : 0;


    return {
      summary: {
        totalRecoveries:
          recoveries.length,

        recoveredCount,

        inProgressCount,

        unrecoverableCount,

        stoppedCount,

        escalatedCount,

        totalAttempts,

        revenueAtRisk:
          Number(
            revenueAtRisk.toFixed(2)
          ),

        recoveredRevenue:
          Number(
            recoveredRevenue.toFixed(2)
          ),

        inProgressRevenue:
          Number(
            inProgressRevenue.toFixed(2)
          ),

        unrecoverableRevenue:
          Number(
            unrecoverableRevenue.toFixed(2)
          ),

        recoveryRate:
          Number(
            recoveryRate.toFixed(2)
          ),

        averageRecoveredAmount:
          Number(
            averageRecoveredAmount.toFixed(
              2
            )
          ),
      },

      byRecoveryType:
        typeStats,

      byFailureCategory:
        failureStats,

      compliance: {
        ...complianceRules,
      },
    };
  };


// ============================================================
// AI RECOVERY QUEUE
// ============================================================

const getRecoveryQueue =
  async () => {
    return await Recovery.find({
      status: {
        $nin: [
          "recovered",
          "unrecoverable",
          "stopped",
        ],
      },
    })
      .populate(
        "paymentId"
      )
      .sort({
        aiScore: -1,

        recoveryProbability:
          -1,

        amount: -1,

        createdAt: -1,
      });
  };


// ============================================================
// GET COMPLIANCE RULES
// ============================================================

const getComplianceRules =
  async () => {
    return {
      ...complianceRules,
    };
  };


// ============================================================
// UPDATE COMPLIANCE RULES
// ============================================================

const updateComplianceRules =
  async (
    updates = {}
  ) => {
    const allowedKeys = [
      "maxPaymentRetries",
      "maxReminders",
      "reminderIntervalHours",
      "recoveryWindowDays",
      "autoStopOnRecovery",
      "autoStopOnRetryExhaustion",
      "escalationEnabled",
      "lowProbabilityThreshold",
    ];


    const nextRules = {
      ...complianceRules,
    };


    for (
      const key of allowedKeys
    ) {
      if (
        updates[key] !==
        undefined
      ) {
        nextRules[key] =
          updates[key];
      }
    }


    // --------------------------------------------------------
    // Numeric validation
    // --------------------------------------------------------

    const numericRules = [
      "maxPaymentRetries",
      "maxReminders",
      "reminderIntervalHours",
      "recoveryWindowDays",
      "lowProbabilityThreshold",
    ];


    for (
      const key of numericRules
    ) {
      const value =
        Number(
          nextRules[key]
        );

      if (
        !Number.isFinite(
          value
        ) ||
        value <= 0
      ) {
        throw new Error(
          `${key} must be a positive number`
        );
      }

      nextRules[key] =
        value;
    }


    // --------------------------------------------------------
    // Boolean validation
    // --------------------------------------------------------

    const booleanRules = [
      "autoStopOnRecovery",
      "autoStopOnRetryExhaustion",
      "escalationEnabled",
    ];


    for (
      const key of booleanRules
    ) {
      if (
        typeof nextRules[key] !==
        "boolean"
      ) {
        throw new Error(
          `${key} must be true or false`
        );
      }
    }


    // --------------------------------------------------------
    // Maximum values
    // --------------------------------------------------------

    if (
      nextRules.maxPaymentRetries >
      10
    ) {
      throw new Error(
        "Maximum payment retries cannot exceed 10"
      );
    }


    if (
      nextRules.maxReminders >
      10
    ) {
      throw new Error(
        "Maximum reminders cannot exceed 10"
      );
    }


    if (
      nextRules.recoveryWindowDays >
      30
    ) {
      throw new Error(
        "Recovery window cannot exceed 30 days"
      );
    }


    if (
      nextRules.lowProbabilityThreshold >
      100
    ) {
      throw new Error(
        "Low probability threshold cannot exceed 100"
      );
    }


    complianceRules =
      nextRules;


    return {
      ...complianceRules,
    };
  };


// ============================================================
// GET AUDIT TRAIL
// ============================================================

const getRecoveryAuditTrail =
  async (
    recoveryId
  ) => {
    const recovery =
      await Recovery.findById(
        recoveryId
      );

    if (!recovery) {
      throw new Error(
        "Recovery record not found"
      );
    }


    const auditTrail =
      Array.isArray(
        recovery.auditTrail
      )
        ? recovery.auditTrail
        : [];


    return {
      recoveryId:
        recovery._id.toString(),

      customerName:
        recovery.customerName,

      customerEmail:
        recovery.customerEmail,

      amount:
        recovery.amount,

      currency:
        recovery.currency,

      status:
        recovery.status,

      stoppingReason:
        recovery.stoppingReason,

      totalEvents:
        auditTrail.length,

      events:
        auditTrail.sort(
          (a, b) =>
            new Date(
              b.timestamp
            ) -
            new Date(
              a.timestamp
            )
        ),
    };
  };


// ============================================================
// GET ALL AUDIT EVENTS
// ============================================================

const getAllAuditEvents =
  async () => {
    const recoveries =
      await Recovery.find({
        auditTrail: {
          $exists: true,
          $ne: [],
        },
      })
        .select(
          "customerName customerEmail amount currency auditTrail"
        )
        .lean();


    const events = [];


    for (
      const recovery of recoveries
    ) {
      const auditTrail =
        Array.isArray(
          recovery.auditTrail
        )
          ? recovery.auditTrail
          : [];


      for (
        const event of auditTrail
      ) {
        events.push({
          ...event,

          recoveryId:
            recovery._id.toString(),

          customerName:
            event.customerName ||
            recovery.customerName,

          customerEmail:
            event.customerEmail ||
            recovery.customerEmail,

          amount:
            event.amount ??
            recovery.amount,

          currency:
            recovery.currency ||
            "INR",
        });
      }
    }


    events.sort(
      (a, b) =>
        new Date(
          b.timestamp
        ) -
        new Date(
          a.timestamp
        )
    );


    return events;
  };


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createRecovery,

  sendRecoveryEmail,

  markRecoveryRecovered,

  markRecoveryUnrecoverable,

  getRecoveryById,

  getAllRecoveries,

  getRecoveryAnalytics,

  getRecoveryQueue,

  getComplianceRules,

  updateComplianceRules,

  stopRecovery,

  escalateRecovery,

  getRecoveryAuditTrail,

  getAllAuditEvents,
};
