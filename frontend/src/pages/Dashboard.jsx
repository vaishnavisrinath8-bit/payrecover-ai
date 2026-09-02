
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAllPayments,
  getPaymentStats,
  getRecentPayments,
  getRecoveryQueue,
} from "../services/api";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatNumber = (value = 0) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getPaymentStatus = (payment) => {
  const status =
    payment?.paymentStatus ||
    payment?.status ||
    "";

  return String(status).toLowerCase();
};

const getAmount = (payment) =>
  Number(
    payment?.amount ||
      payment?.amountPaid ||
      payment?.totalAmount ||
      0
  );

const getCustomerName = (payment) =>
  payment?.customerName ||
  payment?.customer?.name ||
  payment?.name ||
  "Customer";

const getFailureReason = (payment) =>
  payment?.failureReason ||
  payment?.failureCode ||
  "Payment failed";

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  type,
  trend,
}) {
  return (
    <div className="dashboard-metric-card">
      <div className={`metric-icon ${type}`}>
        <Icon size={21} strokeWidth={2.2} />
      </div>

      <div className="metric-card-content">
        <div className="metric-card-top">
          <span>{title}</span>

          {trend && (
            <span
              className={`metric-trend ${
                trend.startsWith("-")
                  ? "negative"
                  : "positive"
              }`}
            >
              {trend.startsWith("-") ? (
                <ArrowDownRight size={14} />
              ) : (
                <ArrowUpRight size={14} />
              )}
              {trend}
            </span>
          )}
        </div>

        <strong>{value}</strong>

        {subtitle && (
          <small>{subtitle}</small>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");

  let label = status || "Unknown";
  let className = "status-neutral";

  if (
    ["success", "successful", "paid", "completed"].includes(
      normalized
    )
  ) {
    label = "Successful";
    className = "status-success";
  } else if (
    ["failed", "failure", "declined"].includes(
      normalized
    )
  ) {
    label = "Failed";
    className = "status-danger";
  } else if (
    ["pending", "processing"].includes(normalized)
  ) {
    label = "Pending";
    className = "status-warning";
  }

  return (
    <span className={`status-badge ${className}`}>
      {className === "status-success" && (
        <CheckCircle2 size={13} />
      )}

      {className === "status-danger" && (
        <XCircle size={13} />
      )}

      {className === "status-warning" && (
        <Clock3 size={13} />
      )}

      {label}
    </span>
  );
}

function Dashboard() {
  const [payments, setPayments] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recoveries, setRecoveries] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        getAllPayments(),
        getPaymentStats(),
        getRecentPayments(),
        getRecoveryQueue(),
      ]);

      const paymentsResult = results[0];
      const statsResult = results[1];
      const recentResult = results[2];
      const recoveryResult = results[3];

      const extractArray = (result) => {
        if (
          result?.status !== "fulfilled" ||
          !result?.value
        ) {
          return [];
        }

        const value = result.value;

        if (Array.isArray(value)) return value;

        if (Array.isArray(value?.data))
          return value.data;

        if (Array.isArray(value?.data?.data))
          return value.data.data;

        if (Array.isArray(value?.payments))
          return value.payments;

        if (Array.isArray(value?.recoveries))
          return value.recoveries;

        return [];
      };

      const paymentData = extractArray(paymentsResult);
      const recentData = extractArray(recentResult);
      const recoveryData = extractArray(recoveryResult);

      setPayments(paymentData);
      setRecentPayments(
        recentData.length
          ? recentData
          : paymentData.slice(0, 8)
      );
      setRecoveries(recoveryData);

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      }

      if (
        paymentData.length === 0 &&
        recoveryData.length === 0 &&
        results.every(
          (result) => result.status === "rejected"
        )
      ) {
        setError(
          "Unable to load dashboard data. Make sure the backend is running on port 3001."
        );
      }
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const calculated = useMemo(() => {
    const source =
      payments.length > 0
        ? payments
        : recentPayments;

    const successful = source.filter((p) =>
      ["success", "successful", "paid", "completed"].includes(
        getPaymentStatus(p)
      )
    );

    const failed = source.filter((p) =>
      ["failed", "failure", "declined"].includes(
        getPaymentStatus(p)
      )
    );

    const totalValue = source.reduce(
      (sum, p) => sum + getAmount(p),
      0
    );

    const failedValue = failed.reduce(
      (sum, p) => sum + getAmount(p),
      0
    );

    const recoveredValue = recoveries.reduce(
      (sum, recovery) =>
        sum +
        Number(
          recovery?.recoveredAmount ||
            recovery?.amountRecovered ||
            0
        ),
      0
    );

    const recoveryCount =
      recoveries.length;

    return {
      total:
        Number(
          stats?.total ||
            stats?.totalPayments ||
            stats?.count ||
            source.length ||
            0
        ) || 0,

      successful:
        Number(
          stats?.successful ||
            stats?.successfulPayments ||
            stats?.successCount ||
            successful.length
        ) || 0,

      failed:
        Number(
          stats?.failed ||
            stats?.failedPayments ||
            stats?.failureCount ||
            failed.length
        ) || 0,

      totalValue,
      failedValue,
      recoveredValue,
      recoveryCount,
    };
  }, [
    payments,
    recentPayments,
    recoveries,
    stats,
  ]);

  const chartData = useMemo(() => {
    const source =
      payments.length > 0
        ? payments
        : recentPayments;

    const buckets = {};

    source.forEach((payment) => {
      const date = new Date(
        payment?.createdAt ||
          payment?.updatedAt
      );

      if (Number.isNaN(date.getTime()))
        return;

      const key = date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        }
      );

      if (!buckets[key]) {
        buckets[key] = {
          date: key,
          successful: 0,
          failed: 0,
          volume: 0,
        };
      }

      const amount = getAmount(payment);

      buckets[key].volume += amount;

      if (
        ["success", "successful", "paid", "completed"].includes(
          getPaymentStatus(payment)
        )
      ) {
        buckets[key].successful += amount;
      } else if (
        ["failed", "failure", "declined"].includes(
          getPaymentStatus(payment)
        )
      ) {
        buckets[key].failed += amount;
      }
    });

    return Object.values(buckets)
      .slice(-14)
      .map((item) => ({
        ...item,
        volume: Math.round(item.volume),
        successful: Math.round(
          item.successful
        ),
        failed: Math.round(item.failed),
      }));
  }, [payments, recentPayments]);

  const successRate =
    calculated.total > 0
      ? (
          (calculated.successful /
            calculated.total) *
          100
        ).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner">
            <RefreshCw
              size={24}
              className="spin"
            />
          </div>

          <h2>Loading your dashboard</h2>

          <p>
            Fetching payments, recoveries and
            performance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">
            <Zap size={15} />
            PAYRECOVER AI
          </div>

          <h1>Revenue Recovery Dashboard</h1>

          <p>
            Monitor payments, identify revenue at
            risk and track automated recovery
            performance.
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={loadDashboard}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="dashboard-alert">
          <AlertCircle size={19} />

          <div>
            <strong>Data connection issue</strong>
            <span>{error}</span>
          </div>

          <button onClick={loadDashboard}>
            Retry
          </button>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="dashboard-metrics-grid">

        <MetricCard
          title="Total Payments"
          value={formatNumber(
            calculated.total
          )}
          subtitle="Payments processed"
          icon={CreditCard}
          type="blue"
        />

        <MetricCard
          title="Successful Payments"
          value={formatNumber(
            calculated.successful
          )}
          subtitle={`${successRate}% success rate`}
          icon={CheckCircle2}
          type="green"
        />

        <MetricCard
          title="Failed Payments"
          value={formatNumber(
            calculated.failed
          )}
          subtitle={formatCurrency(
            calculated.failedValue
          ) + " at risk"}
          icon={XCircle}
          type="red"
        />

        <MetricCard
          title="Recovered Revenue"
          value={formatCurrency(
            calculated.recoveredValue
          )}
          subtitle={`${formatNumber(
            calculated.recoveryCount
          )} recovery cases`}
          icon={IndianRupee}
          type="purple"
        />
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-main-grid">

        {/* PERFORMANCE CHART */}
        <section className="dashboard-panel chart-panel">

          <div className="panel-header">
            <div>
              <h2>Payment Performance</h2>
              <p>
                Payment volume and failure trends
              </p>
            </div>

            <div className="panel-stat">
              <TrendingUp size={16} />
              <span>
                {successRate}% success
              </span>
            </div>
          </div>

          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="successfulGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#2563eb"
                        stopOpacity={0.22}
                      />

                      <stop
                        offset="100%"
                        stopColor="#2563eb"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e8edf3"
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₹${Math.round(
                        value / 1000
                      )}k`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow:
                        "0 10px 30px rgba(15,23,42,.10)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="successful"
                    name="Successful"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#successfulGradient)"
                  />

                  <Area
                    type="monotone"
                    dataKey="failed"
                    name="Failed"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <TrendingUp size={32} />
                <strong>No chart data yet</strong>
                <span>
                  Payment activity will appear here
                  once records are available.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* RECOVERY SUMMARY */}
        <section className="dashboard-panel recovery-summary-panel">

          <div className="panel-header">
            <div>
              <h2>Recovery Overview</h2>
              <p>AI-driven revenue recovery</p>
            </div>

            <ShieldCheck size={22} />
          </div>

          <div className="recovery-big-number">
            {formatCurrency(
              calculated.recoveredValue
            )}
          </div>

          <span className="recovery-label">
            Revenue recovered
          </span>

          <div className="recovery-progress">
            <div
              style={{
                width: `${
                  calculated.failedValue > 0
                    ? Math.min(
                        100,
                        (calculated.recoveredValue /
                          calculated.failedValue) *
                          100
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="recovery-progress-text">
            <span>Recovery performance</span>

            <strong>
              {calculated.failedValue > 0
                ? `${Math.min(
                    100,
                    (
                      (calculated.recoveredValue /
                        calculated.failedValue) *
                      100
                    )
                  ).toFixed(1)}%`
                : "0%"}
            </strong>
          </div>

          <div className="recovery-stat-list">

            <div>
              <span>
                <WalletCards size={16} />
                Recovery cases
              </span>

              <strong>
                {formatNumber(
                  calculated.recoveryCount
                )}
              </strong>
            </div>

            <div>
              <span>
                <IndianRupee size={16} />
                Revenue at risk
              </span>

              <strong>
                {formatCurrency(
                  calculated.failedValue
                )}
              </strong>
            </div>

            <div>
              <span>
                <TrendingUp size={16} />
                Success rate
              </span>

              <strong>
                {successRate}%
              </strong>
            </div>

          </div>
        </section>
      </div>

      {/* RECENT PAYMENTS */}
      <section className="dashboard-panel recent-panel">

        <div className="panel-header">
          <div>
            <h2>Recent Payments</h2>
            <p>
              Latest payment activity across your
              account
            </p>
          </div>

          <span className="record-count">
            {formatNumber(
              calculated.total
            )}{" "}
            total
          </span>
        </div>

        <div className="payments-table-wrapper">

          {recentPayments.length > 0 ? (
            <table className="dashboard-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {recentPayments
                  .slice(0, 8)
                  .map((payment, index) => {

                    const paymentId =
                      payment?.razorpayPaymentId ||
                      payment?.paymentId ||
                      payment?._id ||
                      `PAY-${index + 1}`;

                    return (
                      <tr
                        key={
                          payment?._id ||
                          paymentId
                        }
                      >

                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar">
                              {getCustomerName(
                                payment
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {getCustomerName(
                                  payment
                                )}
                              </strong>

                              <small>
                                {payment?.customerEmail ||
                                  "—"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="payment-id">
                            {String(
                              paymentId
                            ).slice(-18)}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              getAmount(payment)
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="method-badge">
                            {String(
                              payment?.paymentMethod ||
                                "—"
                            ).toUpperCase()}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={getPaymentStatus(
                              payment
                            )}
                          />
                        </td>

                        <td>
                          <span className="date-text">
                            {formatDate(
                              payment?.createdAt
                            )}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <div className="table-empty">
              <CreditCard size={34} />
              <strong>No payments found</strong>
              <span>
                Payment records will appear here
                when your backend returns data.
              </span>
            </div>
          )}

        </div>
      </section>

      {/* BOTTOM INSIGHTS */}
      <div className="dashboard-insights-grid">

        <div className="insight-card">
          <div className="insight-icon blue">
            <AlertCircle size={20} />
          </div>

          <div>
            <span>Revenue at Risk</span>
            <strong>
              {formatCurrency(
                calculated.failedValue
              )}
            </strong>

            <small>
              From failed payment attempts
            </small>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Recovered Revenue</span>
            <strong>
              {formatCurrency(
                calculated.recoveredValue
              )}
            </strong>

            <small>
              Successfully recovered by workflows
            </small>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon purple">
            <Zap size={20} />
          </div>

          <div>
            <span>AI Recovery Cases</span>
            <strong>
              {formatNumber(
                calculated.recoveryCount
              )}
            </strong>

            <small>
              Cases identified for intervention
            </small>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;

