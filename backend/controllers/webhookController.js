const crypto = require("crypto");

const Payment = require("../models/Payment");
const Recovery = require("../models/Recovery");

const {
  verifyWebhookSignature,
} = require("../services/razorpayService");


// ============================================
// Razorpay Webhook Controller
// ============================================

const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature is missing",
      });
    }

    // req.body is a Buffer because webhook route
    // must use raw body for signature verification.
    const rawBody = req.body;

    const isValid = verifyWebhookSignature(
      rawBody,
      signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = JSON.parse(rawBody.toString());

    console.log("Razorpay webhook received:", event.event);

    // ============================================
    // Payment Captured
    // ============================================

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;

      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id;

      const payment = await Payment.findOne({
        razorpayOrderId,
      });

      if (payment) {
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.paymentStatus = "success";
        payment.recoveryStatus = "recovered";

        payment.paymentMethod =
          paymentEntity.method || payment.paymentMethod;

        payment.failureReason = null;
        payment.failureCode = null;

        await payment.save();

        // Mark related recovery as recovered
        await Recovery.updateMany(
          {
            paymentId: payment._id,
          },
          {
            $set: {
              status: "recovered",
            },
          }
        );

        console.log(
          `Payment ${razorpayPaymentId} marked as successful`
        );
      }
    }

    // ============================================
    // Payment Failed
    // ============================================

    else if (event.event === "payment.failed") {
      const paymentEntity = event.payload.payment.entity;

      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id;

      const payment = await Payment.findOne({
        razorpayOrderId,
      });

      if (payment) {
        payment.razorpayPaymentId = razorpayPaymentId;

        payment.paymentStatus = "failed";

        payment.failureReason =
          paymentEntity.error_description ||
          paymentEntity.error_reason ||
          "Payment failed";

        payment.failureCode =
          paymentEntity.error_code || null;

        payment.paymentMethod =
          paymentEntity.method || null;

        payment.retryCount += 1;

        await payment.save();

        console.log(
          `Payment ${razorpayPaymentId} marked as failed`
        );
      }
    }

    // ============================================
    // Order Paid
    // ============================================

    else if (event.event === "order.paid") {
      const orderEntity = event.payload.order.entity;

      const razorpayOrderId = orderEntity.id;

      const payment = await Payment.findOne({
        razorpayOrderId,
      });

      if (payment) {
        payment.paymentStatus = "success";
        payment.recoveryStatus = "recovered";

        await payment.save();

        await Recovery.updateMany(
          {
            paymentId: payment._id,
          },
          {
            $set: {
              status: "recovered",
            },
          }
        );

        console.log(
          `Order ${razorpayOrderId} marked as paid`
        );
      }
    }

    // ============================================
    // Send response to Razorpay
    // ============================================

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });

  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};


module.exports = {
  handleRazorpayWebhook,
};