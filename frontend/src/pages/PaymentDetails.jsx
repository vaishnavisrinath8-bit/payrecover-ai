import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  StopCircle,
  User,
  Wallet,
  Zap,
} from "lucide-react";

import {
  getPaymentById,
  getAllRecoveries,
  createRecovery,
  sendRecovery,
  markRecoveryRecovered,
  markRecoveryUnrecoverable,
} from "../services/api";

import "./PaymentDetails.css";

export default function PaymentDetails() {
  const paymentId =
    window.location.pathname.split("/").pop();

  const [payment, setPayment] = useState(null);
  const [recovery, setRecovery] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showRecoveryPanel, setShowRecoveryPanel] =
    useState(false);

  const [channel, setChannel] =
    useState("email");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const paymentResponse =
        await getPaymentById(paymentId);

      const paymentData =
        paymentResponse?.data ??
        paymentResponse;

      setPayment(paymentData);

      try {
        const recoveryResponse =
          await getAllRecoveries();

        const recoveryRecords =
          extractRecords(recoveryResponse);

        const matchingRecovery =
          recoveryRecords.find((item) => {
            const id =
              item?.paymentId?._id ??
              item?.paymentId ??
              item?.payment?._id ??
              item?.payment ??
              "";

            return String(id) === String(paymentId);
          });

        setRecovery(
          matchingRecovery || null
        );
      } catch (recoveryError) {
        console.warn(
          "Unable to load recovery:",
          recoveryError
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load payment details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId) {
      loadData();
    }
  }, [paymentId]);

  const amount = Number(
    payment?.amount || 0
  );

  const paymentStatus =
    payment?.paymentStatus ||
    payment?.status ||
    "unknown";

  const isFailed =
    paymentStatus.toLowerCase() ===
    "failed";

  const failureReason =
    payment?.failureReason ||
    "Payment failed";

  const aiRecommendation =
    payment?.aiRecommendation?.action ||
    "Review payment and determine recovery action";

  const aiReason =
    payment?.aiRecommendation?.reason ||
    getReasonFromFailure(
      failureReason
    );

  const recoveryProbability = useMemo(() => {
    if (recovery?.recoveryProbability != null) {
      return Number(
        recovery.recoveryProbability
      );
    }

    if (
      recovery?.ai?.recoveryProbability != null
    ) {
      return Number(
        recovery.ai.recoveryProbability
      );
    }

    if (
      recovery?.aiScore != null
    ) {
      return Number(
        recovery.aiScore
      );
    }

    return calculateProbability(
      failureReason,
      amount
    );
  }, [
    recovery,
    failureReason,
    amount,
  ]);

  const currentStatus =
    recovery?.status ||
    (isFailed
      ? "not_started"
      : paymentStatus);

  const createRecoveryWorkflow =
    async () => {
      try {
        setActionLoading(true);
        setError("");
        setSuccess("");

        const response =
          await createRecovery({
            paymentId,
            recoveryType:
              "payment_failure",
            recommendedAction:
              aiRecommendation,
            recoveryChannel:
              channel,
          });

        const createdRecovery =
          response?.data ??
          response?.recovery ??
          response;

        setRecovery(
          createdRecovery
        );

        setSuccess(
          "AI recovery workflow created successfully."
        );

        setShowRecoveryPanel(true);

        await loadData();
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to create recovery workflow."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const contactCustomer =
    async () => {
      if (!recovery?._id) {
        setError(
          "Recovery workflow does not have a valid ID."
        );
        return;
      }

      try {
        setActionLoading(true);
        setError("");
        setSuccess("");

        await sendRecovery({
          recoveryId:
            recovery._id,
          channel,
          message:
            recovery?.generatedMessage ||
            recovery?.recoveryMessage ||
            generateMessage(
              payment
            ),
        });

        setSuccess(
          "Recovery communication sent successfully."
        );

        await loadData();
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to send recovery communication."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const markRecovered =
    async () => {
      if (!recovery?._id) {
        setError(
          "No active recovery workflow found."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Mark ₹${formatAmount(
            amount
          )} as recovered?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");
        setSuccess("");

        await markRecoveryRecovered(
          recovery._id,
          amount
        );

        setSuccess(
          "Payment successfully marked as recovered."
        );

        await loadData();
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to mark payment as recovered."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const stopRecovery =
    async () => {
      if (!recovery?._id) {
        setError(
          "No active recovery workflow found."
        );
        return;
      }

      const reason =
        window.prompt(
          "Reason for stopping recovery:",
          "Recovery no longer viable."
        );

      if (!reason) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");
        setSuccess("");

        await markRecoveryUnrecoverable(
          recovery._id,
          reason
        );

        setSuccess(
          "Recovery workflow stopped."
        );

        await loadData();
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to stop recovery."
        );
      } finally {
        setActionLoading(false);
      }
    };

  if (loading) {
    return (
      <div className="payment-details-page">
        <div className="payment-details-loading">
          <RefreshCw
            size={22}
            className="spin"
          />

          <span>
            Loading payment intelligence...
          </span>
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="payment-details-page">
        <div className="payment-details-error">
          <AlertCircle size={22} />

          <div>
            <strong>
              Unable to load payment
            </strong>

            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-details-page">

      {/* HEADER */}
      <div className="payment-details-header">

        <button
          className="payment-back-button"
          onClick={() =>
            window.history.back()
          }
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="payment-header-main">

          <div>
            <div className="payment-eyebrow">
              PAYMENT INTELLIGENCE
            </div>

            <h1>
              Payment Details
            </h1>

            <p>
              AI-powered diagnosis and
              recovery workflow.
            </p>
          </div>

          <div
            className={`payment-status ${
              paymentStatus
                .toLowerCase()
                .replace(/\s+/g, "-")
            }`}
          >
            {paymentStatus}
          </div>

        </div>

      </div>

      {error && (
        <div className="workflow-alert error">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {success && (
        <div className="workflow-alert success">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <div className="payment-details-grid">

        {/* PAYMENT INFORMATION */}
        <section className="payment-details-card">

          <div className="details-card-title">
            <Wallet size={18} />
            Payment information
          </div>

          <div className="payment-amount">
            ₹{formatAmount(amount)}
          </div>

          <div className="detail-list">

            <DetailRow
              label="Customer"
              value={
                payment?.customerName ||
                "Unknown customer"
              }
              icon={<User size={15} />}
            />

            <DetailRow
              label="Email"
              value={
                payment?.customerEmail ||
                "Not available"
              }
              icon={<Mail size={15} />}
            />

            <DetailRow
              label="Payment method"
              value={
                payment?.paymentMethod ||
                "Unknown"
              }
            />

            <DetailRow
              label="Failure reason"
              value={
                failureReason
              }
            />

            <DetailRow
              label="Failure code"
              value={
                payment?.failureCode ||
                "Not available"
              }
            />

            <DetailRow
              label="Retry count"
              value={
                payment?.retryCount ??
                0
              }
            />

          </div>

        </section>

        {/* AI DECISION */}
        <section className="payment-details-card ai-decision-card">

          <div className="details-card-title">

            <div className="ai-title-icon">
              <Brain size={18} />
            </div>

            AI Recovery Decision

          </div>

          <div className="ai-recommendation">

            <div className="recommendation-label">
              RECOMMENDED ACTION
            </div>

            <h2>
              {aiRecommendation}
            </h2>

            <p>
              {aiReason}
            </p>

          </div>

          <div className="probability-section">

            <div className="probability-header">
              <span>
                Recovery probability
              </span>

              <strong>
                {Math.round(
                  recoveryProbability
                )}%
              </strong>
            </div>

            <div className="probability-track">
              <div
                className="probability-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      recoveryProbability
                    )
                  )}%`,
                }}
              />
            </div>

          </div>

          <div className="ai-signals">

            <Signal
              label="Failure severity"
              value={getSeverity(
                failureReason
              )}
            />

            <Signal
              label="Revenue impact"
              value={
                amount >= 10000
                  ? "High"
                  : amount >= 5000
                  ? "Medium"
                  : "Low"
              }
            />

            <Signal
              label="Recommended channel"
              value={channel}
            />

          </div>

        </section>

      </div>

      {/* WORKFLOW */}
      <section className="workflow-card">

        <div className="workflow-header">

          <div>
            <div className="details-card-title">
              <Sparkles size={18} />
              AI Recovery Workflow
            </div>

            <p>
              Track this payment from failure
              through recovery.
            </p>
          </div>

          <div className="workflow-status">
            {formatStatus(
              currentStatus
            )}
          </div>

        </div>

        <div className="workflow-steps">

          <WorkflowStep
            number="01"
            title="Payment failed"
            description="Failure detected and classified by the payment system."
            complete
          />

          <WorkflowStep
            number="02"
            title="AI diagnosis"
            description="Recovery probability and recommended intervention calculated."
            complete
          />

          <WorkflowStep
            number="03"
            title="Recovery created"
            description="Recovery workflow created with bounded actions."
            complete={
              Boolean(recovery)
            }
            active={
              !recovery
            }
          />

          <WorkflowStep
            number="04"
            title="Customer contacted"
            description="Recovery communication sent through the selected channel."
            complete={
              hasContacted(
                recovery
              )
            }
            active={
              Boolean(recovery) &&
              !hasContacted(
                recovery
              )
            }
          />

          <WorkflowStep
            number="05"
            title="Payment recovered"
            description="Recovered revenue recorded and workflow closed."
            complete={
              isRecovered(
                recovery
              )
            }
            active={
              hasContacted(
                recovery
              ) &&
              !isRecovered(
                recovery
              )
            }
          />

        </div>

      </section>

      {/* ACTION CENTER */}
      {isFailed && (
        <section className="action-center">

          <div className="action-center-header">

            <div>
              <div className="details-card-title">
                <Zap size={18} />
                Recovery Action Center
              </div>

              <p>
                Execute the next bounded recovery
                action for this payment.
              </p>
            </div>

            <div className="compliance-badge">
              <ShieldCheck size={15} />
              Compliance-aware
            </div>

          </div>

          {!recovery ? (
            <div className="create-recovery-panel">

              <div className="action-message">

                <Sparkles size={19} />

                <div>
                  <strong>
                    AI recommends starting
                    a recovery workflow
                  </strong>

                  <span>
                    The payment is eligible for
                    recovery based on its failure
                    reason and revenue impact.
                  </span>
                </div>

              </div>

              <div className="channel-selection">

                <span>
                  Recovery channel
                </span>

                <div className="channel-buttons">

                  <button
                    className={
                      channel === "email"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setChannel("email")
                    }
                  >
                    <Mail size={15} />
                    Email
                  </button>

                  <button
                    className={
                      channel === "payment_retry"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setChannel(
                        "payment_retry"
                      )
                    }
                  >
                    <RefreshCw size={15} />
                    Payment retry
                  </button>

                </div>

              </div>

              <button
                className="primary-workflow-button"
                onClick={
                  createRecoveryWorkflow
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Create AI Recovery
                  </>
                )}
              </button>

            </div>
          ) : (
            <div className="active-recovery-panel">

              <div className="active-recovery-info">

                <div className="active-icon">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <strong>
                    Recovery workflow active
                  </strong>

                  <span>
                    Status:{" "}
                    {formatStatus(
                      recovery.status
                    )}
                  </span>
                </div>

              </div>

              <div className="workflow-actions">

                {!hasContacted(
                  recovery
                ) && (
                  <button
                    className="primary-workflow-button"
                    onClick={
                      contactCustomer
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw
                          size={16}
                          className="spin"
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={16} />
                        Contact Customer
                      </>
                    )}
                  </button>
                )}

                {hasContacted(
                  recovery
                ) &&
                  !isRecovered(
                    recovery
                  ) && (
                    <button
                      className="success-workflow-button"
                      onClick={
                        markRecovered
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      <CheckCircle2
                        size={16}
                      />
                      Mark Recovered
                    </button>
                  )}

                {!isRecovered(
                  recovery
                ) && (
                  <button
                    className="danger-workflow-button"
                    onClick={
                      stopRecovery
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    <StopCircle size={16} />
                    Stop Recovery
                  </button>
                )}

              </div>

            </div>
          )}

        </section>
      )}

      {/* RECOVERY SUMMARY */}
      {recovery && (
        <section className="recovery-summary-card">

          <div className="summary-item">
            <span>Status</span>
            <strong>
              {formatStatus(
                recovery.status
              )}
            </strong>
          </div>

          <div className="summary-item">
            <span>Attempts</span>
            <strong>
              {recovery.attemptCount ??
                recovery.attempts ??
                0}
              {" / "}
              {recovery.maxAttempts ??
                3}
            </strong>
          </div>

          <div className="summary-item">
            <span>Channel</span>
            <strong>
              {recovery.recoveryChannel ||
                channel}
            </strong>
          </div>

          <div className="summary-item">
            <span>Recovered amount</span>
            <strong>
              ₹
              {formatAmount(
                recovery.recoveredAmount ||
                  0
              )}
            </strong>
          </div>

        </section>
      )}

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function extractRecords(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.recoveries)) {
    return response.recoveries;
  }

  if (
    Array.isArray(
      response?.data?.recoveries
    )
  ) {
    return response.data.recoveries;
  }

  if (
    Array.isArray(
      response?.data?.data
    )
  ) {
    return response.data.data;
  }

  return [];
}


function formatAmount(value) {
  return Number(
    value || 0
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}


function getSeverity(reason = "") {
  const text =
    reason.toLowerCase();

  if (
    text.includes("insufficient") ||
    text.includes("expired")
  ) {
    return "Medium";
  }

  if (
    text.includes("network") ||
    text.includes("timeout")
  ) {
    return "Low";
  }

  return "High";
}


function getReasonFromFailure(
  reason = ""
) {
  const text =
    reason.toLowerCase();

  if (
    text.includes(
      "insufficient"
    )
  ) {
    return "Customer funds may be temporarily unavailable. A controlled retry or payment-method recovery may succeed.";
  }

  if (
    text.includes("network") ||
    text.includes("timeout")
  ) {
    return "The failure may be transient. A retry is a suitable first intervention.";
  }

  if (
    text.includes("expired")
  ) {
    return "The payment instrument may need to be updated before another attempt.";
  }

  if (
    text.includes("authentication")
  ) {
    return "The customer may need to complete authentication before retrying the payment.";
  }

  return "The payment failure is eligible for a controlled recovery workflow.";
}


function calculateProbability(
  reason,
  amount
) {
  const text =
    reason.toLowerCase();

  let score = 62;

  if (
    text.includes("network") ||
    text.includes("timeout")
  ) {
    score += 16;
  }

  if (
    text.includes(
      "insufficient"
    )
  ) {
    score += 8;
  }

  if (
    text.includes("declined")
  ) {
    score -= 8;
  }

  if (
    text.includes("expired")
  ) {
    score -= 12;
  }

  if (amount > 15000) {
    score -= 5;
  }

  return Math.max(
    10,
    Math.min(95, score)
  );
}


function hasContacted(recovery) {
  if (!recovery) {
    return false;
  }

  const status =
    String(
      recovery.status || ""
    ).toLowerCase();

  return (
    [
      "contacted",
      "promised",
      "retrying",
      "in_progress",
      "recovered",
      "closed",
    ].includes(status) ||
    Number(
      recovery.attemptCount ??
        recovery.attempts ??
        0
    ) > 0
  );
}


function isRecovered(recovery) {
  if (!recovery) {
    return false;
  }

  return (
    String(
      recovery.status || ""
    ).toLowerCase() ===
    "recovered"
  );
}


function formatStatus(status) {
  return String(
    status || "Not started"
  )
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


function generateMessage(payment) {
  const customer =
    payment?.customerName ||
    "there";

  const amount = formatAmount(
    payment?.amount
  );

  return `Hi ${customer}, your payment of ₹${amount} could not be completed. Please retry your payment using the secure payment option provided.`;
}


/* =========================================================
   COMPONENTS
========================================================= */

function DetailRow({
  label,
  value,
  icon,
}) {
  return (
    <div className="detail-row">

      <span>
        {icon}
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function Signal({
  label,
  value,
}) {
  return (
    <div className="ai-signal">

      <span>{label}</span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function WorkflowStep({
  number,
  title,
  description,
  complete,
  active,
}) {
  return (
    <div
      className={`workflow-step ${
        complete
          ? "complete"
          : active
          ? "active"
          : ""
      }`}
    >

      <div className="workflow-step-number">
        {complete ? (
          <CheckCircle2 size={17} />
        ) : (
          number
        )}
      </div>

      <div className="workflow-step-content">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

    </div>
  );
}