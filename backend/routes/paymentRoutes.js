const express = require("express");

const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getPayments,
  getPaymentStats,
  getRecentPayments,
} = require("../controllers/paymentController");

/**
 * ============================================================
 * DASHBOARD / DATA ROUTES
 * ============================================================
 */

/**
 * Get payment statistics
 *
 * GET /api/payments/stats
 */
router.get(
  "/stats",
  getPaymentStats
);

/**
 * Get recent payments
 *
 * GET /api/payments/recent
 */
router.get(
  "/recent",
  getRecentPayments
);

/**
 * Get all payments
 *
 * GET /api/payments
 *
 * Optional:
 * ?status=failed
 * ?method=upi
 * ?search=Rahul
 * ?page=1
 * ?limit=50
 */
router.get(
  "/",
  getPayments
);


/**
 * ============================================================
 * RAZORPAY ROUTES
 * ============================================================
 */

/**
 * Create Razorpay order
 *
 * POST /api/payments/create-order
 */
router.post(
  "/create-order",
  createPaymentOrder
);

/**
 * Verify Razorpay payment
 *
 * POST /api/payments/verify
 */
router.post(
  "/verify",
  verifyPayment
);

/**
 * Get Razorpay payment status
 *
 * GET /api/payments/status/:paymentId
 */
router.get(
  "/status/:paymentId",
  getPaymentStatus
);


module.exports = router;