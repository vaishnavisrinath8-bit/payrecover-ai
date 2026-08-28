const nodemailer = require("nodemailer");

// Configured once from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465, false for other ports like 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Sends a recovery email to the customer about a failed payment.
 */
const sendRecoveryEmail = async ({
  to,
  customerName,
  amount,
  orderId,
  paymentId,
  message,
  recoveryLink,
}) => {
  try {
    if (!to) {
      console.error("sendRecoveryEmail skipped: no recipient email provided");
      return;
    }

    const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
    const linkLine = recoveryLink
      ? `\n\nComplete your payment here: ${recoveryLink}`
      : "";

    const textBody = `${greeting}

We noticed your recent payment of ${amount} could not be completed.
${message || "Please retry your payment or contact support."}

Order ID: ${orderId || "N/A"}
Payment ID: ${paymentId || "N/A"}${linkLine}

If you've already resolved this, please disregard this message.`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "Action needed: Complete your payment",
      text: textBody,
    });

    console.log(`Recovery email sent to: ${to}`);
  } catch (error) {
    console.error("sendRecoveryEmail failed:", error.message);
    throw new Error("Failed to send recovery email");
  }
};

/**
 * MOCK SMS implementation — logs instead of actually sending.
 * Structured so a real provider (e.g. Twilio) can be dropped in later
 * without changing anything in webhookController.js.
 */
const sendRecoverySMS = async ({ to, message }) => {
  if (!to) {
    console.error("sendRecoverySMS skipped: no phone number provided");
    return;
  }

  // MOCK/DEMO BEHAVIOR — replace this block with a real SMS provider call later
  console.log(`[MOCK SMS] SMS notification would be sent to: ${to}`);
  console.log(`[MOCK SMS] Message: ${message}`);
};

module.exports = { sendRecoveryEmail, sendRecoverySMS };