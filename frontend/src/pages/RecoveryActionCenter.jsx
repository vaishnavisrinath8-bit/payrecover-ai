
import React, { useEffect, useMemo, useState } from "react";
import {
  getAllRecoveries,
  getRecoveryAnalytics,
  markRecoveryRecovered,
  markRecoveryUnrecoverable,
  sendRecoveryEmail,
} from "../services/api";
import "./RecoveryActionCenter.css";

export default function RecoveryActionCenter() {
  const [recoveries, setRecoveries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedRecovery, setSelectedRecovery] =
    useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [recoveryResponse, analyticsResponse] =
        await Promise.all([
          getAllRecoveries(),
          getRecoveryAnalytics(),
        ]);

      const recoveryData =
        recoveryResponse?.data ||
        recoveryResponse?.recoveries ||
        [];

      setRecoveries(
        Array.isArray(recoveryData)
          ? recoveryData
          : []
      );

      setAnalytics(
        analyticsResponse?.data ||
          analyticsResponse ||
          null
      );
    } catch (error) {
      console.error(
        "Recovery Action Center error:",
        error
      );
      setMessage(
        "Unable to load recovery data."
      );
    } finally {
      setLoading(false);
    }
  };

  const getId = (recovery) =>
    recovery?._id ||
    recovery?.id ||
    recovery?.recoveryId;

  const getAmount = (recovery) =>
    Number(recovery?.amount) || 0;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: recoveryCurrency(),
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const recoveryCurrency = () => "INR";

  const getScore = (recovery) =>
    Number(recovery?.aiScore) || 0;

  const getProbability = (recovery) =>
    Number(
      recovery?.recoveryProbability
    ) || 0;

  const getPriority = (recovery) => {
    const score = getScore(recovery);

    if (score >= 80) return "HIGH";
    if (score >= 60) return "MEDIUM";

    return "LOW";
  };

  const getAction = (recovery) => {
    if (
      recovery?.recommendedAction
    ) {
      return recovery.recommendedAction;
    }

    const score = getScore(recovery);

    if (score >= 80) {
      return "retry_payment";
    }

    if (score >= 60) {
      return "send_email";
    }

    return "escalate";
  };

  const getActionLabel = (action) => {
    const labels = {
      retry_payment:
        "Retry Payment",
      send_email:
        "Send Recovery Email",
      escalate:
        "Escalate",
      contact_customer:
        "Contact Customer",
      send_message:
        "Send Message",
    };

    return (
      labels[action] ||
      String(action || "Review")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (c) =>
          c.toUpperCase()
        )
    );
  };

  const getStatus = (recovery) =>
    String(
      recovery?.status || "pending"
    ).toLowerCase();

  const filteredRecoveries =
    useMemo(() => {
      return recoveries.filter(
        (recovery) => {
          const name =
            recovery?.customerName ||
            "Unknown";

          const category =
            recovery?.failureCategory ||
            "";

          const status =
            getStatus(recovery);

          const text =
            `${name} ${category} ${status}`
              .toLowerCase();

          const matchesSearch =
            text.includes(
              search.toLowerCase()
            );

          const matchesFilter =
            filter === "all" ||
            status === filter ||
            getPriority(recovery).toLowerCase() ===
              filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      recoveries,
      search,
      filter,
    ]);

  const totalAtRisk = recoveries.reduce(
    (sum, recovery) =>
      sum + getAmount(recovery),
    0
  );

  const recoveredAmount =
    recoveries
      .filter((r) =>
        [
          "recovered",
          "success",
          "successful",
        ].includes(getStatus(r))
      )
      .reduce(
        (sum, recovery) =>
          sum + getAmount(recovery),
        0
      );

  const inProgressAmount =
    recoveries
      .filter((r) =>
        [
          "pending",
          "created",
          "in_progress",
          "processing",
        ].includes(getStatus(r))
      )
      .reduce(
        (sum, recovery) =>
          sum + getAmount(recovery),
        0
      );

  const recoveryRate =
    totalAtRisk > 0
      ? Math.round(
          (recoveredAmount /
            totalAtRisk) *
            100
        )
      : 0;

  const executeAction = async (
    recovery
  ) => {
    const id = getId(recovery);

    if (!id) {
      setMessage(
        "Recovery ID is missing."
      );
      return;
    }

    try {
      setActionLoading(id);
      setMessage("");

      const action =
        getAction(recovery);

      if (
        action ===
        "send_email"
      ) {
        await sendRecoveryEmail({
          recoveryId: id,
          customerName:
            recovery.customerName,
          customerEmail:
            recovery.customerEmail,
          amount:
            recovery.amount,
          failureCategory:
            recovery.failureCategory,
        });

        setMessage(
          `Recovery email sent to ${
            recovery.customerName ||
            "customer"
          }.`
        );
      } else if (
        action === "retry_payment"
      ) {
        setMessage(
          "Payment retry workflow initiated."
        );
      } else {
        setMessage(
          "Recovery has been escalated."
        );
      }

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Recovery action failed."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const markRecovered = async (
    recovery
  ) => {
    const id = getId(recovery);

    if (!id) return;

    try {
      setActionLoading(id);

      await markRecoveryRecovered(
        id,
        {
          amount:
            recovery.amount,
          note:
            "Recovered through PayRecover AI",
        }
      );

      setMessage(
        "Recovery marked as recovered."
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Unable to update recovery."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const markUnrecoverable = async (
    recovery
  ) => {
    const id = getId(recovery);

    if (!id) return;

    try {
      setActionLoading(id);

      await markRecoveryUnrecoverable(
        id,
        {
          note:
            "Recovery stopped after bounded workflow",
        }
      );

      setMessage(
        "Recovery marked as unrecoverable."
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Unable to update recovery."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const priorityClass = (
    priority
  ) =>
    `priority-${String(
      priority
    ).toLowerCase()}`;

  if (loading) {
    return (
      <div className="rac-page">
        <div className="rac-loading">
          Loading AI Recovery Center...
        </div>
      </div>
    );
  }

  return (
    <div className="rac-page">
      {/* HEADER */}

      <div className="rac-header">
        <div>
          <div className="rac-eyebrow">
            PAYRECOVER AI
          </div>

          <h1>
            Recovery Action Center
          </h1>

          <p>
            AI-powered revenue recovery
            from detection to action.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadData}
        >
          ↻ Refresh
        </button>
      </div>

      {message && (
        <div className="rac-message">
          {message}
        </div>
      )}

      {/* MONEY METRICS */}

      <div className="rac-metrics">
        <MetricCard
          title="Revenue at Risk"
          value={formatCurrency(
            totalAtRisk
          )}
          icon="₹"
          description="Total recovery opportunity"
        />

        <MetricCard
          title="Money Recovered"
          value={formatCurrency(
            recoveredAmount
          )}
          icon="✓"
          description="Successfully recovered"
        />

        <MetricCard
          title="In Progress"
          value={formatCurrency(
            inProgressAmount
          )}
          icon="◷"
          description="Active recovery cases"
        />

        <MetricCard
          title="Recovery Rate"
          value={`${recoveryRate}%`}
          icon="%"
          description="Recovered vs at risk"
        />
      </div>

      {/* AI WORKFLOW */}

      <div className="workflow-card">
        <div className="section-title">
          <div>
            <h2>
              AI Recovery Workflow
            </h2>

            <p>
              Automated bounded recovery
              process
            </p>
          </div>

          <span className="ai-badge">
            AI ACTIVE
          </span>
        </div>

        <div className="workflow">
          <WorkflowStep
            number="01"
            title="Detect"
            text="Identify revenue at risk"
          />

          <div className="workflow-arrow">
            →
          </div>

          <WorkflowStep
            number="02"
            title="Diagnose"
            text="Analyze failure reason"
          />

          <div className="workflow-arrow">
            →
          </div>

          <WorkflowStep
            number="03"
            title="Decide"
            text="Select best intervention"
          />

          <div className="workflow-arrow">
            →
          </div>

          <WorkflowStep
            number="04"
            title="Recover"
            text="Execute bounded action"
          />

          <div className="workflow-arrow">
            →
          </div>

          <WorkflowStep
            number="05"
            title="Track"
            text="Measure outcome"
          />
        </div>
      </div>

      {/* ACTION CENTER */}

      <div className="action-section">
        <div className="section-title">
          <div>
            <h2>
              AI Recommended Actions
            </h2>

            <p>
              Prioritized recovery
              opportunities
            </p>
          </div>
        </div>

        <div className="filters">
          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search customer or failure..."
          />

          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Recoveries
            </option>

            <option value="high">
              High Priority
            </option>

            <option value="medium">
              Medium Priority
            </option>

            <option value="low">
              Low Priority
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="recovered">
              Recovered
            </option>
          </select>
        </div>

        {filteredRecoveries.length ===
        0 ? (
          <div className="empty-state">
            No recovery opportunities
            found.
          </div>
        ) : (
          <div className="recovery-list">
            {filteredRecoveries.map(
              (recovery) => {
                const id =
                  getId(recovery);

                const priority =
                  getPriority(
                    recovery
                  );

                const action =
                  getAction(
                    recovery
                  );

                const status =
                  getStatus(
                    recovery
                  );

                const score =
                  getScore(
                    recovery
                  );

                const probability =
                  getProbability(
                    recovery
                  );

                const isLoading =
                  actionLoading === id;

                return (
                  <div
                    className="recovery-card"
                    key={id}
                  >
                    <div className="recovery-main">
                      <div className="customer-avatar">
                        {(
                          recovery?.customerName ||
                          "C"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="customer-info">
                        <h3>
                          {recovery?.customerName ||
                            "Unknown Customer"}
                        </h3>

                        <p>
                          {recovery?.customerEmail ||
                            "No email available"}
                        </p>

                        <div className="failure-tag">
                          {recovery?.failureCategory ||
                            "Payment Failure"}
                        </div>
                      </div>
                    </div>

                    <div className="amount-column">
                      <span>
                        Amount at risk
                      </span>

                      <strong>
                        {formatCurrency(
                          recovery?.amount
                        )}
                      </strong>
                    </div>

                    <div className="ai-score">
                      <span>
                        AI Score
                      </span>

                      <strong>
                        {score}/100
                      </strong>

                      <div className="score-bar">
                        <div
                          style={{
                            width: `${Math.min(
                              score,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="probability">
                      <span>
                        Recovery
                      </span>

                      <strong>
                        {probability}%
                      </strong>
                    </div>

                    <div>
                      <span
                        className={`priority ${priorityClass(
                          priority
                        )}`}
                      >
                        {priority}
                      </span>
                    </div>

                    <div className="action-column">
                      <div className="recommended">
                        <small>
                          RECOMMENDED
                        </small>

                        <strong>
                          {getActionLabel(
                            action
                          )}
                        </strong>
                      </div>

                      <div className="card-actions">
                        <button
                          className="primary-action"
                          disabled={
                            isLoading
                          }
                          onClick={() =>
                            executeAction(
                              recovery
                            )
                          }
                        >
                          {isLoading
                            ? "Processing..."
                            : getActionLabel(
                                action
                              )}
                        </button>

                        <button
                          className="secondary-action"
                          onClick={() =>
                            setSelectedRecovery(
                              recovery
                            )
                          }
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* AUDIT / DECISION PANEL */}

      {selectedRecovery && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedRecovery(null)
          }
        >
          <div
            className="decision-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <small>
                  AI RECOVERY DECISION
                </small>

                <h2>
                  {selectedRecovery.customerName ||
                    "Customer"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedRecovery(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="decision-grid">
              <DecisionItem
                label="Amount at Risk"
                value={formatCurrency(
                  selectedRecovery.amount
                )}
              />

              <DecisionItem
                label="Failure"
                value={
                  selectedRecovery.failureCategory ||
                  "Unknown"
                }
              />

              <DecisionItem
                label="AI Score"
                value={`${getScore(
                  selectedRecovery
                )}/100`}
              />

              <DecisionItem
                label="Recovery Probability"
                value={`${getProbability(
                  selectedRecovery
                )}%`}
              />

              <DecisionItem
                label="Priority"
                value={getPriority(
                  selectedRecovery
                )}
              />

              <DecisionItem
                label="Recommended Action"
                value={getActionLabel(
                  getAction(
                    selectedRecovery
                  )
                )}
              />
            </div>

            <div className="decision-reason">
              <h3>
                Why AI recommends this
              </h3>

              <p>
                The recovery engine
                evaluates the payment
                failure category, amount,
                customer context and
                recovery probability to
                select the safest next
                action.
              </p>
            </div>

            <div className="stopping-rule">
              <div className="rule-icon">
                ✓
              </div>

              <div>
                <strong>
                  Bounded Recovery Rule
                </strong>

                <p>
                  Maximum recovery attempts
                  are limited. If recovery
                  actions fail, the case is
                  stopped and escalated
                  instead of continuing
                  indefinitely.
                </p>
              </div>
            </div>

            <div className="audit-section">
              <h3>
                Audit Trail
              </h3>

              <AuditItem
                title="Revenue risk detected"
                text={`Amount: ${formatCurrency(
                  selectedRecovery.amount
                )}`}
              />

              <AuditItem
                title="Failure analyzed"
                text={
                  selectedRecovery.failureCategory ||
                  "Payment failure"
                }
              />

              <AuditItem
                title="AI decision generated"
                text={`Score ${
                  getScore(
                    selectedRecovery
                  )
                }/100 • Probability ${
                  getProbability(
                    selectedRecovery
                  )
                }%`}
              />

              <AuditItem
                title="Recommended intervention"
                text={getActionLabel(
                  getAction(
                    selectedRecovery
                  )
                )}
              />

              <AuditItem
                title="Current status"
                text={String(
                  selectedRecovery.status ||
                    "pending"
                )}
              />
            </div>

            <div className="modal-actions">
              <button
                className="success-action"
                onClick={() =>
                  markRecovered(
                    selectedRecovery
                  )
                }
              >
                ✓ Mark Recovered
              </button>

              <button
                className="danger-action"
                onClick={() =>
                  markUnrecoverable(
                    selectedRecovery
                  )
                }
              >
                Stop Recovery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  description,
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        {icon}
      </div>

      <div>
        <span>{title}</span>

        <strong>{value}</strong>

        <small>
          {description}
        </small>
      </div>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  text,
}) {
  return (
    <div className="workflow-step">
      <div className="workflow-number">
        {number}
      </div>

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {text}
        </span>
      </div>
    </div>
  );
}

function DecisionItem({
  label,
  value,
}) {
  return (
    <div className="decision-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AuditItem({
  title,
  text,
}) {
  return (
    <div className="audit-item">
      <div className="audit-dot" />

      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

