import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  Plus,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import {
  getAllRecoveries,
  getRecoveryById,
  createRecovery,
  sendRecoveryEmail,
} from "../services/api";

function formatCurrency(amount, currency = "INR") {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency || "INR"} ${numericAmount.toFixed(2)}`;
  }
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

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

function getRecoveryId(recovery) {
  return recovery?._id || recovery?.id || "";
}

function getPaymentId(recovery) {
  if (!recovery) return "";

  if (typeof recovery.paymentId === "string") {
    return recovery.paymentId;
  }

  if (recovery.paymentId?._id) {
    return recovery.paymentId._id;
  }

  if (recovery.payment?._id) {
    return recovery.payment._id;
  }

  if (recovery.payment) {
    return String(recovery.payment);
  }

  return "";
}

function getCustomerName(recovery) {
  return (
    recovery?.customerName ||
    recovery?.payment?.customerName ||
    recovery?.customer?.name ||
    recovery?.paymentId?.customerName ||
    "Unknown customer"
  );
}

function getCustomerEmail(recovery) {
  return (
    recovery?.customerEmail ||
    recovery?.payment?.customerEmail ||
    recovery?.customer?.email ||
    recovery?.paymentId?.customerEmail ||
    "No email available"
  );
}

function getAmount(recovery) {
  if (recovery?.amount !== undefined) {
    return recovery.amount;
  }

  if (recovery?.payment?.amount !== undefined) {
    return recovery.payment.amount;
  }

  if (recovery?.paymentId?.amount !== undefined) {
    return recovery.paymentId.amount;
  }

  return null;
}

function getCurrency(recovery) {
  return (
    recovery?.currency ||
    recovery?.payment?.currency ||
    recovery?.paymentId?.currency ||
    "INR"
  );
}

function getStatus(recovery) {
  return (
    recovery?.status ||
    recovery?.recoveryStatus ||
    recovery?.state ||
    "pending"
  );
}

function normalizeStatus(status) {
  return String(status || "pending")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function StatusBadge({ status }) {
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
    normalized.includes("fail") ||
    normalized.includes("unrecover") ||
    normalized.includes("cancel")
  ) {
    return (
      <span className="status-badge status-danger">
        <XCircle size={14} />
        Failed
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

  return (
    <span className="status-badge status-neutral">
      <Clock3 size={14} />
      Pending
    </span>
  );
}

function getInitials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function extractData(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function extractSingleData(response) {
  if (response?.data?.data) {
    return response.data.data;
  }

  if (response?.data) {
    return response.data;
  }

  return response;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function Recoveries() {
  const [recoveries, setRecoveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedRecovery, setSelectedRecovery] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState("");

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadRecoveries = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAllRecoveries();
      const data = extractData(response);

      setRecoveries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load recoveries:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to load recovery records. Please make sure the backend is running."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecoveries();
  }, []);

  const filteredRecoveries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recoveries.filter((recovery) => {
      const name = getCustomerName(recovery).toLowerCase();
      const email = getCustomerEmail(recovery).toLowerCase();
      const paymentId = getPaymentId(recovery).toLowerCase();
      const recoveryId = getRecoveryId(recovery).toLowerCase();
      const status = normalizeStatus(getStatus(recovery));

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        paymentId.includes(query) ||
        recoveryId.includes(query);

      let matchesStatus = true;

      if (statusFilter === "pending") {
        matchesStatus =
          !status.includes("recover") &&
          !status.includes("success") &&
          !status.includes("fail") &&
          !status.includes("unrecover") &&
          !status.includes("progress");
      }

      if (statusFilter === "progress") {
        matchesStatus =
          status.includes("progress") ||
          status.includes("process") ||
          status.includes("sent");
      }

      if (statusFilter === "recovered") {
        matchesStatus =
          status.includes("recover") ||
          status.includes("success") ||
          status.includes("complete");
      }

      if (statusFilter === "failed") {
        matchesStatus =
          status.includes("fail") ||
          status.includes("unrecover") ||
          status.includes("cancel");
      }

      return matchesSearch && matchesStatus;
    });
  }, [recoveries, search, statusFilter]);

  const recoveryMetrics = useMemo(() => {
    let recovered = 0;
    let inProgress = 0;
    let failed = 0;
    let pending = 0;
    let recoveredAmount = 0;

    recoveries.forEach((recovery) => {
      const status = normalizeStatus(getStatus(recovery));

      if (
        status.includes("recover") ||
        status.includes("success") ||
        status.includes("complete")
      ) {
        recovered += 1;

        const amount = Number(getAmount(recovery));

        if (Number.isFinite(amount)) {
          recoveredAmount += amount;
        }
      } else if (
        status.includes("progress") ||
        status.includes("process") ||
        status.includes("sent")
      ) {
        inProgress += 1;
      } else if (
        status.includes("fail") ||
        status.includes("unrecover") ||
        status.includes("cancel")
      ) {
        failed += 1;
      } else {
        pending += 1;
      }
    });

    return {
      total: recoveries.length,
      recovered,
      inProgress,
      failed,
      pending,
      recoveredAmount,
    };
  }, [recoveries]);

  const handleViewRecovery = async (recovery) => {
    const recoveryId = getRecoveryId(recovery);

    if (!recoveryId) {
      showToast("error", "This recovery does not have a valid recovery ID.");
      return;
    }

    try {
      setDetailsLoading(true);
      setSelectedRecovery(recovery);

      const response = await getRecoveryById(recoveryId);
      const details = extractSingleData(response);

      if (details && typeof details === "object") {
        setSelectedRecovery(details);
      }
    } catch (err) {
      console.error("Failed to load recovery details:", err);

      showToast(
        "error",
        getErrorMessage(err, "Unable to load recovery details.")
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateRecovery = async (paymentId) => {
    if (!paymentId) {
      showToast(
        "error",
        "A valid payment ID is required to create a recovery."
      );
      return;
    }

    try {
      setActionLoading(`create-${paymentId}`);

      await createRecovery(paymentId);

      showToast("success", "Recovery workflow created successfully.");

      await loadRecoveries(true);
    } catch (err) {
      console.error("Failed to create recovery:", err);

      showToast(
        "error",
        getErrorMessage(err, "Unable to create recovery workflow.")
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleSendRecovery = async (recoveryId) => {
    if (!recoveryId) {
      showToast("error", "A valid recovery ID is required.");
      return;
    }

    const confirmed = window.confirm(
      "Send the recovery email for this payment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`send-${recoveryId}`);

      await sendRecoveryEmail(recoveryId);

      showToast("success", "Recovery email request sent successfully.");

      await loadRecoveries(true);

      if (selectedRecovery) {
        try {
          const response = await getRecoveryById(recoveryId);
          const details = extractSingleData(response);

          if (details && typeof details === "object") {
            setSelectedRecovery(details);
          }
        } catch {
          // The main action succeeded, so don't replace the success message.
        }
      }
    } catch (err) {
      console.error("Failed to send recovery email:", err);

      showToast(
        "error",
        getErrorMessage(err, "Unable to send the recovery email.")
      );
    } finally {
      setActionLoading("");
    }
  };

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

      <div className="page-header">
        <div>
          <div className="eyebrow">PAYMENT RECOVERY</div>

          <h1>Recoveries</h1>

          <p>
            Monitor failed-payment recovery workflows and manage customer
            recovery communication.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => loadRecoveries(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      <section className="metric-grid recovery-metrics">
        <div className="metric-card">
          <div className="metric-icon neutral">
            <RefreshCw size={19} />
          </div>

          <div className="metric-content">
            <span>Total Recoveries</span>
            <strong>{recoveryMetrics.total}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon success">
            <CheckCircle2 size={19} />
          </div>

          <div className="metric-content">
            <span>Recovered</span>
            <strong>{recoveryMetrics.recovered}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warning">
            <Clock3 size={19} />
          </div>

          <div className="metric-content">
            <span>In Progress</span>
            <strong>{recoveryMetrics.inProgress}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon danger">
            <XCircle size={19} />
          </div>

          <div className="metric-content">
            <span>Failed / Unrecoverable</span>
            <strong>{recoveryMetrics.failed}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Recovery workflows</h2>
            <p>
              {filteredRecoveries.length} record
              {filteredRecoveries.length === 1 ? "" : "s"} displayed
            </p>
          </div>

          <div className="table-toolbar">
            <div className="search-box">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search customer, email or payment ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="select-control"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="progress">In progress</option>
              <option value="recovered">Recovered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner" />
            <span>Loading recovery records...</span>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="empty-state-icon danger">
              <AlertCircle size={25} />
            </div>

            <h3>Unable to load recoveries</h3>

            <p>{error}</p>

            <button
              type="button"
              className="button button-primary"
              onClick={() => loadRecoveries()}
            >
              <RefreshCw size={17} />
              Try again
            </button>
          </div>
        ) : filteredRecoveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <RefreshCw size={25} />
            </div>

            <h3>
              {recoveries.length === 0
                ? "No recovery workflows yet"
                : "No matching recoveries"}
            </h3>

            <p>
              {recoveries.length === 0
                ? "Recovery workflows created from failed payments will appear here."
                : "Try changing your search or status filter."}
            </p>

            {recoveries.length > 0 && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Created</th>
                  <th>Last Activity</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecoveries.map((recovery) => {
                  const recoveryId = getRecoveryId(recovery);
                  const paymentId = getPaymentId(recovery);
                  const name = getCustomerName(recovery);
                  const email = getCustomerEmail(recovery);
                  const amount = getAmount(recovery);
                  const currency = getCurrency(recovery);
                  const status = getStatus(recovery);

                  const attempts =
                    recovery?.retryCount ??
                    recovery?.attemptCount ??
                    recovery?.attempts ??
                    recovery?.retries ??
                    0;

                  const createdAt =
                    recovery?.createdAt || recovery?.created_at;

                  const lastActivity =
                    recovery?.updatedAt ||
                    recovery?.lastActivity ||
                    recovery?.lastAttemptAt ||
                    createdAt;

                  return (
                    <tr key={recoveryId || paymentId || Math.random()}>
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            {getInitials(name)}
                          </div>

                          <div>
                            <strong>{name}</strong>
                            <span>{email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="mono-text">
                          {paymentId
                            ? `${paymentId.slice(0, 12)}${
                                paymentId.length > 12 ? "..." : ""
                              }`
                            : "—"}
                        </span>
                      </td>

                      <td>
                        <strong className="amount-text">
                          {amount !== null
                            ? formatCurrency(amount, currency)
                            : "—"}
                        </strong>
                      </td>

                      <td>
                        <StatusBadge status={status} />
                      </td>

                      <td>
                        <span className="attempt-count">
                          {attempts}
                        </span>
                      </td>

                      <td>
                        <span className="date-text">
                          {formatDate(createdAt)}
                        </span>
                      </td>

                      <td>
                        <span className="date-text">
                          {formatDate(lastActivity)}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-action"
                            title="View recovery"
                            aria-label="View recovery"
                            onClick={() =>
                              handleViewRecovery(recovery)
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            className="icon-action"
                            title="Send recovery email"
                            aria-label="Send recovery email"
                            disabled={
                              !recoveryId ||
                              actionLoading === `send-${recoveryId}`
                            }
                            onClick={() =>
                              handleSendRecovery(recoveryId)
                            }
                          >
                            {actionLoading === `send-${recoveryId}` ? (
                              <RefreshCw
                                size={17}
                                className="spin"
                              />
                            ) : (
                              <Mail size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRecovery && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRecovery(null);
            }
          }}
        >
          <div className="modal recovery-modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">RECOVERY DETAILS</div>
                <h2>Recovery workflow</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedRecovery(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="modal-loading">
                <div className="loading-spinner" />
                <span>Loading recovery details...</span>
              </div>
            ) : (
              <>
                <div className="recovery-detail-summary">
                  <div className="customer-avatar large">
                    {getInitials(getCustomerName(selectedRecovery))}
                  </div>

                  <div>
                    <h3>{getCustomerName(selectedRecovery)}</h3>
                    <p>{getCustomerEmail(selectedRecovery)}</p>
                  </div>

                  <StatusBadge
                    status={getStatus(selectedRecovery)}
                  />
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Amount</span>
                    <strong>
                      {getAmount(selectedRecovery) !== null
                        ? formatCurrency(
                            getAmount(selectedRecovery),
                            getCurrency(selectedRecovery)
                          )
                        : "—"}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Attempts</span>
                    <strong>
                      {selectedRecovery?.retryCount ??
                        selectedRecovery?.attemptCount ??
                        selectedRecovery?.attempts ??
                        selectedRecovery?.retries ??
                        0}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Payment ID</span>
                    <strong className="mono-text">
                      {getPaymentId(selectedRecovery) || "—"}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Recovery ID</span>
                    <strong className="mono-text">
                      {getRecoveryId(selectedRecovery) || "—"}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Created</span>
                    <strong>
                      {formatDate(
                        selectedRecovery?.createdAt ||
                          selectedRecovery?.created_at
                      )}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Last activity</span>
                    <strong>
                      {formatDate(
                        selectedRecovery?.updatedAt ||
                          selectedRecovery?.lastActivity ||
                          selectedRecovery?.lastAttemptAt
                      )}
                    </strong>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedRecovery(null)}
                  >
                    Close
                  </button>

                  {getRecoveryId(selectedRecovery) && (
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={
                        actionLoading ===
                        `send-${getRecoveryId(selectedRecovery)}`
                      }
                      onClick={() =>
                        handleSendRecovery(
                          getRecoveryId(selectedRecovery)
                        )
                      }
                    >
                      {actionLoading ===
                      `send-${getRecoveryId(selectedRecovery)}` ? (
                        <>
                          <RefreshCw size={17} className="spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail size={17} />
                          Send Recovery Email
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Recoveries;