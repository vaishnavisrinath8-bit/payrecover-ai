import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
  Clock3,
  ShieldCheck,
  Hash,
  CalendarDays,
  WalletCards,
} from "lucide-react";

import {
  getAllPayments,
  createRecovery,
} from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function formatCurrency(amount, currency = "INR") {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || "INR"} ${value.toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getStatus(payment) {
  return payment?.paymentStatus || payment?.status || "unknown";
}

function getCustomerName(payment) {
  return (
    payment?.customerName ||
    payment?.customer?.name ||
    "Unknown customer"
  );
}

function getCustomerEmail(payment) {
  return (
    payment?.customerEmail ||
    payment?.customer?.email ||
    "No email available"
  );
}

function getCustomerPhone(payment) {
  return (
    payment?.customerPhone ||
    payment?.customer?.phone ||
    payment?.phone ||
    "—"
  );
}

function getPaymentMethod(payment) {
  return (
    payment?.paymentMethod ||
    payment?.method ||
    "Unknown"
  );
}

function getRecoveryStatus(payment) {
  return payment?.recoveryStatus || "Not started";
}

function getPaymentId(payment) {
  return (
    payment?.razorpayPaymentId ||
    payment?.paymentId ||
    payment?._id ||
    ""
  );
}

function getOrderId(payment) {
  return (
    payment?.razorpayOrderId ||
    payment?.orderId ||
    ""
  );
}

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function extractPaymentData(response) {
  if (Array.isArray(response)) {
    return {
      data: response,
      total: response.length,
      pages: 1,
      page: 1,
    };
  }

  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return {
      data: payload,
      total: payload.length,
      pages: 1,
      page: 1,
    };
  }

  if (payload && typeof payload === "object") {
    return {
      data: Array.isArray(payload.data) ? payload.data : [],
      total:
        typeof payload.total === "number"
          ? payload.total
          : Array.isArray(payload.data)
          ? payload.data.length
          : 0,
      pages:
        typeof payload.pages === "number"
          ? payload.pages
          : 1,
      page:
        typeof payload.page === "number"
          ? payload.page
          : 1,
    };
  }

  return {
    data: [],
    total: 0,
    pages: 1,
    page: 1,
  };
}

/* =========================================================
   STATUS BADGE
========================================================= */

function PaymentStatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  if (
    normalized.includes("success") ||
    normalized.includes("paid") ||
    normalized.includes("complete")
  ) {
    return (
      <span className="status-badge status-success">
        <CheckCircle2 size={14} />
        Successful
      </span>
    );
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("cancel") ||
    normalized.includes("unrecover")
  ) {
    return (
      <span className="status-badge status-danger">
        <XCircle size={14} />
        Failed
      </span>
    );
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("process")
  ) {
    return (
      <span className="status-badge status-warning">
        <Clock3 size={14} />
        Pending
      </span>
    );
  }

  return (
    <span className="status-badge status-neutral">
      <Clock3 size={14} />
      {status || "Unknown"}
    </span>
  );
}

/* =========================================================
   RECOVERY BADGE
========================================================= */

function RecoveryStatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  if (
    normalized.includes("recover") ||
    normalized.includes("success") ||
    normalized.includes("complete")
  ) {
    return (
      <span className="status-badge status-success">
        <CheckCircle2 size={14} />
        Recovered
      </span>
    );
  }

  if (
    normalized.includes("progress") ||
    normalized.includes("process") ||
    normalized.includes("sent")
  ) {
    return (
      <span className="status-badge status-warning">
        <Clock3 size={14} />
        In Progress
      </span>
    );
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("unrecover")
  ) {
    return (
      <span className="status-badge status-danger">
        <XCircle size={14} />
        Failed
      </span>
    );
  }

  return (
    <span className="status-badge status-neutral">
      <Clock3 size={14} />
      Not started
    </span>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}) {
  return (
    <div className="payment-detail-row">
      <div className="payment-detail-label">
        <div className="payment-detail-icon">
          <Icon size={16} />
        </div>

        <span>{label}</span>
      </div>

      <strong className={mono ? "mono-text" : ""}>
        {value || "—"}
      </strong>
    </div>
  );
}

/* =========================================================
   PAYMENT DETAILS MODAL
========================================================= */

function PaymentDetailsModal({
  payment,
  onClose,
  onCreateRecovery,
  recoveryLoading,
}) {
  if (!payment) {
    return null;
  }

  const status = getStatus(payment);
  const recoveryStatus = getRecoveryStatus(payment);

  const normalizedStatus = normalizeStatus(status);

  const isFailed =
    normalizedStatus.includes("fail") ||
    normalizedStatus.includes("cancel");

  const hasRecovery =
    Boolean(payment?.recoveryId) ||
    Boolean(payment?.recoveryStatus) ||
    normalizeStatus(recoveryStatus) !== "notstarted";

  const amount = payment?.amount;
  const currency = payment?.currency || "INR";

  const paymentId = getPaymentId(payment);
  const orderId = getOrderId(payment);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-details-title"
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">PAYMENT DETAILS</div>

            <h2 id="payment-details-title">
              Transaction information
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <div className="payment-summary">
          <div className="payment-summary-icon">
            <CreditCard size={25} />
          </div>

          <div className="payment-summary-main">
            <span>Transaction amount</span>

            <strong>
              {formatCurrency(amount, currency)}
            </strong>

            <div className="payment-summary-status">
              <PaymentStatusBadge status={status} />
            </div>
          </div>

          <div className="payment-summary-meta">
            <span>Created</span>

            <strong>
              {formatShortDate(payment?.createdAt)}
            </strong>
          </div>
        </div>

        <div className="payment-detail-sections">
          <section className="detail-section">
            <div className="detail-section-heading">
              <div className="section-icon">
                <User size={17} />
              </div>

              <div>
                <h3>Customer information</h3>
                <p>
                  Customer information associated with this
                  transaction.
                </p>
              </div>
            </div>

            <div className="payment-detail-list">
              <DetailRow
                icon={User}
                label="Customer"
                value={getCustomerName(payment)}
              />

              <DetailRow
                icon={Mail}
                label="Email"
                value={getCustomerEmail(payment)}
              />

              <DetailRow
                icon={Phone}
                label="Phone"
                value={getCustomerPhone(payment)}
              />
            </div>
          </section>

          <section className="detail-section">
            <div className="detail-section-heading">
              <div className="section-icon">
                <WalletCards size={17} />
              </div>

              <div>
                <h3>Payment information</h3>
                <p>
                  Transaction status and payment method.
                </p>
              </div>
            </div>

            <div className="payment-detail-list">
              <DetailRow
                icon={CreditCard}
                label="Amount"
                value={formatCurrency(amount, currency)}
              />

              <DetailRow
                icon={WalletCards}
                label="Payment method"
                value={getPaymentMethod(payment)}
              />

              <DetailRow
                icon={ShieldCheck}
                label="Payment status"
                value={status}
              />

              <DetailRow
                icon={RefreshCw}
                label="Recovery status"
                value={recoveryStatus}
              />

              <DetailRow
                icon={RefreshCw}
                label="Retry count"
                value={
                  payment?.retryCount !== undefined
                    ? String(payment.retryCount)
                    : "0"
                }
              />
            </div>
          </section>

          <section className="detail-section">
            <div className="detail-section-heading">
              <div className="section-icon">
                <Hash size={17} />
              </div>

              <div>
                <h3>Razorpay information</h3>
                <p>
                  Gateway identifiers linked to this payment.
                </p>
              </div>
            </div>

            <div className="payment-detail-list">
              <DetailRow
                icon={Hash}
                label="Payment ID"
                value={paymentId}
                mono
              />

              <DetailRow
                icon={Hash}
                label="Order ID"
                value={orderId}
                mono
              />

              <DetailRow
                icon={CalendarDays}
                label="Created"
                value={formatDate(payment?.createdAt)}
              />

              <DetailRow
                icon={CalendarDays}
                label="Last updated"
                value={formatDate(payment?.updatedAt)}
              />
            </div>
          </section>
        </div>

        {isFailed && !hasRecovery && (
          <div className="recovery-callout">
            <div className="recovery-callout-icon">
              <RefreshCw size={19} />
            </div>

            <div className="recovery-callout-content">
              <strong>Recovery available</strong>

              <p>
                This failed payment can be added to the
                recovery workflow.
              </p>
            </div>

            <button
              type="button"
              className="button button-primary"
              disabled={
                recoveryLoading || !payment?._id
              }
              onClick={() =>
                onCreateRecovery(payment._id)
              }
            >
              {recoveryLoading ? (
                <>
                  <RefreshCw
                    size={17}
                    className="spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <RefreshCw size={17} />
                  Create Recovery
                </>
              )}
            </button>
          </div>
        )}

        {isFailed && hasRecovery && (
          <div className="recovery-callout existing">
            <div className="recovery-callout-icon">
              <ShieldCheck size={19} />
            </div>

            <div className="recovery-callout-content">
              <strong>Recovery workflow exists</strong>

              <p>
                This payment is already associated with a
                recovery workflow.
              </p>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAYMENTS PAGE
========================================================= */

function Payments() {
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [recoveryLoading, setRecoveryLoading] =
    useState(false);

  const [toast, setToast] = useState(null);

  const limit = 10;

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (type, message) => {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  /* =======================================================
     LOAD PAYMENTS
  ======================================================= */

  const loadPayments = async (requestedPage = page, isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAllPayments({
        status: status || undefined,
        method: method || undefined,
        search: search.trim() || undefined,
        page: requestedPage,
        limit,
      });

      const result = extractPaymentData(response);

      setPayments(result.data);
      setTotal(result.total);
      setPages(Math.max(result.pages || 1, 1));

      if (result.page && result.page !== page) {
        setPage(result.page);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);

      setPayments([]);

      setError(
        getErrorMessage(
          err,
          "Unable to load payments. Please make sure the backend is running."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadPayments(1);
  }, []);

  /* =======================================================
     FILTER HANDLING
  ======================================================= */

  const applyFilters = () => {
    setPage(1);
    loadPayments(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setMethod("");
    setPage(1);

    window.setTimeout(() => {
      loadPayments(1);
    }, 0);
  };

  /* =======================================================
     SEARCH ENTER
  ======================================================= */

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      applyFilters();
    }
  };

  /* =======================================================
     PAGE CHANGE
  ======================================================= */

  const handlePageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > pages ||
      newPage === page
    ) {
      return;
    }

    setPage(newPage);
    loadPayments(newPage);
  };

  /* =======================================================
     CREATE RECOVERY
  ======================================================= */

  const handleCreateRecovery = async (paymentId) => {
    if (!paymentId) {
      showToast(
        "error",
        "A valid payment ID is required."
      );
      return;
    }

    const confirmed = window.confirm(
      "Create a recovery workflow for this failed payment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRecoveryLoading(true);

      await createRecovery(paymentId);

      showToast(
        "success",
        "Recovery workflow created successfully."
      );

      setSelectedPayment(null);

      await loadPayments(page, true);
    } catch (err) {
      console.error(
        "Failed to create recovery:",
        err
      );

      showToast(
        "error",
        getErrorMessage(
          err,
          "Unable to create recovery workflow."
        )
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  /* =======================================================
     LOCAL SUMMARY
  ======================================================= */

  const pageSummary = useMemo(() => {
    let successful = 0;
    let failed = 0;
    let pending = 0;
    let totalAmount = 0;

    payments.forEach((payment) => {
      const normalized = normalizeStatus(
        getStatus(payment)
      );

      if (
        normalized.includes("success") ||
        normalized.includes("paid") ||
        normalized.includes("complete")
      ) {
        successful += 1;
      } else if (
        normalized.includes("fail") ||
        normalized.includes("cancel")
      ) {
        failed += 1;
      } else {
        pending += 1;
      }

      const amount = Number(payment?.amount);

      if (Number.isFinite(amount)) {
        totalAmount += amount;
      }
    });

    return {
      successful,
      failed,
      pending,
      totalAmount,
    };
  }, [payments]);

  /* =======================================================
     FILTERED PAYMENTS
  ======================================================= */

  const displayedPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return payments;
    }

    return payments.filter((payment) => {
      const customer = getCustomerName(payment).toLowerCase();
      const email = getCustomerEmail(payment).toLowerCase();
      const paymentId = getPaymentId(payment).toLowerCase();
      const orderId = getOrderId(payment).toLowerCase();

      return (
        customer.includes(query) ||
        email.includes(query) ||
        paymentId.includes(query) ||
        orderId.includes(query)
      );
    });
  }, [payments, search]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="page-container">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{toast.message}</span>

          <button
            type="button"
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="page-header">
        <div>
          <div className="eyebrow">
            PAYMENT OPERATIONS
          </div>

          <h1>Payments</h1>

          <p>
            Monitor transactions, payment status and
            recovery opportunities from one workspace.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() =>
              loadPayments(page, true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ===================================================
          PAGE SUMMARY
      =================================================== */}

      <section className="metric-grid payment-page-metrics">
        <div className="metric-card">
          <div className="metric-icon neutral">
            <CreditCard size={19} />
          </div>

          <div className="metric-content">
            <span>Records on page</span>
            <strong>{payments.length}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon success">
            <CheckCircle2 size={19} />
          </div>

          <div className="metric-content">
            <span>Successful</span>
            <strong>{pageSummary.successful}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon danger">
            <XCircle size={19} />
          </div>

          <div className="metric-content">
            <span>Failed</span>
            <strong>{pageSummary.failed}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warning">
            <Clock3 size={19} />
          </div>

          <div className="metric-content">
            <span>Pending</span>
            <strong>{pageSummary.pending}</strong>
          </div>
        </div>
      </section>

      {/* ===================================================
          MAIN PANEL
      =================================================== */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Payment transactions</h2>

            <p>
              {total} total record
              {total === 1 ? "" : "s"} available
            </p>
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="payment-filters">
          <div className="search-box payment-search">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search customer, email or payment ID..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <select
            className="select-control"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">All statuses</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          <select
            className="select-control"
            value={method}
            onChange={(event) =>
              setMethod(event.target.value)
            }
          >
            <option value="">All methods</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="netbanking">
              Net Banking
            </option>
            <option value="wallet">Wallet</option>
          </select>

          <button
            type="button"
            className="button button-primary"
            onClick={applyFilters}
          >
            <Filter size={17} />
            Apply
          </button>

          {(search || status || method) && (
            <button
              type="button"
              className="button button-ghost"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner" />

            <span>Loading payment transactions...</span>
          </div>
        ) : error ? (
          /* ===============================================
             ERROR
          =============================================== */

          <div className="error-state">
            <div className="empty-state-icon danger">
              <AlertCircle size={26} />
            </div>

            <h3>Unable to load payments</h3>

            <p>{error}</p>

            <button
              type="button"
              className="button button-primary"
              onClick={() => loadPayments(page)}
            >
              <RefreshCw size={17} />
              Try again
            </button>
          </div>
        ) : displayedPayments.length === 0 ? (
          /* ===============================================
             EMPTY
          =============================================== */

          <div className="empty-state">
            <div className="empty-state-icon">
              <CreditCard size={26} />
            </div>

            <h3>
              {total === 0
                ? "No payments found"
                : "No matching payments"}
            </h3>

            <p>
              {total === 0
                ? "Payment transactions from your backend will appear here."
                : "Try changing your search or filters to find the payment you're looking for."}
            </p>

            {(search || status || method) && (
              <button
                type="button"
                className="button button-secondary"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* ===============================================
             TABLE
          =============================================== */

          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Payment ID</th>
                    <th>Order ID</th>
                    <th>Recovery</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedPayments.map(
                    (payment, index) => {
                      const paymentStatus =
                        getStatus(payment);

                      const recoveryStatus =
                        getRecoveryStatus(payment);

                      const paymentId =
                        getPaymentId(payment);

                      const orderId =
                        getOrderId(payment);

                      const failed =
                        normalizeStatus(
                          paymentStatus
                        ).includes("fail") ||
                        normalizeStatus(
                          paymentStatus
                        ).includes("cancel");

                      const recoveryExists =
                        Boolean(payment?.recoveryId) ||
                        Boolean(payment?.recoveryStatus) ||
                        normalizeStatus(
                          recoveryStatus
                        ) !== "notstarted";

                      return (
                        <tr
                          key={
                            payment?._id ||
                            paymentId ||
                            `payment-${index}`
                          }
                        >
                          {/* CUSTOMER */}

                          <td>
                            <div className="customer-cell">
                              <div className="customer-avatar">
                                {getInitials(
                                  getCustomerName(
                                    payment
                                  )
                                )}
                              </div>

                              <div>
                                <strong>
                                  {getCustomerName(
                                    payment
                                  )}
                                </strong>

                                <span>
                                  {getCustomerEmail(
                                    payment
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* AMOUNT */}

                          <td>
                            <strong className="amount-text">
                              {formatCurrency(
                                payment?.amount,
                                payment?.currency ||
                                  "INR"
                              )}
                            </strong>
                          </td>

                          {/* METHOD */}

                          <td>
                            <span className="method-cell">
                              <CreditCard size={15} />

                              {getPaymentMethod(
                                payment
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>
                            <PaymentStatusBadge
                              status={paymentStatus}
                            />
                          </td>

                          {/* PAYMENT ID */}

                          <td>
                            <span className="mono-text">
                              {paymentId
                                ? `${paymentId.slice(
                                    0,
                                    13
                                  )}${
                                    paymentId.length >
                                    13
                                      ? "..."
                                      : ""
                                  }`
                                : "—"}
                            </span>
                          </td>

                          {/* ORDER ID */}

                          <td>
                            <span className="mono-text">
                              {orderId
                                ? `${orderId.slice(
                                    0,
                                    13
                                  )}${
                                    orderId.length >
                                    13
                                      ? "..."
                                      : ""
                                  }`
                                : "—"}
                            </span>
                          </td>

                          {/* RECOVERY */}

                          <td>
                            <RecoveryStatusBadge
                              status={recoveryStatus}
                            />
                          </td>

                          {/* DATE */}

                          <td>
                            <span className="date-text">
                              {formatShortDate(
                                payment?.createdAt
                              )}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-action"
                                title="View payment details"
                                aria-label="View payment details"
                                onClick={() =>
                                  setSelectedPayment(
                                    payment
                                  )
                                }
                              >
                                <Eye size={17} />
                              </button>

                              {failed &&
                                !recoveryExists &&
                                payment?._id && (
                                  <button
                                    type="button"
                                    className="icon-action recovery-action"
                                    title="Create recovery"
                                    aria-label="Create recovery"
                                    onClick={() =>
                                      handleCreateRecovery(
                                        payment._id
                                      )
                                    }
                                    disabled={
                                      recoveryLoading
                                    }
                                  >
                                    <RefreshCw
                                      size={17}
                                    />
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* =============================================
                PAGINATION
            ============================================= */}

            <div className="pagination">
              <div className="pagination-info">
                Showing{" "}
                <strong>
                  {payments.length}
                </strong>{" "}
                of{" "}
                <strong>{total}</strong>{" "}
                payments
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-button"
                  disabled={page <= 1}
                  onClick={() =>
                    handlePageChange(page - 1)
                  }
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="pagination-page">
                  Page <strong>{page}</strong> of{" "}
                  <strong>{pages}</strong>
                </span>

                <button
                  type="button"
                  className="pagination-button"
                  disabled={page >= pages}
                  onClick={() =>
                    handlePageChange(page + 1)
                  }
                  aria-label="Next page"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onCreateRecovery={handleCreateRecovery}
          recoveryLoading={recoveryLoading}
        />
      )}
    </div>
  );
}

export default Payments;