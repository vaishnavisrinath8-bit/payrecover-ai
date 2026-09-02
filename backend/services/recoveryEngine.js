// ============================================================
// PayRecover AI
// Intelligent Automated Recovery Engine
// ============================================================
//
// Responsibilities:
// 1. Diagnose payment failure
// 2. Classify failure
// 3. Calculate recovery probability
// 4. Calculate AI confidence score
// 5. Assign priority
// 6. Select recommended action
// 7. Determine escalation
// 8. Apply retry safety rules
// 9. Apply stopping rules
//
// This engine is intentionally bounded and deterministic.
// ============================================================

const analyzeFailure = (payment = {}, options = {}) => {
  // ==========================================================
  // PAYMENT DATA
  // ==========================================================

  const failureReason = String(
    payment.failureReason ||
      payment.failure_reason ||
      payment.reason ||
      payment.errorReason ||
      payment.error_message ||
      ""
  );

  const failureCode = String(
    payment.failureCode ||
      payment.failure_code ||
      payment.code ||
      ""
  );

  const paymentMethod = String(
    payment.paymentMethod ||
      payment.payment_method ||
      payment.method ||
      ""
  );

  const paymentStatus = String(
    payment.paymentStatus ||
      payment.status ||
      "failed"
  ).toLowerCase();

  const retryCount = Number(
    payment.retryCount ||
      payment.retry_count ||
      0
  );

  const amount = Number(
    payment.amount ||
      payment.paymentAmount ||
      payment.totalAmount ||
      0
  );

  // ==========================================================
  // OPTIONS
  // ==========================================================

  const recoveryType =
    options.recoveryType ||
    "payment_failure";

  const attemptCount = Number(
    options.attemptCount || 0
  );

  const maxAttempts = Number(
    options.maxAttempts || 3
  );

  const customerRequestedStop =
    Boolean(options.customerRequestedStop);

  const contactAllowed =
    options.contactAllowed !== false;

  const daysOverdue = Number(
    options.daysOverdue || 0
  );

  // ==========================================================
  // NORMALIZED VALUES
  // ==========================================================

  const reason = failureReason.toLowerCase();
  const method = paymentMethod.toLowerCase();
  const code = failureCode.toUpperCase();

  // ==========================================================
  // DEFAULT INTELLIGENCE
  // ==========================================================

  let failureCategory = "unknown";

  let rootCause =
    "The exact payment failure cause could not be determined.";

  let recommendedAction = "send_email";

  let priority = "MEDIUM";

  let recoveryProbability = 50;

  let aiScore = 50;

  let escalationLevel = 0;

  let stoppingReason = null;

  // ==========================================================
  // STOPPING RULE #1
  // CUSTOMER DOES NOT WANT CONTACT
  // ==========================================================

  if (
    customerRequestedStop ||
    contactAllowed === false
  ) {
    return {
      success: true,

      action: "stop_recovery",

      recommendedAction: "stop_recovery",

      priority: "LOW",

      reason:
        "Recovery stopped because customer contact is not allowed.",

      failureReason,

      failureCode,

      paymentMethod,

      paymentStatus,

      retryCount,

      amount,

      failureCategory,

      rootCause,

      aiScore: 0,

      recoveryProbability: 0,

      escalationLevel: 0,

      stoppingReason:
        "customer_requested_stop",
    };
  }

  // ==========================================================
  // STOPPING RULE #2
  // MAXIMUM ATTEMPTS
  // ==========================================================

  if (
    attemptCount >= maxAttempts
  ) {
    return {
      success: true,

      action: "stop_recovery",

      recommendedAction: "stop_recovery",

      priority: "LOW",

      reason:
        "Maximum recovery attempts have been reached.",

      failureReason,

      failureCode,

      paymentMethod,

      paymentStatus,

      retryCount,

      amount,

      failureCategory,

      rootCause,

      aiScore: 0,

      recoveryProbability: 0,

      escalationLevel: 0,

      stoppingReason:
        "maximum_attempts",
    };
  }

  // ==========================================================
  // CHECKOUT ABANDONMENT
  // ==========================================================

  if (
    recoveryType ===
      "checkout_abandonment" ||
    reason.includes("abandon") ||
    reason.includes("checkout")
  ) {
    failureCategory =
      "customer_abandonment";

    rootCause =
      "The customer started checkout but did not complete the payment.";

    recommendedAction =
      "send_email";

    priority = "HIGH";

    recoveryProbability = 72;

    aiScore = 82;

    escalationLevel = 1;
  }

  // ==========================================================
  // FAILED SUBSCRIPTION
  // ==========================================================

  else if (
    recoveryType ===
      "failed_subscription" ||
    reason.includes("subscription") ||
    reason.includes("recurring")
  ) {
    failureCategory =
      "subscription_failure";

    rootCause =
      "A recurring subscription payment could not be completed.";

    recommendedAction =
      "send_email";

    priority = "HIGH";

    recoveryProbability = 68;

    aiScore = 78;

    escalationLevel = 1;
  }

  // ==========================================================
  // B2B OVERDUE RECEIVABLE
  // ==========================================================

  else if (
    recoveryType ===
      "b2b_receivable" ||
    reason.includes("invoice") ||
    reason.includes("overdue")
  ) {
    failureCategory =
      "invoice_overdue";

    rootCause =
      `The receivable is overdue by ${daysOverdue} days.`;

    recommendedAction =
      "send_invoice_reminder";

    if (daysOverdue >= 60) {
      priority = "HIGH";
      recoveryProbability = 35;
      escalationLevel = 3;
    } else if (daysOverdue >= 30) {
      priority = "HIGH";
      recoveryProbability = 50;
      escalationLevel = 2;
    } else if (daysOverdue >= 15) {
      priority = "MEDIUM";
      recoveryProbability = 65;
      escalationLevel = 1;
    } else {
      priority = "LOW";
      recoveryProbability = 75;
      escalationLevel = 1;
    }

    aiScore =
      recoveryProbability;
  }

  // ==========================================================
  // MANDATE FAILURE
  // ==========================================================

  else if (
    recoveryType ===
      "mandate_retry" ||
    reason.includes("mandate")
  ) {
    failureCategory =
      "mandate_failure";

    rootCause =
      "The recurring payment mandate could not be processed.";

    recommendedAction =
      "retry_mandate";

    priority = "HIGH";

    recoveryProbability = 65;

    aiScore = 76;

    escalationLevel = 1;
  }

  // ==========================================================
  // PROMISE TO PAY
  // ==========================================================

  else if (
    recoveryType ===
    "promise_to_pay"
  ) {
    failureCategory =
      "promise_to_pay";

    rootCause =
      "The customer has indicated an intention to pay at a later date.";

    recommendedAction =
      "contact_customer";

    priority = "HIGH";

    recoveryProbability = 80;

    aiScore = 85;

    escalationLevel = 1;
  }

  // ==========================================================
  // INSUFFICIENT FUNDS
  // ==========================================================

  else if (
    reason.includes("insufficient") ||
    reason.includes("insufficient funds") ||
    reason.includes("low balance") ||
    reason.includes("balance")
  ) {
    failureCategory =
      "insufficient_funds";

    rootCause =
      "The customer's payment account may not have sufficient funds.";

    recommendedAction =
      "send_email";

    priority = "HIGH";

    recoveryProbability = 70;

    aiScore = 82;

    escalationLevel = 1;
  }

  // ==========================================================
  // CARD DECLINE
  // ==========================================================

  else if (
    reason.includes("declined") ||
    reason.includes("card declined") ||
    code === "BAD_REQUEST_ERROR" ||
    code === "CARD_DECLINED"
  ) {
    failureCategory =
      "card_decline";

    rootCause =
      "The card issuer declined the transaction.";

    recommendedAction =
      "send_email";

    priority = "HIGH";

    recoveryProbability = 62;

    aiScore = 76;

    escalationLevel = 1;
  }

  // ==========================================================
  // AUTHENTICATION FAILURE
  // ==========================================================

  else if (
    reason.includes("authentication") ||
    reason.includes("3ds") ||
    reason.includes("3d secure") ||
    reason.includes("otp")
  ) {
    failureCategory =
      "authentication";

    rootCause =
      "Payment authentication was not completed successfully.";

    recommendedAction =
      "send_email";

    priority = "MEDIUM";

    recoveryProbability = 64;

    aiScore = 70;

    escalationLevel = 1;
  }

  // ==========================================================
  // EXPIRED CARD
  // ==========================================================

  else if (
    reason.includes("expired") ||
    reason.includes("expiry") ||
    reason.includes("expiration")
  ) {
    failureCategory =
      "expired_card";

    rootCause =
      "The payment card appears to be expired.";

    recommendedAction =
      "send_email";

    priority = "HIGH";

    recoveryProbability = 58;

    aiScore = 73;

    escalationLevel = 1;
  }

  // ==========================================================
  // INVALID PAYMENT DETAILS
  // ==========================================================

  else if (
    reason.includes("invalid") ||
    reason.includes("incorrect details") ||
    reason.includes("wrong details")
  ) {
    failureCategory =
      "invalid_details";

    rootCause =
      "The payment details provided by the customer may be invalid.";

    recommendedAction =
      "send_email";

    priority = "MEDIUM";

    recoveryProbability = 55;

    aiScore = 66;

    escalationLevel = 1;
  }

  // ==========================================================
  // NETWORK / TIMEOUT / TECHNICAL
  // ==========================================================

  else if (
    reason.includes("network") ||
    reason.includes("timeout") ||
    reason.includes("timed out") ||
    reason.includes("technical") ||
    reason.includes("server") ||
    reason.includes("temporary")
  ) {
    if (
      reason.includes("timeout") ||
      reason.includes("timed out")
    ) {
      failureCategory =
        "timeout";
    } else {
      failureCategory =
        "network";
    }

    rootCause =
      "The payment appears to have failed because of a temporary technical issue.";

    recommendedAction =
      "retry_payment";

    priority = "MEDIUM";

    recoveryProbability = 78;

    aiScore = 84;

    escalationLevel = 0;
  }

  // ==========================================================
  // UPI FAILURE
  // ==========================================================

  else if (
    method.includes("upi") ||
    reason.includes("upi")
  ) {
    failureCategory =
      "upi_failure";

    rootCause =
      "The UPI transaction could not be completed.";

    recommendedAction =
      "retry_payment";

    priority = "MEDIUM";

    recoveryProbability = 70;

    aiScore = 75;

    escalationLevel = 0;
  }

  // ==========================================================
  // MULTIPLE RETRIES
  // ==========================================================

  else if (
    retryCount >= 3
  ) {
    failureCategory =
      "repeated_failure";

    rootCause =
      "The payment has failed repeatedly and further automatic retries may have low value.";

    recommendedAction =
      "contact_customer";

    priority = "HIGH";

    recoveryProbability = 35;

    aiScore = 60;

    escalationLevel = 2;
  }

  // ==========================================================
  // HIGH VALUE PAYMENT
  // ==========================================================

  else if (
    amount >= 100000
  ) {
    failureCategory =
      "high_value_payment";

    rootCause =
      "High-value payment requires additional customer assistance before retrying.";

    recommendedAction =
      "contact_customer";

    priority = "HIGH";

    recoveryProbability = 60;

    aiScore = 78;

    escalationLevel = 2;
  }

  // ==========================================================
  // DEFAULT FAILURE
  // ==========================================================

  else {
    failureCategory =
      "unknown";

    rootCause =
      "The payment failed without a clearly identifiable failure pattern.";

    recommendedAction =
      "send_email";

    priority = "MEDIUM";

    recoveryProbability = 50;

    aiScore = 55;

    escalationLevel = 1;
  }

  // ==========================================================
  // RETRY SAFETY
  //
  // Never continuously retry the same payment.
  // ==========================================================

  if (
    retryCount >= 2 &&
    recommendedAction ===
      "retry_payment"
  ) {
    recommendedAction =
      "send_email";

    escalationLevel =
      Math.max(
        escalationLevel,
        1
      );

    recoveryProbability =
      Math.max(
        recoveryProbability - 10,
        10
      );
  }

  // ==========================================================
  // HIGH VALUE SAFETY OVERRIDE
  // ==========================================================

  if (
    amount >= 100000 &&
    recommendedAction ===
      "retry_payment"
  ) {
    recommendedAction =
      "contact_customer";

    priority = "HIGH";

    escalationLevel =
      Math.max(
        escalationLevel,
        2
      );
  }

  // ==========================================================
  // LOW PROBABILITY STOPPING RULE
  // ==========================================================

  if (
    recoveryProbability < 20
  ) {
    recommendedAction =
      "stop_recovery";

    stoppingReason =
      "low_recovery_probability";

    escalationLevel =
      Math.max(
        escalationLevel,
        2
      );
  }

  // ==========================================================
  // ACTION DISPLAY MESSAGE
  // ==========================================================

  const actionMessages = {
    send_email:
      "Send a personalized recovery email.",

    retry_payment:
      "Retry the payment automatically.",

    retry_mandate:
      "Retry the recurring payment mandate.",

    send_invoice_reminder:
      "Send an invoice reminder to the customer.",

    contact_customer:
      "Contact the customer for assisted recovery.",

    stop_recovery:
      "Stop automated recovery.",
  };

  // ==========================================================
  // ESCALATION LABEL
  // ==========================================================

  const escalationLabels = {
    0: "NONE",
    1: "STANDARD",
    2: "MANUAL_REVIEW",
    3: "HIGH_PRIORITY",
  };

  // ==========================================================
  // FINAL RESULT
  // ==========================================================

  return {
    success: true,

    // Decision
    action: recommendedAction,

    recommendedAction,

    actionMessage:
      actionMessages[
        recommendedAction
      ] || "Review recovery case.",

    // Classification
    failureCategory,

    rootCause,

    reason: rootCause,

    // Original payment information
    failureReason,

    failureCode,

    paymentMethod,

    paymentStatus,

    amount,

    retryCount,

    // AI intelligence
    aiScore,

    recoveryProbability,

    // Priority
    priority,

    // Escalation
    escalationLevel,

    escalation:
      escalationLabels[
        escalationLevel
      ] || "STANDARD",

    // Stopping
    stoppingReason,

    shouldStop:
      recommendedAction ===
      "stop_recovery",

    // Metadata
    analyzedAt:
      new Date().toISOString(),
  };
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  analyzeFailure,
};