/**
 * PayRecover AI
 * Revenue Recovery Decision Engine
 *
 * This engine does not directly perform unlimited actions.
 * It produces a bounded recommendation that the recovery
 * workflow can execute and audit.
 */

const analyzeRevenueRisk = ({
  amount = 0,
  failureCategory = "unknown",
  attemptCount = 0,
  customerHistory = {},
  recoveryType = "payment_failure",
}) => {
  let score = 50;

  // ---------------------------------------------
  // Amount
  // ---------------------------------------------

  if (amount >= 50000) {
    score += 15;
  } else if (amount >= 10000) {
    score += 10;
  } else if (amount < 1000) {
    score -= 5;
  }

  // ---------------------------------------------
  // Failure category
  // ---------------------------------------------

  const highRecoveryCategories = [
    "insufficient_funds",
    "expired_card",
    "authentication",
    "timeout",
    "network",
  ];

  const lowRecoveryCategories = [
    "invalid_details",
    "customer_abandonment",
  ];

  if (
    highRecoveryCategories.includes(
      failureCategory
    )
  ) {
    score += 15;
  }

  if (
    lowRecoveryCategories.includes(
      failureCategory
    )
  ) {
    score -= 10;
  }

  // ---------------------------------------------
  // Attempts
  // ---------------------------------------------

  score -= attemptCount * 8;

  // ---------------------------------------------
  // Customer history
  // ---------------------------------------------

  if (
    customerHistory.previousSuccessfulPayments >
    3
  ) {
    score += 10;
  }

  if (
    customerHistory.previousRecoverySuccess
  ) {
    score += 10;
  }

  score = Math.max(
    0,
    Math.min(100, score)
  );

  // ---------------------------------------------
  // Recovery probability
  // ---------------------------------------------

  let recoveryProbability = score;

  if (
    recoveryType ===
    "checkout_abandonment"
  ) {
    recoveryProbability += 5;
  }

  if (
    recoveryType ===
    "b2b_receivable"
  ) {
    recoveryProbability += 3;
  }

  recoveryProbability = Math.max(
    0,
    Math.min(100, recoveryProbability)
  );

  // ---------------------------------------------
  // Recommended intervention
  // ---------------------------------------------

  let recommendedAction =
    "send_email";

  if (
    failureCategory ===
      "insufficient_funds" &&
    attemptCount < 2
  ) {
    recommendedAction =
      "retry_payment";
  } else if (
    recoveryType ===
    "checkout_abandonment"
  ) {
    recommendedAction =
      "send_email";
  } else if (
    recoveryType ===
    "b2b_receivable"
  ) {
    recommendedAction =
      "send_invoice_reminder";
  } else if (
    recoveryType ===
    "mandate_retry"
  ) {
    recommendedAction =
      "retry_mandate";
  } else if (
    recoveryProbability < 25
  ) {
    recommendedAction =
      "escalate";
  }

  return {
    score,
    recoveryProbability,
    recommendedAction,
  };
};

const shouldStopRecovery = ({
  attemptCount = 0,
  maxAttempts = 3,
  recoveryProbability = 0,
  contactAllowed = true,
}) => {
  if (!contactAllowed) {
    return {
      stop: true,
      reason: "compliance_limit",
    };
  }

  if (attemptCount >= maxAttempts) {
    return {
      stop: true,
      reason: "maximum_attempts",
    };
  }

  if (recoveryProbability < 15) {
    return {
      stop: true,
      reason:
        "low_recovery_probability",
    };
  }

  return {
    stop: false,
    reason: null,
  };
};

module.exports = {
  analyzeRevenueRisk,
  shouldStopRecovery,
};