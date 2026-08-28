const Payment = require("../models/Payment");
const Recovery = require("../models/Recovery");

const { analyzeFailure } = require("./recoveryEngine");
const { generateRecoveryMessage } = require("./aiRecoveryService");
const { sendEmail } = require("./emailService");
const {
  paymentRecoveryTemplate,
} = require("./emailTemplates");


// ============================================
// Create Recovery
// ============================================

const createRecovery = async (paymentId) => {
  try {
    // Find payment
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Recovery is only for failed payments
    if (payment.paymentStatus !== "failed") {
      throw new Error(
        "Recovery can only be created for failed payments"
      );
    }

    // Check if recovery already exists
    const existingRecovery = await Recovery.findOne({
      paymentId: payment._id,
      status: {
        $in: ["created", "pending", "email_sent"],
      },
    });

    if (existingRecovery) {
      return existingRecovery;
    }

    // ============================================
    // Analyze payment failure
    // ============================================

    const analysis = analyzeFailure(payment);

    // ============================================
    // Generate recovery message
    // ============================================

    const aiResult = generateRecoveryMessage(payment);

    // ============================================
    // Create Recovery record
    // ============================================

    const recovery = await Recovery.create({
      paymentId: payment._id,

      customerEmail: payment.customerEmail,

      customerName: payment.customerName,

      reason:
        analysis.reason ||
        payment.failureReason ||
        "Payment failed",

      status: "created",

      recoveryMessage: aiResult.message,

      paymentLink: aiResult.paymentLink,

      attempts: 0,

      lastAttemptAt: null,
    });

    // ============================================
    // Update Payment
    // ============================================

    payment.recoveryStatus = "in_progress";

    payment.aiRecommendation = {
      action: analysis.action || null,

      reason:
        analysis.reason ||
        payment.failureReason ||
        null,

      message: aiResult.message || null,
    };

    payment.recoveryPriority =
      analysis.priority || null;

    await payment.save();

    return recovery;

  } catch (error) {
    console.error("Create recovery error:", error.message);

    throw error;
  }
};


// ============================================
// Send Recovery Email
// ============================================

const sendRecoveryEmail = async (recoveryId) => {
  try {
    // Find recovery
    const recovery = await Recovery.findById(recoveryId);

    if (!recovery) {
      throw new Error("Recovery record not found");
    }

    // ============================================
    // Create email template
    // ============================================

    const payment = await Payment.findById(
      recovery.paymentId
    );

    if (!payment) {
      throw new Error("Payment not found");
    }

    const email = paymentRecoveryTemplate({
      customerName: recovery.customerName,

      amount: payment.amount,

      currency: payment.currency,

      recoveryMessage: recovery.recoveryMessage,

      paymentLink: recovery.paymentLink,
    });

    // ============================================
    // Send email
    // ============================================

    const result = await sendEmail({
      to: recovery.customerEmail,

      subject: email.subject,

      text: email.text,

      html: email.html,
    });

    // ============================================
    // Email failed
    // ============================================

    if (!result.success) {
      recovery.status = "failed";

      await recovery.save();

      throw new Error(
        result.error || "Failed to send recovery email"
      );
    }

    // ============================================
    // Update Recovery
    // ============================================

    recovery.status = "email_sent";

    recovery.attempts += 1;

    recovery.lastAttemptAt = new Date();

    await recovery.save();

    return {
      success: true,

      message: "Recovery email sent successfully",

      messageId: result.messageId,

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


// ============================================
// Get Recovery
// ============================================

const getRecoveryById = async (recoveryId) => {
  const recovery = await Recovery.findById(
    recoveryId
  ).populate("paymentId");

  if (!recovery) {
    throw new Error("Recovery record not found");
  }

  return recovery;
};


// ============================================
// Get All Recoveries
// ============================================

const getAllRecoveries = async () => {
  return await Recovery.find()
    .populate("paymentId")
    .sort({ createdAt: -1 });
};


// ============================================
// Export
// ============================================

module.exports = {
  createRecovery,
  sendRecoveryEmail,
  getRecoveryById,
  getAllRecoveries,
};