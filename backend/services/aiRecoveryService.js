// ============================================
// PayRecover AI - AI Recovery Service
// ============================================

const generateRecoveryMessage = (payment) => {
  const {
    customerName = "Customer",
    amount = 0,
    currency = "INR",
    failureReason = "",
    failureCode = "",
    paymentMethod = "",
    retryCount = 0,
  } = payment;

  const reason = String(failureReason).toLowerCase();
  const method = String(paymentMethod).toLowerCase();

  let message;

  // Card failure
  if (
    reason.includes("card") ||
    reason.includes("declined") ||
    reason.includes("insufficient")
  ) {
    message =
      `Hi ${customerName}, your ${currency} ${amount} payment ` +
      `could not be completed. Please check your card details ` +
      `or try another payment method.`;
  }

  // UPI failure
  else if (
    method.includes("upi") ||
    reason.includes("upi")
  ) {
    message =
      `Hi ${customerName}, your ${currency} ${amount} payment ` +
      `could not be completed through UPI. Please try again ` +
      `or use another payment method.`;
  }

  // Network / technical failure
  else if (
    reason.includes("network") ||
    reason.includes("timeout") ||
    reason.includes("timed out") ||
    reason.includes("technical") ||
    reason.includes("server")
  ) {
    message =
      `Hi ${customerName}, we couldn't complete your ` +
      `${currency} ${amount} payment because of a temporary ` +
      `technical issue. Please try again after a few moments.`;
  }

  // Multiple retries
  else if (retryCount >= 3) {
    message =
      `Hi ${customerName}, we noticed that your ` +
      `${currency} ${amount} payment has failed several times. ` +
      `Please try a different payment method or contact support ` +
      `for assistance.`;
  }

  // Default
  else {
    message =
      `Hi ${customerName}, your ${currency} ${amount} payment ` +
      `could not be completed. Please try the payment again ` +
      `using another payment method.`;
  }

  return {
    message,
    paymentLink: null,
    generatedBy: "rule-based-ai",
    failureCode,
  };
};


// ============================================
// Export
// ============================================

module.exports = {
  generateRecoveryMessage,
};
