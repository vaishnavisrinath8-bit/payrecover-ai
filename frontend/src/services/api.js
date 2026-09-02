import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/* =========================================================
   API ERROR INTERCEPTOR
========================================================= */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "PayRecover API Error:",
      error?.response?.data ||
        error?.message ||
        error
    );

    return Promise.reject(error);
  }
);

/* =========================================================
   PAYMENTS
========================================================= */

/**
 * Get all payments.
 *
 * Backend:
 * GET /api/payments
 *
 * Optional params:
 * - page
 * - limit
 * - status
 * - method
 * - search
 */
export const getAllPayments = async (params = {}) => {
  const response = await api.get("/payments", {
    params,
  });

  return response.data;
};

/**
 * Get paginated payments.
 */
export const getPaymentsPaginated = async (
  page = 1,
  limit = 50,
  filters = {}
) => {
  const response = await api.get("/payments", {
    params: {
      page,
      limit,
      ...filters,
    },
  });

  return response.data;
};

/**
 * Search payments.
 */
export const searchPayments = async (query) => {
  if (!query || !query.trim()) {
    return getAllPayments();
  }

  const response = await api.get("/payments", {
    params: {
      search: query.trim(),
    },
  });

  return response.data;
};

/**
 * Get payment statistics.
 *
 * Backend:
 * GET /api/payments/stats
 */
export const getPaymentStats = async () => {
  const response = await api.get("/payments/stats");

  return response.data;
};

/**
 * Get recent payments.
 *
 * Backend:
 * GET /api/payments/recent
 */
export const getRecentPayments = async (limit = 10) => {
  const response = await api.get("/payments/recent", {
    params: {
      limit,
    },
  });

  return response.data;
};

/**
 * =========================================================
 * GET PAYMENT BY DATABASE ID
 * =========================================================
 *
 * IMPORTANT:
 * The backend does NOT expose:
 *
 * GET /api/payments/:id
 *
 * Therefore we use the existing:
 *
 * GET /api/payments
 *
 * endpoint and locate the requested MongoDB payment record.
 */
export const getPaymentById = async (id) => {
  if (!id) {
    throw new Error("Payment ID is required.");
  }

  const response = await api.get("/payments");

  const payments = response.data?.data || [];

  const payment = payments.find(
    (item) =>
      String(item?._id) === String(id) ||
      String(item?.id) === String(id) ||
      String(item?.razorpayPaymentId) === String(id) ||
      String(item?.razorpayOrderId) === String(id)
  );

  if (!payment) {
    throw new Error("Payment not found.");
  }

  return {
    success: true,
    data: payment,
  };
};

/**
 * =========================================================
 * GET RAZORPAY PAYMENT STATUS
 * =========================================================
 *
 * Backend:
 * GET /api/payments/status/:paymentId
 *
 * IMPORTANT:
 * This endpoint expects a Razorpay payment ID.
 */
export const getPaymentStatus = async (id) => {
  if (!id) {
    throw new Error("Payment ID is required.");
  }

  const response = await api.get(
    `/payments/status/${id}`
  );

  const data = response.data;

  return {
    ...data,

    status:
      data?.payment?.status ??
      data?.data?.paymentStatus ??
      data?.paymentStatus ??
      data?.data?.status ??
      data?.status ??
      null,
  };
};

/**
 * Create Razorpay payment order.
 */
export const createPaymentOrder = async (data) => {
  const response = await api.post(
    "/payments/create-order",
    data
  );

  return response.data;
};

/**
 * Verify Razorpay payment.
 */
export const verifyPayment = async (data) => {
  const response = await api.post(
    "/payments/verify",
    data
  );

  return response.data;
};

/* =========================================================
   RECOVERIES
========================================================= */

/**
 * Get all recoveries.
 *
 * Backend:
 * GET /api/recovery
 */
export const getAllRecoveries = async (
  params = {}
) => {
  const response = await api.get("/recovery", {
    params,
  });

  return response.data;
};

/**
 * Alias used by different frontend pages.
 */
export const getRecoveries = async (
  params = {}
) => {
  return getAllRecoveries(params);
};

/**
 * Get paginated recoveries.
 */
export const getRecoveriesPaginated = async (
  page = 1,
  limit = 50,
  filters = {}
) => {
  const response = await api.get("/recovery", {
    params: {
      page,
      limit,
      ...filters,
    },
  });

  return response.data;
};

/**
 * Search recoveries.
 */
export const searchRecoveries = async (query) => {
  if (!query || !query.trim()) {
    return getAllRecoveries();
  }

  const response = await api.get("/recovery", {
    params: {
      search: query.trim(),
    },
  });

  return response.data;
};

/**
 * Get recovery by ID.
 *
 * Backend:
 * GET /api/recovery/:id
 */
export const getRecoveryById = async (id) => {
  if (!id) {
    throw new Error("Recovery ID is required.");
  }

  const response = await api.get(
    `/recovery/${id}`
  );

  return response.data;
};

/**
 * Get recovery queue.
 *
 * Backend:
 * GET /api/recovery/queue
 */
export const getRecoveryQueue = async (
  params = {}
) => {
  const response = await api.get(
    "/recovery/queue",
    {
      params,
    }
  );

  return response.data;
};

/**
 * Get recovery analytics.
 *
 * Backend:
 * GET /api/recovery/analytics
 */
export const getRecoveryAnalytics = async () => {
  const response = await api.get(
    "/recovery/analytics"
  );

  return response.data;
};

/* =========================================================
   RECOVERY WORKFLOW
========================================================= */

/**
 * Create recovery.
 *
 * Backend:
 * POST /api/recovery/create
 */
export const createRecovery = async (data) => {
  if (!data?.paymentId) {
    throw new Error("paymentId is required.");
  }

  const response = await api.post(
    "/recovery/create",
    data
  );

  return response.data;
};

/**
 * Send recovery.
 *
 * Backend:
 * POST /api/recovery/send
 */
export const sendRecovery = async (data) => {
  if (!data?.recoveryId) {
    throw new Error("recoveryId is required.");
  }

  const response = await api.post(
    "/recovery/send",
    data
  );

  return response.data;
};

/**
 * Retry payment / initiate recovery.
 */
export const retryPayment = async (paymentId) => {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  return createRecovery({
    paymentId,
    recommendedAction: "Retry payment",
  });
};

/**
 * Mark recovery as recovered.
 *
 * Backend:
 * POST /api/recovery/:id/recovered
 */
export const markRecoveryRecovered = async (
  recoveryId,
  recoveredAmount
) => {
  if (!recoveryId) {
    throw new Error("Recovery ID is required.");
  }

  const response = await api.post(
    `/recovery/${recoveryId}/recovered`,
    {
      recoveredAmount,
    }
  );

  return response.data;
};

/**
 * Alias used by frontend pages.
 */
export const markAsRecovered = async (
  recoveryId,
  recoveredAmount
) => {
  return markRecoveryRecovered(
    recoveryId,
    recoveredAmount
  );
};

/**
 * Mark recovery as unrecoverable.
 *
 * Backend:
 * POST /api/recovery/:id/unrecoverable
 */
export const markRecoveryUnrecoverable = async (
  recoveryId,
  reason
) => {
  if (!recoveryId) {
    throw new Error("Recovery ID is required.");
  }

  const response = await api.post(
    `/recovery/${recoveryId}/unrecoverable`,
    {
      reason:
        reason ||
        "Recovery attempts exhausted.",
    }
  );

  return response.data;
};

/**
 * Alias used by frontend pages.
 */
export const markAsUnrecoverable = async (
  recoveryId,
  reason
) => {
  return markRecoveryUnrecoverable(
    recoveryId,
    reason
  );
};

/* =========================================================
   NOTIFICATIONS
========================================================= */

/**
 * Get notifications.
 *
 * Uses existing backend endpoint when available.
 *
 * If the endpoint is unavailable, return an empty
 * collection instead of breaking the application.
 */
export const getNotifications = async () => {
  try {
    const response = await api.get(
      "/notifications"
    );

    return response.data;
  } catch (error) {
    console.warn(
      "Notifications API unavailable. Using empty notification state."
    );

    return {
      success: true,
      data: [],
    };
  }
};

/* =========================================================
   ACCOUNT
========================================================= */

/**
 * Account information.
 *
 * The Account page also maintains local state/localStorage
 * where appropriate.
 */
export const getAccount = async () => {
  try {
    const response = await api.get(
      "/account"
    );

    return response.data;
  } catch (error) {
    console.warn(
      "Account API unavailable. Using local account state."
    );

    return {
      success: true,
      data: null,
    };
  }
};

/* =========================================================
   SETTINGS
========================================================= */

/**
 * Settings.
 *
 * The Settings page can maintain settings locally while
 * still supporting the backend endpoint when available.
 */
export const getSettings = async () => {
  try {
    const response = await api.get(
      "/settings"
    );

    return response.data;
  } catch (error) {
    console.warn(
      "Settings API unavailable. Using local settings state."
    );

    return {
      success: true,
      data: null,
    };
  }
};

/* =========================================================
   HEALTH CHECK
========================================================= */

/**
 * Backend health check.
 *
 * Backend:
 * GET /api/health
 */
export const checkHealth = async () => {
  const response = await api.get(
    "/health"
  );

  return response.data;
};

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default api;