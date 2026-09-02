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

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

router.get(
  "/stats",
  getPaymentStats
);

router.get(
  "/recent",
  getRecentPayments
);

/*
|--------------------------------------------------------------------------
| ALL PAYMENTS
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getPayments
);

/*
|--------------------------------------------------------------------------
| RAZORPAY
|--------------------------------------------------------------------------
*/

router.post(
  "/create-order",
  createPaymentOrder
);

router.post(
  "/verify",
  verifyPayment
);

router.get(
  "/status/:paymentId",
  getPaymentStatus
);

module.exports = router;