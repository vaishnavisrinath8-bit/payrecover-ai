const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order
 *
 * amount must be in the smallest currency unit.
 * Example:
 * ₹500 = 50000 paise
 */
const createOrder = async (amount, currency = "INR", receipt) => {
  const options = {
    amount,
    currency,
    receipt,
  };

  const order = await razorpay.orders.create(options);

  return order;
};

/**
 * Fetch payment details from Razorpay
 */
const fetchPayment = async (paymentId) => {
  const payment = await razorpay.payments.fetch(paymentId);

  return payment;
};

/**
 * Verify Razorpay payment signature
 */
const verifyPaymentSignature = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
};

/**
 * Verify Razorpay webhook signature
 */
const verifyWebhookSignature = (body, signature) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return generatedSignature === signature;
};

module.exports = {
  createOrder,
  fetchPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
};