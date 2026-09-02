import React, { useEffect, useMemo, useState } from "react";
import {
  getAllRecoveries,
  markRecoveryRecovered,
  markRecoveryUnrecoverable,
  sendRecoveryEmail,
} from "../services/api";

export default function RecoveryOperations() {
  const [recoveries, setRecoveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const loadRecoveries = async () => {
    try {
      setLoading(true);

      const response = await getAllRecoveries();

      const data =
        response?.data ||
        response?.recoveries ||
        [];

      setRecoveries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load recovery operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecoveries();
  }, []);

  const filteredRecoveries = useMemo(() => {
    if (filter === "all") return recoveries;

    if (filter === "high") {
      return recoveries.filter(
        (item) =>
          String(item.priority || "").toLowerCase() ===
          "high"
      );
    }

    if (filter === "pending") {
      return recoveries.filter((item) =>
        ["pending", "created", "in_progress"].includes(
          String(item.status || "").toLowerCase()
        )
      );
    }

    if (filter === "recovered") {
      return recoveries.filter(
        (item) =>
          String(item.status || "").toLowerCase() ===
          "recovered"
      );
    }

    return recoveries;
  }, [recoveries, filter]);

  const stats = useMemo(() => {
    const total = recoveries.length;

    const recovered = recoveries.filter(
      (r) =>
        String(r.status || "").toLowerCase() ===
        "recovered"
    ).length;

    const pending = recoveries.filter((r) =>
      ["pending", "created", "in_progress"].includes(
        String(r.status || "").toLowerCase()
      )
    ).length;

    const highPriority = recoveries.filter(
      (r) =>
        String(r.priority || "").toLowerCase() ===
        "high"
    ).length;

    const revenueAtRisk = recoveries.reduce(
      (sum, r) => {
        const status = String(
          r.status || ""
        ).toLowerCase();

        if (
          ["recovered", "unrecoverable"].includes(
            status
          )
        ) {
          return sum;
        }

        return sum + Number(r.amount || 0);
      },
      0
    );

    const recoveredRevenue = recoveries.reduce(
      (sum, r) => {
        if (
          String(r.status || "").toLowerCase() ===
          "recovered"
        ) {
          return sum + Number(r.amount || 0);
        }

        return sum;
      },
      0
    );

    return {
      total,
      recovered,
      pending,
      highPriority,
      revenueAtRisk,
      recoveredRevenue,
    };
  }, [recoveries]);

  const executeAction = async (recovery) => {
    const id = recovery._id || recovery.id;

    if (!id) return;

    try {
      setProcessingId(id);
      setMessage("");

      const action = String(
        recovery.recommendedAction || ""
      ).toLowerCase();

      if (
        action.includes("email") ||
        action.includes("send")
      ) {
        await sendRecoveryEmail({
          recoveryId: id,
          customerName: recovery.customerName,
          customerEmail: recovery.customerEmail,
          amount: recovery.amount,
        });

        setMessage(
          `Recovery message sent to ${
            recovery.customerName || "customer"
          }.`
        );
      } else {
        setMessage(
          `Recovery action queued for ${
            recovery.customerName || "customer"
          }.`
        );
      }

      await loadRecoveries();
    } catch (error) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Recovery action failed."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const markRecovered = async (recovery) => {
    const id = recovery._id || recovery.id;

    if (!id) return;

    try {
      setProcessingId(id);

      await markRecoveryRecovered(id, {
        amountRecovered: Number(
          recovery.amount || 0
        ),
        recoveredAt: new Date().toISOString(),
      });

      setMessage(
        `${recovery.customerName || "Customer"} marked as recovered.`
      );

      await loadRecoveries();
    } catch (error) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Unable to mark recovery."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const markUnrecoverable = async (recovery) => {
    const id = recovery._id || recovery.id;

    if (!id) return;

    try {
      setProcessingId(id);

      await markRecoveryUnrecoverable(id, {
        reason: "Recovery workflow completed",
        completedAt: new Date().toISOString(),
      });

      setMessage(
        `${recovery.customerName || "Customer"} marked unrecoverable.`
      );

      await loadRecoveries();
    } catch (error) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Unable to update recovery."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const getPriorityClass = (priority) => {
    const value = String(
      priority || "medium"
    ).toLowerCase();

    if (value === "high") return "priority-high";
    if (value === "low") return "priority-low";

    return "priority-medium";
  };

  const getStatusClass = (status) => {
    const value = String(
      status || "pending"
    ).toLowerCase();

    if (value === "recovered") {
      return "status-recovered";
    }

    if (value === "unrecoverable") {
      return "status-unrecoverable";
    }

    if (value === "failed") {
      return "status-failed";
    }

    return "status-pending";
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          Loading Recovery Operations...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Recovery Operations
          </h1>

          <p style={styles.subtitle}>
            AI-powered recovery actions and
            revenue recovery workflow
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadRecoveries}
        >
          Refresh
        </button>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <div style={styles.statsGrid}>
        <StatCard
          title="Revenue at Risk"
          value={formatMoney(
            stats.revenueAtRisk
          )}
          description="Currently recoverable"
        />

        <StatCard
          title="Recovered Revenue"
          value={formatMoney(
            stats.recoveredRevenue
          )}
          description="Successfully recovered"
        />

        <StatCard
          title="Pending Recovery"
          value={stats.pending}
          description="Awaiting action"
        />

        <StatCard
          title="High Priority"
          value={stats.highPriority}
          description="Requires attention"
        />
      </div>

      <div style={styles.workflow}>
        <div style={styles.workflowHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              AI Recovery Queue
            </h2>

            <p style={styles.sectionSubtitle}>
              Execute bounded recovery actions
              based on AI recommendations.
            </p>
          </div>

          <div style={styles.filters}>
            {[
              ["all", "All"],
              ["pending", "Pending"],
              ["high", "High Priority"],
              ["recovered", "Recovered"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  ...styles.filterButton,
                  ...(filter === value
                    ? styles.activeFilter
                    : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredRecoveries.length === 0 ? (
          <div style={styles.empty}>
            No recovery records found.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Customer
                  </th>

                  <th style={styles.th}>
                    Amount
                  </th>

                  <th style={styles.th}>
                    Failure
                  </th>

                  <th style={styles.th}>
                    AI Score
                  </th>

                  <th style={styles.th}>
                    Recovery Probability
                  </th>

                  <th style={styles.th}>
                    Priority
                  </th>

                  <th style={styles.th}>
                    Recommended Action
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>

                  <th style={styles.th}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRecoveries.map(
                  (recovery) => {
                    const id =
                      recovery._id ||
                      recovery.id;

                    const isProcessing =
                      processingId === id;

                    return (
                      <tr key={id}>
                        <td style={styles.td}>
                          <div
                            style={
                              styles.customerName
                            }
                          >
                            {recovery.customerName ||
                              "Unknown Customer"}
                          </div>

                          <div
                            style={
                              styles.customerEmail
                            }
                          >
                            {recovery.customerEmail ||
                              "No email"}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <strong>
                            {formatMoney(
                              recovery.amount
                            )}
                          </strong>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={
                              styles.failureBadge
                            }
                          >
                            {String(
                              recovery.failureCategory ||
                                "unknown"
                            ).replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <strong>
                            {Number(
                              recovery.aiScore || 0
                            )}
                          </strong>
                          <span
                            style={
                              styles.scoreSuffix
                            }
                          >
                            /100
                          </span>
                        </td>

                        <td style={styles.td}>
                          {Number(
                            recovery.recoveryProbability ||
                              0
                          )}
                          %
                        </td>

                        <td style={styles.td}>
                          <span
                            className={getPriorityClass(
                              recovery.priority
                            )}
                            style={
                              styles.priorityBadge
                            }
                          >
                            {String(
                              recovery.priority ||
                                "MEDIUM"
                            ).toUpperCase()}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={
                              styles.actionText
                            }
                          >
                            {String(
                              recovery.recommendedAction ||
                                "review"
                            ).replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span
                            className={getStatusClass(
                              recovery.status
                            )}
                            style={
                              styles.statusBadge
                            }
                          >
                            {String(
                              recovery.status ||
                                "pending"
                            ).replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              styles.actionButtons
                            }
                          >
                            {![
                              "recovered",
                              "unrecoverable",
                            ].includes(
                              String(
                                recovery.status ||
                                  ""
                              ).toLowerCase()
                            ) && (
                              <>
                                <button
                                  style={
                                    styles.primaryButton
                                  }
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    executeAction(
                                      recovery
                                    )
                                  }
                                >
                                  {isProcessing
                                    ? "..."
                                    : "Execute"}
                                </button>

                                <button
                                  style={
                                    styles.successButton
                                  }
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    markRecovered(
                                      recovery
                                    )
                                  }
                                >
                                  Recovered
                                </button>

                                <button
                                  style={
                                    styles.dangerButton
                                  }
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    markUnrecoverable(
                                      recovery
                                    )
                                  }
                                >
                                  Close
                                </button>
                              </>
                            )}

                            {String(
                              recovery.status || ""
                            ).toLowerCase() ===
                              "recovered" && (
                              <span
                                style={
                                  styles.completedText
                                }
                              >
                                Completed
                              </span>
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
        )}
      </div>

      <div style={styles.stoppingRules}>
        <div>
          <h2 style={styles.sectionTitle}>
            Recovery Guardrails
          </h2>

          <p style={styles.sectionSubtitle}>
            Automated recovery operates within
            defined limits.
          </p>
        </div>

        <div style={styles.rulesGrid}>
          <Rule
            title="Maximum Attempts"
            value="3"
            description="Stops repeated recovery attempts."
          />

          <Rule
            title="AI Confidence"
            value="70%+"
            description="Higher-confidence cases receive automated action."
          />

          <Rule
            title="Escalation"
            value="Manual"
            description="Low-confidence cases require review."
          />

          <Rule
            title="Audit Trail"
            value="Enabled"
            description="Every recovery decision is tracked."
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTitle}>
        {title}
      </div>

      <div style={styles.statValue}>
        {value}
      </div>

      <div style={styles.statDescription}>
        {description}
      </div>
    </div>
  );
}

function Rule({
  title,
  value,
  description,
}) {
  return (
    <div style={styles.ruleCard}>
      <div style={styles.ruleTop}>
        <span style={styles.ruleTitle}>
          {title}
        </span>

        <strong style={styles.ruleValue}>
          {value}
        </strong>
      </div>

      <p style={styles.ruleDescription}>
        {description}
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f7f9fc",
    color: "#172033",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
  },

  subtitle: {
    marginTop: "7px",
    color: "#6b7280",
    fontSize: "14px",
  },

  refreshButton: {
    border: "1px solid #d8dee9",
    background: "#ffffff",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },

  message: {
    background: "#eef6ff",
    border: "1px solid #cfe4ff",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#245b9e",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e6eaf0",
    borderRadius: "12px",
    padding: "20px",
    boxShadow:
      "0 2px 8px rgba(15, 23, 42, 0.04)",
  },

  statTitle: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "10px",
  },

  statValue: {
    fontSize: "25px",
    fontWeight: 700,
  },

  statDescription: {
    marginTop: "7px",
    fontSize: "12px",
    color: "#8a94a6",
  },

  workflow: {
    background: "#ffffff",
    border: "1px solid #e6eaf0",
    borderRadius: "12px",
    overflow: "hidden",
  },

  workflowHeader: {
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    borderBottom:
      "1px solid #edf0f4",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 700,
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#7a8495",
    fontSize: "13px",
  },

  filters: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  filterButton: {
    border: "1px solid #dce2eb",
    background: "#ffffff",
    borderRadius: "7px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "12px",
  },

  activeFilter: {
    background: "#172033",
    color: "#ffffff",
    borderColor: "#172033",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1250px",
  },

  th: {
    padding: "13px 15px",
    textAlign: "left",
    fontSize: "11px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    background: "#fafbfc",
    borderBottom:
      "1px solid #edf0f4",
  },

  td: {
    padding: "15px",
    borderBottom:
      "1px solid #f0f2f5",
    fontSize: "13px",
    verticalAlign: "middle",
  },

  customerName: {
    fontWeight: 600,
    marginBottom: "3px",
  },

  customerEmail: {
    fontSize: "11px",
    color: "#8a94a6",
  },

  failureBadge: {
    background: "#fff5ed",
    color: "#b65d20",
    padding: "5px 8px",
    borderRadius: "5px",
    fontSize: "11px",
    textTransform: "capitalize",
  },

  scoreSuffix: {
    color: "#8a94a6",
    fontSize: "11px",
    marginLeft: "2px",
  },

  priorityBadge: {
    padding: "5px 8px",
    borderRadius: "5px",
    fontSize: "10px",
    fontWeight: 700,
  },

  actionText: {
    textTransform: "capitalize",
    fontWeight: 600,
  },

  statusBadge: {
    padding: "5px 8px",
    borderRadius: "5px",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "capitalize",
  },

  actionButtons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    background: "#172033",
    color: "#ffffff",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
  },

  successButton: {
    border: "none",
    background: "#16845b",
    color: "#ffffff",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
  },

  dangerButton: {
    border: "1px solid #e5baba",
    background: "#ffffff",
    color: "#b42318",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
  },

  completedText: {
    color: "#16845b",
    fontWeight: 600,
    fontSize: "12px",
  },

  empty: {
    padding: "60px",
    textAlign: "center",
    color: "#7a8495",
  },

  stoppingRules: {
    marginTop: "24px",
    background: "#ffffff",
    border: "1px solid #e6eaf0",
    borderRadius: "12px",
    padding: "22px",
  },

  rulesGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },

  ruleCard: {
    border: "1px solid #e7ebf0",
    borderRadius: "9px",
    padding: "15px",
  },

  ruleTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },

  ruleTitle: {
    fontSize: "12px",
    fontWeight: 600,
  },

  ruleValue: {
    fontSize: "12px",
  },

  ruleDescription: {
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#7a8495",
    marginBottom: 0,
  },

  loading: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
    color: "#6b7280",
  },
};