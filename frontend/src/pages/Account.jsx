import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Mail,
  RefreshCw,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

import {
  getAllRecoveries,
  getRecoveryById,
  sendRecoveryEmail,
} from "../services/api";

import {
  EmptyState,
  ErrorState,
  formatCurrency,
  formatDate,
  formatDateTime,
  StatusBadge,
  Toast,
} from "../components/UI";

export default function Recoveries() {
  const [recoveries, setRecoveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRecovery, setSelectedRecovery] =
    useState(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [sendLoading, setSendLoading] = useState(null);

  const [toast, setToast] = useState(null);

  const loadRecoveries = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAllRecoveries();
      setRecoveries(response?.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Unable to load recovery workflows."
      );
      setRecoveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecoveries();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const summary = useMemo(() => {
    const total = recoveries.length;

    const successful = recoveries.filter((item) =>
      ["recovered", "completed", "success", "successful"].includes(
        String(item.status || item.recoveryStatus).toLowerCase()
      )
    ).length;

    const active = recoveries.filter((item) =>
      ["pending", "in_progress", "processing", "sent"].includes(
        String(item.status || item.recoveryStatus).toLowerCase()
      )
    ).length;

    const failed = recoveries.filter((item) =>
      ["failed", "unrecoverable"].includes(
        String(item.status || item.recoveryStatus).toLowerCase()
      )
    ).length;

    return {
      total,
      successful,
      active,
      failed,
    };
  }, [recoveries]);

  const viewRecovery = async (id) => {
    if (!id) return;

    setDetailLoading(true);

    try {
      const response = await getRecoveryById(id);
      setSelectedRecovery(response?.data || null);
    } catch (err) {
      setToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Unable to load recovery details.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const sendEmail = async (id) => {
    if (!id) return;

    setSendLoading(id);

    try {
      await sendRecoveryEmail(id);

      setToast({
        type: "success",
        message:
          "Recovery email request sent successfully.",
      });

      await loadRecoveries();
    } catch (err) {
      console.error(err);

      setToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Unable to send recovery email.",
      });
    } finally {
      setSendLoading(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Recovery operations</span>
          <h1>Payment recoveries</h1>
          <p>
            Track failed-payment recovery workflows and
            communicate with customers.
          </p>
        </div>

        <button
          className="btn secondary"
          onClick={loadRecoveries}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="recovery-summary">
        <SummaryCard
          title="Total recoveries"
          value={summary.total}
          icon={RotateCcw}
        />

        <SummaryCard
          title="Recovered"
          value={summary.successful}
          icon={CheckCircle2}
        />

        <SummaryCard
          title="Active workflows"
          value={summary.active}
          icon={RefreshCw}
        />

        <SummaryCard
          title="Unsuccessful"
          value={summary.failed}
          icon={X}
        />
      </div>

      <div className="card table-card">
        <div className="table-card-header">
          <div>
            <h2>Recovery workflows</h2>
            <p>
              Real recovery records returned by the backend
            </p>
          </div>
        </div>

        {loading ? (
          <div className="table-loading">
            <RefreshCw className="spin" />
            Loading recovery workflows...
          </div>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={loadRecoveries}
          />
        ) : recoveries.length === 0 ? (
          <EmptyState
            title="No recovery workflows"
            description="Create a recovery from a failed payment to begin tracking recovery activity."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Created</th>
                  <th>Last activity</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {recoveries.map((recovery) => {
                  const payment =
                    recovery.payment ||
                    recovery.paymentId ||
                    {};

                  const customerName =
                    recovery.customerName ||
                    payment.customerName ||
                    "Unknown customer";

                  const amount =
                    recovery.amount ?? payment.amount;

                  const paymentId =
                    typeof recovery.paymentId === "object"
                      ? recovery.paymentId?._id
                      : recovery.paymentId;

                  const status =
                    recovery.recoveryStatus ||
                    recovery.status ||
                    "pending";

                  const attempts =
                    recovery.retryCount ??
                    recovery.attemptCount ??
                    recovery.attempts ??
                    0;

                  return (
                    <tr key={recovery._id}>
                      <td>
                        <div className="customer-cell">
                          <div className="table-avatar">
                            {customerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{customerName}</strong>
                            <span>
                              {recovery.customerEmail ||
                                payment.customerEmail ||
                                "No email"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="mono">
                          {paymentId || "Not available"}
                        </span>
                      </td>

                      <td>
                        {amount != null
                          ? formatCurrency(
                              amount,
                              recovery.currency ||
                                payment.currency ||
                                "INR"
                            )
                          : "Not available"}
                      </td>

                      <td>
                        <StatusBadge status={status} />
                      </td>

                      <td>{attempts}</td>

                      <td>
                        {formatDate(recovery.createdAt)}
                      </td>

                      <td>
                        {formatDate(
                          recovery.updatedAt ||
                            recovery.lastActivityAt ||
                            recovery.createdAt
                        )}
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-action"
                            title="View recovery"
                            onClick={() =>
                              viewRecovery(recovery._id)
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            className="icon-action recovery"
                            title="Send recovery email"
                            disabled={
                              sendLoading === recovery._id
                            }
                            onClick={() =>
                              sendEmail(recovery._id)
                            }
                          >
                            {sendLoading === recovery._id ? (
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
      </div>

      {selectedRecovery && (
        <RecoveryModal
          recovery={selectedRecovery}
          onClose={() => setSelectedRecovery(null)}
          onSend={sendEmail}
          sendLoading={sendLoading}
        />
      )}

      {detailLoading && (
        <div className="modal-backdrop">
          <div className="loading-modal">
            <RefreshCw className="spin" size={25} />
            Loading recovery details...
          </div>
        </div>
      )}

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="summary-card">
      <div className="summary-icon">
        <Icon size={19} />
      </div>

      <div>
        <span>{title}</span>
        <strong>{value.toLocaleString("en-IN")}</strong>
      </div>
    </div>
  );
}

function RecoveryModal({
  recovery,
  onClose,
  onSend,
  sendLoading,
}) {
  const payment =
    recovery.payment ||
    recovery.paymentId ||
    {};

  const status =
    recovery.recoveryStatus ||
    recovery.status ||
    "pending";

  const paymentId =
    typeof recovery.paymentId === "object"
      ? recovery.paymentId?._id
      : recovery.paymentId;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal recovery-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              Recovery workflow
            </span>
            <h2>Recovery details</h2>
          </div>

          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="recovery-detail-banner">
            <div className="recovery-detail-icon">
              <RotateCcw size={22} />
            </div>

            <div>
              <strong>
                {recovery.customerName ||
                  payment.customerName ||
                  "Unknown customer"}
              </strong>

              <span>
                {recovery.customerEmail ||
                  payment.customerEmail ||
                  "No email"}
              </span>
            </div>

            <StatusBadge status={status} />
          </div>

          <div className="detail-section">
            <div className="detail-section-title">
              <Send size={17} />
              Recovery information
            </div>

            <div className="detail-grid">
              <Detail
                label="Recovery ID"
                value={recovery._id}
                mono
              />

              <Detail
                label="Payment ID"
                value={paymentId}
                mono
              />

              <Detail
                label="Amount"
                value={
                  recovery.amount != null
                    ? formatCurrency(
                        recovery.amount,
                        recovery.currency ||
                          payment.currency ||
                          "INR"
                      )
                    : payment.amount != null
                    ? formatCurrency(
                        payment.amount,
                        payment.currency || "INR"
                      )
                    : "Not available"
                }
              />

              <Detail
                label="Attempts"
                value={
                  recovery.retryCount ??
                  recovery.attemptCount ??
                  recovery.attempts ??
                  0
                }
              />

              <Detail
                label="Created"
                value={formatDateTime(
                  recovery.createdAt
                )}
              />

              <Detail
                label="Last activity"
                value={formatDateTime(
                  recovery.updatedAt ||
                    recovery.lastActivityAt
                )}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn secondary"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="btn primary"
            disabled={sendLoading === recovery._id}
            onClick={() => onSend(recovery._id)}
          >
            {sendLoading === recovery._id ? (
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
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong className={mono ? "mono" : ""}>
        {value || "Not available"}
      </strong>
    </div>
  );
}