// ============================================
// PayRecover AI - Recovery Engine
// ============================================
// Rule-based payment recovery decision engine.
// This is NOT machine learning.
// It analyzes failure reason, payment method,
// retry count, and amount to choose a recovery action.
// ============================================

const analyzeFailure = (payment) => {
  const {
    failureReason = "",
    failureCode = "",
    paymentMethod = "",
    retryCount = 0,
    amount = 0,
  } = payment;

  const reason = failureReason.toLowerCase();
  const method = paymentMethod.toLowerCase();

  let action = "retry_payment";
  let priority = "MEDIUM";
  let recoveryReason = "Payment can be retried.";

  // ============================================
  // 1. Insufficient funds
  // ============================================

  if (
    reason.includes("insufficient") ||
    reason.includes("insufficient funds")
  ) {
    action = "try_another_payment_method";
    priority = "HIGH";

    recoveryReason =
      "The payment appears to have failed because of insufficient funds. " +
      "Suggest another card, UPI account, or payment method.";
  }

  // ============================================
  // 2. Card declined
  // ============================================

  else if (
    reason.includes("declined") ||
    reason.includes("card declined") ||
    failureCode === "BAD_REQUEST_ERROR"
  ) {
    action = "retry_with_different_method";
    priority = "HIGH";

    recoveryReason =
      "The card payment was declined. " +
      "Recommend retrying with another card or payment method.";
  }

  // ============================================
  // 3. Network / timeout problems
  // ============================================

  else if (
    reason.includes("network") ||
    reason.includes("timeout") ||
    reason.includes("timed out") ||
    reason.includes("technical") ||
    reason.includes("server")
  ) {
    action = "retry_after_delay";
    priority = "MEDIUM";

    recoveryReason =
      "The payment may have failed because of a temporary technical or network issue. " +
      "Recommend retrying after a short delay.";
  }

  // ============================================
  // 4. UPI failure
  // ============================================

  else if (
    method.includes("upi") ||
    reason.includes("upi")
  ) {
    action = "retry_upi_or_use_card";
    priority = "MEDIUM";

    recoveryReason =
      "The UPI payment failed. " +
      "Recommend retrying UPI or switching to a card.";
  }

  // ============================================
  // 5. Multiple retry attempts
  // ============================================

  else if (retryCount >= 3) {
    action = "contact_support";
    priority = "HIGH";

    recoveryReason =
      "The payment has already failed multiple times. " +
      "Further automatic retries may not be useful. Recommend contacting support.";
  }

  // ============================================
  // 6. High-value payment
  // ============================================

  else if (amount >= 100000) {
    action = "retry_with_assistance";
    priority = "HIGH";

    recoveryReason =
      "This is a high-value payment. " +
      "Recommend a careful retry and offer customer assistance.";
  }

  // ============================================
  // 7. Default recovery
  // ============================================

  else {
    action = "retry_payment";
    priority = "MEDIUM";

    recoveryReason =
      "The payment failed but no specific failure pattern was identified. " +
      "Recommend trying the payment again.";
  }

  return {
    action,
    priority,
    reason: recoveryReason,
    failureReason,
    failureCode,
    paymentMethod,
    retryCount,
    amount,
  };
};


// ============================================
// Export
// ============================================

module.exports = {
  analyzeFailure,
};