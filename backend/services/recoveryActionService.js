// ============================================================
// PayRecover AI - Recovery Action Service
// ============================================================
// Executes bounded recovery actions recommended by the
// recovery intelligence engine.
//
// Supported actions:
// 1. retry_payment
// 2. send_email
// 3. send_invoice_reminder
// 4. retry_mandate
// 5. contact_customer
// 6. stop_recovery
//
// IMPORTANT:
// This service does NOT blindly retry payments.
// Every action passes through safety/compliance checks.
// ============================================================

const Recovery = require("../models/Recovery");

// ============================================================
// CONSTANTS
// ============================================================

const ACTIVE_STATUSES = [
  "pending",
  "queued",
  "processing",
  "in_progress",
  "retrying",
];

const TERMINAL_STATUSES = [
  "recovered",
  "unrecoverable",
  "closed",
];

const DEFAULT_MAX_ATTEMPTS = 3;

// ============================================================
// HELPERS
// ============================================================

const getActionLabel = (action) => {
  const labels = {
    retry_payment: "Payment Retry",
    send_email: "Recovery Email",
    send_invoice_reminder:
      "Invoice Reminder",
    retry_mandate: "Mandate Retry",
    contact_customer:
      "Customer Contact",
    stop_recovery:
      "Stop Recovery",
  };

  return (
    labels[action] ||
    "Recovery Action"
  );
};

// ------------------------------------------------------------
// Determine whether recovery can continue
// ------------------------------------------------------------

const validateRecoverySafety = (
  recovery
) => {
  if (!recovery) {
    return {
      allowed: false,
      reason:
        "Recovery record was not found.",
      code: "RECOVERY_NOT_FOUND",
    };
  }

  if (
    recovery.customerRequestedStop ===
    true
  ) {
    return {
      allowed: false,
      reason:
        "Customer has requested that recovery contact be stopped.",
      code: "CUSTOMER_REQUESTED_STOP",
    };
  }

  if (
    recovery.contactAllowed ===
    false
  ) {
    return {
      allowed: false,
      reason:
        "Customer contact is not allowed.",
      code: "CONTACT_NOT_ALLOWED",
    };
  }

  if (
    recovery.status ===
    "recovered"
  ) {
    return {
      allowed: false,
      reason:
        "This recovery has already been recovered.",
      code: "ALREADY_RECOVERED",
    };
  }

  if (
    recovery.status ===
    "unrecoverable"
  ) {
    return {
      allowed: false,
      reason:
        "This recovery has already been marked unrecoverable.",
      code: "ALREADY_UNRECOVERABLE",
    };
  }

  if (
    recovery.status ===
    "closed"
  ) {
    return {
      allowed: false,
      reason:
        "This recovery is closed.",
      code: "RECOVERY_CLOSED",
    };
  }

  const maxAttempts =
    Number(
      recovery.maxAttempts
    ) ||
    DEFAULT_MAX_ATTEMPTS;

  const attemptCount =
    Number(
      recovery.attemptCount
    ) || 0;

  if (
    attemptCount >=
    maxAttempts
  ) {
    return {
      allowed: false,
      reason:
        "Maximum recovery attempts have been reached.",
      code: "MAX_ATTEMPTS_REACHED",
    };
  }

  return {
    allowed: true,
    reason: null,
    code: null,
  };
};

// ============================================================
// ACTION VALIDATION
// ============================================================

const validateAction = (
  recovery,
  requestedAction
) => {
  const action =
    requestedAction ||
    recovery.recommendedAction ||
    recovery.action ||
    "send_email";

  const supportedActions = [
    "retry_payment",
    "send_email",
    "send_invoice_reminder",
    "retry_mandate",
    "contact_customer",
    "stop_recovery",
  ];

  if (
    !supportedActions.includes(
      action
    )
  ) {
    return {
      allowed: false,
      action,
      reason:
        `Unsupported recovery action: ${action}`,
      code: "UNSUPPORTED_ACTION",
    };
  }

  return {
    allowed: true,
    action,
    reason: null,
    code: null,
  };
};

// ============================================================
// SIMULATED PAYMENT RETRY
// ============================================================
// This intentionally does NOT charge a real customer.
// Integrate your payment gateway here later.
// ============================================================

const executePaymentRetry =
  async (recovery) => {
    return {
      success: true,

      action:
        "retry_payment",

      message:
        "Payment retry has been queued for processing.",

      gatewayStatus:
        "queued",

      simulated: true,

      paymentId:
        recovery.paymentId || null,
    };
  };

// ============================================================
// SEND EMAIL
// ============================================================
// This queues the communication.
// Your existing email service can be connected here.
// ============================================================

const executeEmail =
  async (recovery) => {
    if (
      !recovery.customerEmail
    ) {
      return {
        success: false,

        action:
          "send_email",

        message:
          "Customer email address is missing.",

        code:
          "CUSTOMER_EMAIL_MISSING",
      };
    }

    return {
      success: true,

      action:
        "send_email",

      message:
        "Recovery email has been queued.",

      channel:
        "email",

      recipient:
        recovery.customerEmail,
    };
  };

// ============================================================
// INVOICE REMINDER
// ============================================================

const executeInvoiceReminder =
  async (recovery) => {
    if (
      !recovery.customerEmail
    ) {
      return {
        success: false,

        action:
          "send_invoice_reminder",

        message:
          "Customer email address is missing.",

        code:
          "CUSTOMER_EMAIL_MISSING",
      };
    }

    return {
      success: true,

      action:
        "send_invoice_reminder",

      message:
        "Invoice reminder has been queued.",

      channel:
        "email",

      recipient:
        recovery.customerEmail,

      daysOverdue:
        Number(
          recovery.daysOverdue
        ) || 0,
    };
  };

// ============================================================
// MANDATE RETRY
// ============================================================
// Like payment retry, this is safely queued rather than
// directly charging a customer.
// ============================================================

const executeMandateRetry =
  async (recovery) => {
    return {
      success: true,

      action:
        "retry_mandate",

      message:
        "Mandate retry has been queued.",

      gatewayStatus:
        "queued",

      simulated: true,

      paymentId:
        recovery.paymentId || null,
    };
  };

// ============================================================
// CUSTOMER CONTACT
// ============================================================

const executeCustomerContact =
  async (recovery) => {
    const channel =
      recovery.customerPreferredChannel ||
      recovery.recommendedChannel ||
      "email";

    if (
      channel === "email" &&
      !recovery.customerEmail
    ) {
      return {
        success: false,

        action:
          "contact_customer",

        message:
          "Customer email address is missing.",

        code:
          "CUSTOMER_EMAIL_MISSING",
      };
    }

    if (
      channel === "sms" &&
      !recovery.customerPhone
    ) {
      return {
        success: false,

        action:
          "contact_customer",

        message:
          "Customer phone number is missing.",

        code:
          "CUSTOMER_PHONE_MISSING",
      };
    }

    return {
      success: true,

      action:
        "contact_customer",

      message:
        "Customer contact has been queued.",

      channel,
    };
  };

// ============================================================
// STOP RECOVERY
// ============================================================

const executeStopRecovery =
  async (recovery) => {
    recovery.status =
      "closed";

    recovery.contactAllowed =
      false;

    recovery.customerRequestedStop =
      true;

    recovery.stoppingReason =
      "recovery_action_stop";

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

    return {
      success: true,

      action:
        "stop_recovery",

      message:
        "Recovery has been stopped.",

      stopped: true,
    };
  };

// ============================================================
// UPDATE COMMUNICATION DETAILS
// ============================================================

const updateCommunication =
  (
    recovery,
    result
  ) => {
    const action =
      result.action;

    let channel =
      result.channel ||
      recovery.recommendedChannel ||
      "email";

    if (
      action ===
      "send_email"
    ) {
      channel = "email";
    }

    if (
      action ===
      "send_invoice_reminder"
    ) {
      channel = "email";
    }

    recovery.contactAttempts =
      (Number(
        recovery.contactAttempts
      ) || 0) + 1;

    recovery.lastContactedAt =
      new Date();

    recovery.lastCommunicationChannel =
      channel;

    recovery.lastCommunicationStatus =
      result.success
        ? "queued"
        : "failed";
  };

// ============================================================
// EXECUTE ACTION
// ============================================================

const executeRecoveryAction =
  async ({
    recoveryId,
    action,
    channel,
  } = {}) => {
    // ----------------------------------------------------------
    // FIND RECOVERY
    // ----------------------------------------------------------

    const recovery =
      await Recovery.findById(
        recoveryId
      );

    if (!recovery) {
      return {
        success: false,

        message:
          "Recovery not found.",

        code:
          "RECOVERY_NOT_FOUND",
      };
    }

    // ----------------------------------------------------------
    // SAFETY CHECK
    // ----------------------------------------------------------

    const safety =
      validateRecoverySafety(
        recovery
      );

    if (!safety.allowed) {
      if (
        safety.code ===
        "MAX_ATTEMPTS_REACHED"
      ) {
        recovery.status =
          "closed";

        recovery.stoppingReason =
          "maximum_attempts";

        recovery.closedAt =
          new Date();

        await recovery.save();
      }

      return {
        success: false,

        message:
          safety.reason,

        code:
          safety.code,

        recovery:
          recovery.toObject(),
      };
    }

    // ----------------------------------------------------------
    // ACTION CHECK
    // ----------------------------------------------------------

    const actionValidation =
      validateAction(
        recovery,
        action
      );

    if (
      !actionValidation.allowed
    ) {
      return {
        success: false,

        message:
          actionValidation.reason,

        code:
          actionValidation.code,
      };
    }

    const selectedAction =
      actionValidation.action;

    // ----------------------------------------------------------
    // STORE EXECUTION STATE
    // ----------------------------------------------------------

    recovery.status =
      "processing";

    recovery.action =
      selectedAction;

    recovery.recommendedAction =
      selectedAction;

    if (channel) {
      recovery.recommendedChannel =
        channel;
    }

    recovery.lastAttemptAt =
      new Date();

    recovery.attemptCount =
      (Number(
        recovery.attemptCount
      ) || 0) + 1;

    await recovery.save();

    // ----------------------------------------------------------
    // EXECUTE
    // ----------------------------------------------------------

    let result;

    try {
      switch (
        selectedAction
      ) {
        case "retry_payment":
          result =
            await executePaymentRetry(
              recovery
            );
          break;

        case "send_email":
          result =
            await executeEmail(
              recovery
            );
          break;

        case "send_invoice_reminder":
          result =
            await executeInvoiceReminder(
              recovery
            );
          break;

        case "retry_mandate":
          result =
            await executeMandateRetry(
              recovery
            );
          break;

        case "contact_customer":
          result =
            await executeCustomerContact(
              recovery
            );
          break;

        case "stop_recovery":
          result =
            await executeStopRecovery(
              recovery
            );
          break;

        default:
          result = {
            success: false,

            message:
              "Unsupported action.",
          };
      }
    } catch (error) {
      console.error(
        "Recovery action execution error:",
        error
      );

      result = {
        success: false,

        action:
          selectedAction,

        message:
          "Recovery action execution failed.",

        error:
          error.message,
      };
    }

    // ----------------------------------------------------------
    // PROCESS RESULT
    // ----------------------------------------------------------

    if (
      result.success
    ) {
      // Stop recovery has its own status.
      if (
        selectedAction ===
        "stop_recovery"
      ) {
        await recovery.save();
      }

      // Normal recovery actions remain active.
      else {
        recovery.status =
          "in_progress";

        if (
          [
            "send_email",
            "send_invoice_reminder",
            "contact_customer",
          ].includes(
            selectedAction
          )
        ) {
          updateCommunication(
            recovery,
            result
          );
        }

        // Schedule next attempt.
        const nextAttempt =
          new Date();

        nextAttempt.setHours(
          nextAttempt.getHours() +
            24
        );

        recovery.nextAttemptAt =
          nextAttempt;

        await recovery.save();
      }
    } else {
      recovery.status =
        "pending";

      recovery.lastCommunicationStatus =
        "failed";

      await recovery.save();
    }

    // ----------------------------------------------------------
    // FINAL RESPONSE
    // ----------------------------------------------------------

    return {
      success:
        result.success,

      message:
        result.message,

      action:
        selectedAction,

      actionLabel:
        getActionLabel(
          selectedAction
        ),

      result,

      recovery:
        recovery.toObject(),
    };
  };

// ============================================================
// MARK RECOVERY AS SUCCESSFULLY RECOVERED
// ============================================================

const markRecoveryRecovered =
  async ({
    recoveryId,
    recoveredAmount,
  } = {}) => {
    const recovery =
      await Recovery.findById(
        recoveryId
      );

    if (!recovery) {
      return {
        success: false,

        message:
          "Recovery not found.",
      };
    }

    const amount =
      Number(
        recoveredAmount
      ) ||
      Number(
        recovery.amount
      ) ||
      0;

    recovery.status =
      "recovered";

    recovery.recoveredAt =
      new Date();

    recovery.recoveredAmount =
      amount;

    recovery.closedAt =
      null;

    recovery.nextAttemptAt =
      null;

    if (recovery.safety) {
      recovery.safety.recoveryStopped =
        true;
    }

    await recovery.save();

    return {
      success: true,

      message:
        "Recovery marked as successfully recovered.",

      recoveredAmount:
        amount,

      recovery:
        recovery.toObject(),
    };
  };

// ============================================================
// MARK RECOVERY UNRECOVERABLE
// ============================================================

const markRecoveryUnrecoverable =
  async ({
    recoveryId,
    reason,
  } = {}) => {
    const recovery =
      await Recovery.findById(
        recoveryId
      );

    if (!recovery) {
      return {
        success: false,

        message:
          "Recovery not found.",
      };
    }

    recovery.status =
      "unrecoverable";

    recovery.closedAt =
      new Date();

    recovery.stoppingReason =
      reason ||
      "marked_unrecoverable";

    recovery.nextAttemptAt =
      null;

    await recovery.save();

    return {
      success: true,

      message:
        "Recovery marked as unrecoverable.",

      recovery:
        recovery.toObject(),
    };
  };

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  executeRecoveryAction,

  markRecoveryRecovered,

  markRecoveryUnrecoverable,

  validateRecoverySafety,

  validateAction,
};