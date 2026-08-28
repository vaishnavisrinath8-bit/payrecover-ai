import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

const unwrap = (response) => response.data;

export const getPaymentStats = async () => {
  const response = await api.get("/api/payments/stats");
  return unwrap(response);
};

export const getRecentPayments = async (limit = 5) => {
  const response = await api.get("/api/payments/recent", {
    params: { limit },
  });
  return unwrap(response);
};

export const getAllPayments = async ({
  status = "",
  method = "",
  search = "",
  page = 1,
  limit = 50,
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (status) params.status = status;
  if (method) params.method = method;
  if (search) params.search = search;

  const response = await api.get("/api/payments", { params });
  return unwrap(response);
};

export const createPaymentOrder = async (payload) => {
  const response = await api.post(
    "/api/payments/create-order",
    payload
  );
  return unwrap(response);
};

export const verifyPayment = async (payload) => {
  const response = await api.post(
    "/api/payments/verify",
    payload
  );
  return unwrap(response);
};

export const getPaymentStatus = async (paymentId) => {
  const response = await api.get(
    `/api/payments/status/${paymentId}`
  );
  return unwrap(response);
};

export const getAllRecoveries = async () => {
  const response = await api.get("/api/recovery");
  return unwrap(response);
};

export const getRecoveryById = async (id) => {
  const response = await api.get(`/api/recovery/${id}`);
  return unwrap(response);
};

export const createRecovery = async (paymentId) => {
  const response = await api.post("/api/recovery/create", {
    paymentId,
  });
  return unwrap(response);
};

export const sendRecoveryEmail = async (recoveryId) => {
  const response = await api.post("/api/recovery/send", {
    recoveryId,
  });
  return unwrap(response);
};

export default api;