import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getPaymentStats,
  getRecentPayments,
} from "../services/api";

import {
  EmptyState,
  ErrorState,
  formatCurrency,
} from "../components/UI";

const initialStats = {
  totalPayments: 0,
  successfulPayments: 0,
  failedPayments: 0,
  pendingPayments: 0,
  createdPayments: 0,
  successRate: 0,
  recoveredPayments: 0,
  inProgressRecoveries: 0,
  unrecoverablePayments: 0,
  recoveryRate: 0,
  totalRevenue: 0,
  recoveredRevenue: 0,
};

export default function Analytics() {
  const [stats, setStats] = useState(initialStats);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const [statsResponse, paymentsResponse] =
        await Promise.all([
          getPaymentStats(),
          getRecentPayments(50),
        ]);

      setStats(statsResponse?.data || initialStats);
      setPayments(paymentsResponse?.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Analytics loading error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  /* =========================================================
     PAYMENT STATUS DATA
     ========================================================= */

  const statusData = useMemo(() => {
    return [
      {
        name: "Successful",
        value: Number(stats.successfulPayments || 0),
      },
      {
        name: "Failed",
        value: Number(stats.failedPayments || 0),
      },
      {
        name: "Pending",
        value: Number(stats.pendingPayments || 0),
      },
      {
        name: "Created",
        value: Number(stats.createdPayments || 0),
      },
    ].filter((item) => item.value > 0);
  }, [stats]);

  /* =========================================================
     PAYMENT METHOD DATA
     ========================================================= */

  const methodData = useMemo(() => {
    const counts = {};

    payments.forEach((payment) => {
      const method =
        payment.paymentMethod || "unknown";

      counts[method] = (counts[method] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name:
          name.charAt(0).toUpperCase() +
          name.slice(1),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [payments]);

  /* =========================================================
     FAILURE REASONS
     ========================================================= */

  const failureData = useMemo(() => {
    const reasons = {};

    payments
      .filter(
        (payment) =>
          payment.paymentStatus === "failed"
      )
      .forEach((payment) => {
        const reason =
          payment.failureReason ||
          "Unknown reason";

        reasons[reason] =
          (reasons[reason] || 0) + 1;
      });

    return Object.entries(reasons)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [payments]);

  /* =========================================================
     RECOVERY DATA
     ========================================================= */

  const recoveryData = useMemo(() => {
    return [
      {
        name: "Recovered",
        value: Number(
          stats.recoveredPayments || 0
        ),
      },
      {
        name: "In Progress",
        value: Number(
          stats.inProgressRecoveries || 0
        ),
      },
      {
        name: "Unrecoverable",
        value: Number(
          stats.unrecoverablePayments || 0
        ),
      },
    ].filter((item) => item.value > 0);
  }, [stats]);

  /* =========================================================
     REVENUE DATA
     ========================================================= */

  const revenueData = useMemo(() => {
    return [
      {
        name: "Total Revenue",
        value: Number(
          stats.totalRevenue || 0
        ),
      },
      {
        name: "Recovered Revenue",
        value: Number(
          stats.recoveredRevenue || 0
        ),
      },
    ];
  }, [stats]);

  /* =========================================================
     TOP METRICS
     ========================================================= */

  const averagePaymentValue =
    Number(stats.totalPayments || 0) > 0
      ? Number(stats.totalRevenue || 0) /
        Number(stats.totalPayments || 1)
      : 0;

  const failedValue =
    Number(stats.failedPayments || 0);

  const failedPercentage =
    Number(stats.totalPayments || 0) > 0
      ? (failedValue /
          Number(stats.totalPayments)) *
        100
      : 0;

  return (
    <div className="analytics-page">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="page-header analytics-header">
        <div>
          <span className="eyebrow">
            Analytics
          </span>

          <h1>Payment Analytics</h1>

          <p>
            Understand payment performance, failure
            patterns and recovery outcomes.
          </p>
        </div>

        <div className="analytics-header-actions">
          {lastUpdated && (
            <span className="last-updated">
              Updated{" "}
              {lastUpdated.toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>
          )}

          <button
            className="btn secondary"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "spin" : ""}
            />

            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={loadAnalytics}
        />
      ) : (
        <>
          {/* =================================================
              KPI CARDS
              ================================================= */}

          <div className="analytics-kpi-grid">
            <AnalyticsCard
              title="Total Payments"
              value={stats.totalPayments}
              icon={CreditCard}
              loading={loading}
            />

            <AnalyticsCard
              title="Success Rate"
              value={`${Number(
                stats.successRate || 0
              ).toFixed(1)}%`}
              icon={CheckCircle2}
              loading={loading}
            />

            <AnalyticsCard
              title="Average Payment"
              value={formatCurrency(
                averagePaymentValue
              )}
              icon={IndianRupee}
              loading={loading}
            />

            <AnalyticsCard
              title="Recovery Rate"
              value={`${Number(
                stats.recoveryRate || 0
              ).toFixed(1)}%`}
              icon={RotateCcw}
              loading={loading}
            />
          </div>

          {/* =================================================
              OVERVIEW
              ================================================= */}

          <div className="analytics-grid">
            <div className="card analytics-chart-card large">
              <div className="card-header">
                <div>
                  <h2>Payment outcomes</h2>

                  <p>
                    Distribution of payment statuses
                  </p>
                </div>

                <div className="header-icon">
                  <BarChart3 size={18} />
                </div>
              </div>

              <div className="analytics-chart">
                {loading ? (
                  <ChartLoading />
                ) : statusData.length === 0 ? (
                  <EmptyState
                    title="No payment data"
                    description="Analytics will appear when payments are available."
                  />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={statusData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="value"
                        radius={[
                          7,
                          7,
                          0,
                          0,
                        ]}
                      >
                        {statusData.map(
                          (entry, index) => (
                            <Cell
                              key={index}
                              fill={
                                entry.name ===
                                "Failed"
                                  ? "#ef4444"
                                  : entry.name ===
                                    "Pending"
                                  ? "#f59e0b"
                                  : entry.name ===
                                    "Created"
                                  ? "#64748b"
                                  : "#2563eb"
                              }
                            />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* STATUS SUMMARY */}

            <div className="card analytics-summary-card">
              <div className="card-header">
                <div>
                  <h2>Payment health</h2>

                  <p>
                    Current platform performance
                  </p>
                </div>

                <Activity size={18} />
              </div>

              <AnalyticsRow
                icon={CheckCircle2}
                label="Successful"
                value={stats.successfulPayments}
                type="success"
              />

              <AnalyticsRow
                icon={XCircle}
                label="Failed"
                value={stats.failedPayments}
                type="danger"
              />

              <AnalyticsRow
                icon={Clock3}
                label="Pending"
                value={stats.pendingPayments}
                type="warning"
              />

              <AnalyticsRow
                icon={RotateCcw}
                label="Recovered"
                value={stats.recoveredPayments}
                type="success"
              />
            </div>
          </div>

          {/* =================================================
              REVENUE + RECOVERY
              ================================================= */}

          <div className="analytics-grid">
            <div className="card analytics-chart-card">
              <div className="card-header">
                <div>
                  <h2>Revenue performance</h2>

                  <p>
                    Total and recovered revenue
                  </p>
                </div>

                <IndianRupee size={18} />
              </div>

              <div className="analytics-chart">
                {loading ? (
                  <ChartLoading />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={revenueData}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(value)
                        }
                      />

                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        fill="#dbeafe"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card analytics-chart-card">
              <div className="card-header">
                <div>
                  <h2>Recovery performance</h2>

                  <p>
                    Recovery outcome distribution
                  </p>
                </div>

                <TrendingUp size={18} />
              </div>

              <div className="analytics-donut">
                {loading ? (
                  <ChartLoading />
                ) : recoveryData.length === 0 ? (
                  <EmptyState
                    title="No recovery activity"
                    description="Recovery analytics will appear here."
                  />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={recoveryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {recoveryData.map(
                          (entry, index) => (
                            <Cell
                              key={index}
                              fill={
                                index === 0
                                  ? "#16a34a"
                                  : index === 1
                                  ? "#2563eb"
                                  : "#ef4444"
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="analytics-legend">
                {recoveryData.map(
                  (item, index) => (
                    <div
                      key={item.name}
                      className="analytics-legend-item"
                    >
                      <span
                        className="analytics-legend-dot"
                        style={{
                          background:
                            index === 0
                              ? "#16a34a"
                              : index === 1
                              ? "#2563eb"
                              : "#ef4444",
                        }}
                      />

                      <span>
                        {item.name}
                      </span>

                      <strong>
                        {item.value}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              PAYMENT METHODS + FAILURE REASONS
              ================================================= */}

          <div className="analytics-grid">
            <div className="card analytics-chart-card">
              <div className="card-header">
                <div>
                  <h2>Payment methods</h2>

                  <p>
                    Transactions by payment method
                  </p>
                </div>

                <CreditCard size={18} />
              </div>

              <div className="analytics-chart">
                {loading ? (
                  <ChartLoading />
                ) : methodData.length === 0 ? (
                  <EmptyState
                    title="No method data"
                    description="Payment method analytics will appear here."
                  />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={methodData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 15,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />

                      <XAxis
                        type="number"
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="value"
                        fill="#2563eb"
                        radius={[
                          0,
                          6,
                          6,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card analytics-chart-card">
              <div className="card-header">
                <div>
                  <h2>Failure analysis</h2>

                  <p>
                    Most common payment failure reasons
                  </p>
                </div>

                <XCircle size={18} />
              </div>

              <div className="analytics-chart">
                {loading ? (
                  <ChartLoading />
                ) : failureData.length === 0 ? (
                  <EmptyState
                    title="No failures"
                    description="Failure analysis will appear when failed payments are recorded."
                  />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={failureData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 15,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />

                      <XAxis
                        type="number"
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="value"
                        fill="#ef4444"
                        radius={[
                          0,
                          6,
                          6,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              INSIGHTS
              ================================================= */}

          <div className="card analytics-insights">
            <div className="card-header">
              <div>
                <h2>Key insights</h2>

                <p>
                  Automated observations from your
                  payment data
                </p>
              </div>

              <TrendingUp size={18} />
            </div>

            <div className="insight-grid">
              <Insight
                icon={CheckCircle2}
                title="Payment success"
                value={`${Number(
                  stats.successRate || 0
                ).toFixed(1)}%`}
                description="of recorded payments are successful."
                positive={
                  Number(stats.successRate) >= 80
                }
              />

              <Insight
                icon={XCircle}
                title="Failure rate"
                value={`${failedPercentage.toFixed(
                  1
                )}%`}
                description="of recorded payments have failed."
                positive={
                  failedPercentage < 10
                }
              />

              <Insight
                icon={RotateCcw}
                title="Recovery rate"
                value={`${Number(
                  stats.recoveryRate || 0
                ).toFixed(1)}%`}
                description="of eligible failed payments have been recovered."
                positive={
                  Number(stats.recoveryRate) > 0
                }
              />

              <Insight
                icon={IndianRupee}
                title="Recovered revenue"
                value={formatCurrency(
                  stats.recoveredRevenue
                )}
                description="revenue recovered through automated workflows."
                positive={
                  Number(
                    stats.recoveredRevenue
                  ) > 0
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   ANALYTICS CARD
   ========================================================= */

function AnalyticsCard({
  title,
  value,
  icon: Icon,
  loading,
}) {
  return (
    <div className="analytics-kpi-card">
      <div className="analytics-kpi-icon">
        <Icon size={19} />
      </div>

      <div className="analytics-kpi-label">
        {title}
      </div>

      {loading ? (
        <div className="analytics-kpi-skeleton" />
      ) : (
        <div className="analytics-kpi-value">
          {value}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ANALYTICS ROW
   ========================================================= */

function AnalyticsRow({
  icon: Icon,
  label,
  value,
  type,
}) {
  return (
    <div className="analytics-row">
      <div className={`analytics-row-icon ${type}`}>
        <Icon size={16} />
      </div>

      <span>{label}</span>

      <strong>
        {Number(value || 0).toLocaleString(
          "en-IN"
        )}
      </strong>
    </div>
  );
}

/* =========================================================
   INSIGHT
   ========================================================= */

function Insight({
  icon: Icon,
  title,
  value,
  description,
  positive,
}) {
  return (
    <div className="insight-card">
      <div className="insight-icon">
        <Icon size={18} />
      </div>

      <div className="insight-content">
        <span>{title}</span>

        <strong>{value}</strong>

        <p>{description}</p>
      </div>

      <div
        className={`insight-indicator ${
          positive ? "positive" : "negative"
        }`}
      >
        {positive ? (
          <ArrowUpRight size={16} />
        ) : (
          <ArrowDownRight size={16} />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function ChartLoading() {
  return (
    <div className="chart-loading">
      <RefreshCw className="spin" size={22} />

      <span>Loading analytics...</span>
    </div>
  );
}