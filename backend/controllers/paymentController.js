const Payment = require("../models/Payment");

const {
  createOrder,
  fetchPayment,
  verifyPaymentSignature,
} = require("../services/razorpayService");

const {
  createRecovery,
} = require("../services/recoveryService");

/**
 * Create Razorpay order
 */
const createPaymentOrder = async (req, res) => {
  try {
    const {
      amount,
      currency,
      receipt,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    if (!customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: "Customer name and email are required",
      });
    }

    const amountInPaise = Math.round(
      Number(amount) * 100
    );

    const order = await createOrder(
      amountInPaise,
      currency || "INR",
      receipt || `receipt_${Date.now()}`
    );

    const payment = await Payment.create({
      razorpayOrderId: order.id,
      amount: Number(amount),
      currency: currency || "INR",
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,

      paymentStatus: "created",

      retryCount: 0,

      recoveryStatus: "not_started",
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",

      paymentId: payment._id,

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      },
    });
  } catch (error) {
    console.error(
      "Create payment order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay payment
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing payment verification details",
        status: "failed",
      });
    }

    // Verify Razorpay signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
        status: "failed",
      });
    }

    // Fetch payment from Razorpay
    const razorpayPayment =
      await fetchPayment(
        razorpay_payment_id
      );

    // Determine status
    let paymentStatus =
      razorpayPayment.status;

    if (
      razorpayPayment.status === "captured"
    ) {
      paymentStatus = "success";
    }

    // Update payment in MongoDB
    const payment =
      await Payment.findOneAndUpdate(
        {
          razorpayOrderId:
            razorpay_order_id,
        },
        {
          razorpayPaymentId:
            razorpay_payment_id,

          paymentStatus,

          paymentMethod:
            razorpayPayment.method,
        },
        {
          new: true,
        }
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found",
      });
    }

    // ==========================================
    // AUTOMATIC RECOVERY
    // ==========================================

    let recovery = null;

    if (paymentStatus === "failed") {
      try {
        recovery =
          await createRecovery(
            payment._id
          );

        console.log(
          "Recovery automatically created:",
          recovery._id
        );
      } catch (recoveryError) {
        console.error(
          "Automatic recovery creation failed:",
          recoveryError.message
        );

        // Payment itself remains recorded.
        // Recovery failure should not make
        // payment verification fail.
      }
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        paymentStatus === "failed"
          ? "Payment failed and recovery workflow created"
          : "Payment verified successfully",

      status:
        razorpayPayment.status,

      payment: {
        id: razorpayPayment.id,

        orderId:
          razorpayPayment.order_id,

        amount:
          razorpayPayment.amount,

        currency:
          razorpayPayment.currency,

        status:
          razorpayPayment.status,

        method:
          razorpayPayment.method,

        databasePaymentId:
          payment._id,
      },

      recovery: recovery
        ? {
            id: recovery._id,
            status: recovery.status,
            customerEmail:
              recovery.customerEmail,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Payment verification failed",
      error: error.message,
    });
  }
};

/**
 * Get payment status from Razorpay
 */
const getPaymentStatus = async (
  req,
  res
) => {
  try {
    const { paymentId } =
      req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message:
          "Payment ID is required",
      });
    }

    const payment =
      await fetchPayment(
        paymentId
      );

    return res.status(200).json({
      success: true,

      payment: {
        id: payment.id,

        orderId:
          payment.order_id,

        amount:
          payment.amount,

        currency:
          payment.currency,

        status:
          payment.status,

        method:
          payment.method,

        captured:
          payment.captured,
      },
    });
  } catch (error) {
    console.error(
      "Get payment status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch payment status",

      error: error.message,
    });
  }
};

/**
 * Get all payments
 *
 * GET /api/payments
 */
const getPayments = async (
  req,
  res
) => {
  try {
    const {
      status,
      method,
      search,
      limit = 50,
      page = 1,
    } = req.query;

    const query = {};

    if (status) {
      query.paymentStatus = status;
    }

    if (method) {
      query.paymentMethod = method;
    }

    if (search) {
      query.$or = [
        {
          customerName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          customerEmail: {
            $regex: search,
            $options: "i",
          },
        },
        {
          razorpayPaymentId: {
            $regex: search,
            $options: "i",
          },
        },
        {
          razorpayOrderId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const pageNumber =
      Math.max(
        Number(page),
        1
      );

    const limitNumber =
      Math.min(
        Math.max(
          Number(limit),
          1
        ),
        100
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const [
      payments,
      total,
    ] = await Promise.all([
      Payment.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      Payment.countDocuments(
        query
      ),
    ]);

    return res.status(200).json({
      success: true,

      count:
        payments.length,

      total,

      page:
        pageNumber,

      pages:
        Math.ceil(
          total /
            limitNumber
        ),

      data:
        payments,
    });
  } catch (error) {
    console.error(
      "Get payments error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch payments",

      error:
        error.message,
    });
  }
};

/**
 * Get dashboard statistics
 *
 * GET /api/payments/stats
 */
const getPaymentStats = async (
  req,
  res
) => {
  try {
    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      createdPayments,
      recoveredPayments,
      inProgressRecoveries,
      unrecoverablePayments,
    ] = await Promise.all([
      Payment.countDocuments(),

      Payment.countDocuments({
        paymentStatus:
          "success",
      }),

      Payment.countDocuments({
        paymentStatus:
          "failed",
      }),

      Payment.countDocuments({
        paymentStatus:
          "pending",
      }),

      Payment.countDocuments({
        paymentStatus:
          "created",
      }),

      Payment.countDocuments({
        recoveryStatus:
          "recovered",
      }),

      Payment.countDocuments({
        recoveryStatus:
          "in_progress",
      }),

      Payment.countDocuments({
        recoveryStatus:
          "unrecoverable",
      }),
    ]);

    const revenueResult =
      await Payment.aggregate([
        {
          $match: {
            paymentStatus:
              "success",
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const recoveredRevenueResult =
      await Payment.aggregate([
        {
          $match: {
            recoveryStatus:
              "recovered",
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const totalRevenue =
      revenueResult[0]
        ?.total || 0;

    const recoveredRevenue =
      recoveredRevenueResult[0]
        ?.total || 0;

    const successRate =
      totalPayments > 0
        ? (
            (successfulPayments /
              totalPayments) *
            100
          ).toFixed(1)
        : 0;

    const recoveryBase =
      failedPayments;

    const recoveryRate =
      recoveryBase > 0
        ? (
            (recoveredPayments /
              recoveryBase) *
            100
          ).toFixed(1)
        : 0;

    return res.status(200).json({
      success: true,

      data: {
        totalPayments,

        successfulPayments,

        failedPayments,

        pendingPayments,

        createdPayments,

        successRate:
          Number(
            successRate
          ),

        recoveredPayments,

        inProgressRecoveries,

        unrecoverablePayments,

        recoveryRate:
          Number(
            recoveryRate
          ),

        totalRevenue,

        recoveredRevenue,
      },
    });
  } catch (error) {
    console.error(
      "Get payment statistics error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to calculate payment statistics",

      error:
        error.message,
    });
  }
};

/**
 * Get recent payments
 *
 * GET /api/payments/recent
 */
const getRecentPayments =
  async (req, res) => {
    try {
      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit
            ) || 5,
            1
          ),
          20
        );

      const payments =
        await Payment.find()
          .sort({
            createdAt: -1,
          })
          .limit(limit);

      return res.status(200).json({
        success: true,

        count:
          payments.length,

        data:
          payments,
      });
    } catch (error) {
      console.error(
        "Get recent payments error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch recent payments",

        error:
          error.message,
      });
    }
  };

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,

  getPayments,
  getPaymentStats,
  getRecentPayments,
};