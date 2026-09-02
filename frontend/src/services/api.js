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

export const getAllPayments = async (params = {}) => {
  const response = await api.get("/payments", {
    params,
  });

  return response.data;
};

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

export const getPaymentStats = async () => {
  const response = await api.get("/payments/stats");

  return response.data;
};

export const getRecentPayments = async (limit = 10) => {
  const response = await api.get("/payments/recent", {
    params: {
      limit,
    },
  });

  return response.data;
};

export const getPaymentById = async (id) => {
  if (!id) {
    throw new Error("Payment ID is required.");
  }

  const response = await api.get(`/payments/${id}`);

  return response.data;
};

export const getPaymentStatus = async (id) => {
  if (!id) {
    throw new Error("Payment ID is required.");
  }

  const response = await api.get(`/payments/${id}`);

  const data = response.data;

  return {
    ...data,
    status:
      data?.data?.paymentStatus ??
      data?.paymentStatus ??
      data?.data?.status ??
      data?.status ??
      null,
  };
};

export const createPaymentOrder = async (data) => {
  const response = await api.post(
    "/payments/create-order",
    data
  );

  return response.data;
};

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

export const getAllRecoveries = async (params = {}) => {
  const response = await api.get("/recovery", {
    params,
  });

  return response.data;
};

export const getRecoveries = async (params = {}) => {
  return getAllRecoveries(params);
};

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

export const getRecoveryById = async (id) => {
  if (!id) {
    throw new Error("Recovery ID is required.");
  }

  const response = await api.get(
    `/recovery/${id}`
  );

  return response.data;
};

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

export const getRecoveryAnalytics = async () => {
  const response = await api.get(
    "/recovery/analytics"
  );

  return response.data;
};


/* =========================================================
   RECOVERY WORKFLOW
========================================================= */

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


export const retryPayment = async (paymentId) => {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  return createRecovery({
    paymentId,
    recommendedAction: "Retry payment",
  });
};


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


export const markAsRecovered = async (
  recoveryId,
  recoveredAmount
) => {
  return markRecoveryRecovered(
    recoveryId,
    recoveredAmount
  );
};


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
   LOCAL ACCOUNT / SETTINGS
========================================================= */

export const getNotifications = async () => {
  try {
    const response = await api.get(
      "/notifications"
    );

    return response.data;
  } catch {
    return {
      success: true,
      data: [],
    };
  }
};


export const getAccount = async () => {
  try {
    const response = await api.get(
      "/account"
    );

    return response.data;
  } catch {
    return {
      success: true,
      data: null,
    };
  }
};


export const getSettings = async () => {
  try {
    const response = await api.get(
      "/settings"
    );

    return response.data;
  } catch {
    return {
      success: true,
      data: null,
    };
  }
};


export const checkHealth = async () => {
  const response = await api.get(
    "/health"
  );

  return response.data;
};


export default api;