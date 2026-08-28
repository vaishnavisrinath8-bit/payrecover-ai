/**
 * PayRecover AI - Payment Recovery Engine
 *
 * This is currently a rule-based recovery engine.
 * It analyzes:
 * - failure reason
 * - failure code
 * - payment method
 * - retry count
 * - payment amount
 *
 * The architecture is designed so a real AI/ML model
 * can replace the decision logic later without changing
 * controllers or routes.
 */

// Analyze payment failure and determine recovery strategy
const analyzeFailure = (payment) => {
  const {
    failureReason = "",
    failureCode = "",
    paymentMethod = "",
    retryCount = 0,
    amount = 0,
  } = payment;

  const reasonLower = String(failureReason).toLowerCase();
  const codeLower = String(failureCode).toLowerCase();
  const methodLower = String(paymentMethod).toLowerCase();

  // --------------------------------------------------
  // Rule 1: Insufficient funds
  // --------------------------------------------------

  if (
    reasonLower.includes("insufficient") ||
    codeLower.includes("insufficient_funds")
  ) {
    return {
      action: "SEND_PAYMENT_LINK",
      priority: retryCount >= 2 ? "HIGH" : "MEDIUM",
      reason: "Insufficient funds at the time of payment",
      message:
        "Send a payment link so the customer can retry when sufficient funds are available.",
      recoveryMessage: buildRecoveryMessage({
        type: "INSUFFICIENT_FUNDS",
        amount,
      }),
    };
  }

  // --------------------------------------------------
  // Rule 2: Card declined / expired
  // --------------------------------------------------

  if (
    reasonLower.includes("expired") ||
    reasonLower.includes("declined") ||
    codeLower.includes("card_declined")
  ) {
    return {
      action: "CHANGE_PAYMENT_METHOD",
      priority: "HIGH",
      reason: "Card was declined or has expired",
      message: "Ask the customer to update or change their payment method.",
      recoveryMessage: buildRecoveryMessage({
        type: "CARD_PROBLEM",
        amount,
      }),
    };
  }

  // --------------------------------------------------
  // Rule 3: Network / timeout / gateway failure
  // --------------------------------------------------

  if (
    reasonLower.includes("timeout") ||
    reasonLower.includes("network") ||
    reasonLower.includes("gateway")
  ) {
    return {
      action: "RETRY_PAYMENT",
      priority: retryCount < 2 ? "HIGH" : "MEDIUM",
      reason: "Temporary network or gateway failure",
      message:
        "Suggest retrying the payment after a short delay.",
      recoveryMessage: buildRecoveryMessage({
        type: "TEMPORARY_FAILURE",
        amount,
      }),
    };
  }

  // --------------------------------------------------
  // Rule 4: High-value payment with repeated failures
  // --------------------------------------------------

  if (amount >= 5000 && retryCount >= 2) {
    return {
      action: "CONTACT_CUSTOMER",
      priority: "HIGH",
      reason: "High-value payment has failed multiple times",
      message:
        "Escalate to manual customer outreach because of the transaction value and repeated failures.",
      recoveryMessage: buildRecoveryMessage({
        type: "HIGH_VALUE_FAILURE",
        amount,
      }),
    };
  }

  // --------------------------------------------------
  // Rule 5: Too many retries for low-value payment
  // --------------------------------------------------

  if (retryCount >= 3 && amount < 500) {
    return {
      action: "NO_ACTION",
      priority: "LOW",
      reason: "Low-value payment with repeated failures",
      message:
        "Further recovery attempts are unlikely to be cost-effective.",
      recoveryMessage: buildRecoveryMessage({
        type: "NO_ACTION",
        amount,
      }),
    };
  }

  // --------------------------------------------------
  // Rule 6: UPI-specific issue
  // --------------------------------------------------

  if (
    methodLower.includes("upi") &&
    (reasonLower.includes("failed") ||
      reasonLower.includes("timeout") ||
      reasonLower.includes("pending"))
  ) {
    return {
      action: "RETRY_PAYMENT",
      priority: "MEDIUM",
      reason: "UPI payment could not be completed",
      message:
        "Ask the customer to retry the UPI payment after a short delay.",
      recoveryMessage: buildRecoveryMessage({
        type: "UPI_FAILURE",
        amount,
      }),
    };
  }

  // --------------------------------------------------
  // Default fallback
  // --------------------------------------------------

  return {
    action: "RETRY_PAYMENT",
    priority: "MEDIUM",
    reason: "Failure reason unclear or not specifically categorized",
    message:
      "Attempt a standard retry and monitor the outcome.",
    recoveryMessage: buildRecoveryMessage({
      type: "GENERAL_FAILURE",
      amount,
    }),
  };
};


// --------------------------------------------------
// Generate customer-friendly recovery messages
// --------------------------------------------------

const buildRecoveryMessage = ({ type, amount = 0 }) => {
  const formattedAmount = Number(amount || 0).toLocaleString("en-IN");

  switch (type) {
    case "INSUFFICIENT_FUNDS":
      return `Your payment of ₹${formattedAmount} could not be completed because sufficient funds were not available at the time of the transaction. Please check your account balance and try again when convenient.`;

    case "CARD_PROBLEM":
      return `Your payment of ₹${formattedAmount} could not be completed using the selected card. Please check whether your card is active and try again with the same or another payment method.`;

    case "TEMPORARY_FAILURE":
      return `Your payment of ₹${formattedAmount} could not be completed because of a temporary network or payment gateway issue. Please wait a moment and try again.`;

    case "HIGH_VALUE_FAILURE":
      return `We noticed that your payment of ₹${formattedAmount} could not be completed after multiple attempts. Please try another payment method or contact support if you need assistance.`;

    case "NO_ACTION":
      return `Your payment of ₹${formattedAmount} could not be completed after several attempts. Please contact support if you still need help completing this payment.`;

    case "UPI_FAILURE":
      return `Your UPI payment of ₹${formattedAmount} could not be completed. Please check your UPI app and try the payment again after a short delay.`;

    case "GENERAL_FAILURE":
    default:
      return `Your payment of ₹${formattedAmount} could not be completed. Please try again using the payment link or another available payment method.`;
  }
};


// --------------------------------------------------
// Generate a complete recovery decision
// --------------------------------------------------

const generateRecoveryPlan = (payment) => {
  const analysis = analyzeFailure(payment);

  return {
    action: analysis.action,
    priority: analysis.priority,
    reason: analysis.reason,
    internalMessage: analysis.message,
    customerMessage: analysis.recoveryMessage,
    retryCount: payment.retryCount || 0,
    amount: payment.amount || 0,
  };
};


// --------------------------------------------------
// Export functions
// --------------------------------------------------

module.exports = {
  analyzeFailure,
  buildRecoveryMessage,
  generateRecoveryPlan,
};