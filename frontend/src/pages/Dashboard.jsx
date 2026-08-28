import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
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
  formatDate,
  StatusBadge,
  Toast,
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

export default function Dashboard() {
  const [stats, setStats] = useState(initialStats);
  const [recent, setRecent] = useState([]);

  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);

  const [error, setError] = useState("");
  const [recentError, setRecentError] = useState("");

  const [toast, setToast] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setRecentLoading(true);
    setError("");
    setRecentError("");

    try {
      const [statsResponse, recentResponse] = await Promise.all([
        getPaymentStats(),
        getRecentPayments(5),
      ]);

      setStats(statsResponse?.data || initialStats);
      setRecent(recentResponse?.data || []);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      const message =
        err?.response?.data?.message ||
        "Unable to connect to the PayRecover AI backend.";

      setError(message);
      setRecentError("Unable to load recent payments.");
    } finally {
      setLoading(false);
      setRecentLoading(false);
    }
  };

  const pollDashboard = async () => {
    try {
      const [statsResponse, recentResponse] = await Promise.all([
        getPaymentStats(),
        getRecentPayments(5),
      ]);

      setStats(statsResponse?.data || initialStats);
      setRecent(recentResponse?.data || []);

      setError("");
      setRecentError("");
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      pollDashboard();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const statusData = useMemo(
    () =>
      [
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
      ].filter((item) => item.value > 0),
    [stats]
  );

  const recoveryData = useMemo(
    () =>
      [
        {
          name: "Recovered",
          value: Number(stats.recoveredPayments || 0),
        },
        {
          name: "In Progress",
          value: Number(stats.inProgressRecoveries || 0),
        },
        {
          name: "Unrecoverable",
          value: Number(stats.unrecoverablePayments || 0),
        },
      ].filter((item) => item.value > 0),
    [stats]
  );

  const revenueData = [
    {
      name: "Total Revenue",
      value: Number(stats.totalRevenue || 0),
    },
    {
      name: "Recovered Revenue",
      value: Number(stats.recoveredRevenue || 0),
    },
  ];

  const cards = [
    {
      title: "Total Payments",
      value: stats.totalPayments,
      icon: CreditCard,
      type: "number",
      color: "blue",
    },
    {
      title: "Successful Payments",
      value: stats.successfulPayments,
      icon: CheckCircle2,
      type: "number",
      color: "green",
    },
    {
      title: "Failed Payments",
      value: stats.failedPayments,
      icon: XCircle,
      type: "number",
      color: "red",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: Clock3,
      type: "number",
      color: "orange",
    },
    {
      title: "Success Rate",
      value: stats.successRate,
      icon: TrendingUp,
      type: "percent",
      color: "purple",
    },
    {
      title: "Recovery Rate",
      value: stats.recoveryRate,
      icon: RotateCcw,
      type: "percent",
      color: "cyan",
    },
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      icon: IndianRupee,
      type: "currency",
      color: "blue",
    },
    {
      title: "Recovered Revenue",
      value: stats.recoveredRevenue,
      icon: ArrowUpRight,
      type: "currency",
      color: "green",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <div className="dashboard-top">
        <div>
          <div className="dashboard-eyebrow">
            <span className="live-dot"></span>
            LIVE PAYMENT MONITORING
          </div>

          <h1>Payment Recovery Dashboard</h1>

          <p>
            Monitor transactions, payment failures and automated
            recovery performance from one workspace.
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "dashboard-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && !loading && (
        <ErrorState
          message={error}
          onRetry={loadDashboard}
        />
      )}

      {/* STAT CARDS */}
      {!error && (
        <>
          <div className="dashboard-stat-grid">
            {cards.map((card) => (
              <StatCard
                key={card.title}
                {...card}
                loading={loading}
              />
            ))}
          </div>

          {/* MAIN CHARTS */}
          <div className="dashboard-chart-grid">
            <div className="dashboard-card dashboard-chart-large">
              <div className="dashboard-card-header">
                <div>
                  <h2>Payment Performance</h2>
                  <p>Transaction outcome distribution</p>
                </div>

                <div className="dashboard-header-icon blue">
                  <Activity size={19} />
                </div>
              </div>

              <div className="dashboard-chart">
                {loading ? (
                  <LoadingChart />
                ) : statusData.length === 0 ? (
                  <EmptyState
                    title="No payment activity"
                    description="Payment statistics will appear here once transactions are recorded."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusData}
                      margin={{
                        top: 15,
                        right: 10,
                        left: -20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
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
                        allowDecimals={false}
                      />

                      <Tooltip
                        cursor={{ opacity: 0.08 }}
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                          boxShadow:
                            "0 8px 25px rgba(15,23,42,.08)",
                        }}
                      />

                      <Bar
                        dataKey="value"
                        radius={[8, 8, 0, 0]}
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              entry.name === "Failed"
                                ? "#ef4444"
                                : entry.name === "Pending"
                                ? "#f59e0b"
                                : entry.name === "Created"
                                ? "#64748b"
                                : "#2563eb"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* RECOVERY */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Recovery Overview</h2>
                  <p>Current recovery outcomes</p>
                </div>

                <div className="dashboard-header-icon green">
                  <RotateCcw size={19} />
                </div>
              </div>

              <div className="dashboard-donut">
                {loading ? (
                  <LoadingChart />
                ) : recoveryData.length === 0 ? (
                  <EmptyState
                    title="No recovery activity"
                    description="Recovery metrics will appear when failed payments enter recovery."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={recoveryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={92}
                        paddingAngle={4}
                      >
                        {recoveryData.map((entry, index) => (
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
                        ))}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {recoveryData.length > 0 && (
                <div className="dashboard-legend">
                  {recoveryData.map((item, index) => (
                    <div
                      className="dashboard-legend-item"
                      key={item.name}
                    >
                      <span
                        className="dashboard-legend-dot"
                        style={{
                          background:
                            index === 0
                              ? "#16a34a"
                              : index === 1
                              ? "#2563eb"
                              : "#ef4444",
                        }}
                      />

                      <span>{item.name}</span>

                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* REVENUE + HEALTH */}
          <div className="dashboard-bottom-grid">
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Revenue Recovery</h2>
                  <p>Generated revenue vs recovered revenue</p>
                </div>

                <div className="dashboard-header-icon purple">
                  <IndianRupee size={19} />
                </div>
              </div>

              <div className="dashboard-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="4 4"
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
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Recovery Health</h2>
                  <p>Key recovery indicators</p>
                </div>

                <div className="dashboard-header-icon green">
                  <TrendingUp size={19} />
                </div>
              </div>

              <div className="health-list">
                <HealthRow
                  label="Recovery rate"
                  value={stats.recoveryRate}
                  suffix="%"
                  positive
                />

                <HealthRow
                  label="Recovered payments"
                  value={stats.recoveredPayments}
                />

                <HealthRow
                  label="In-progress recoveries"
                  value={stats.inProgressRecoveries}
                />

                <HealthRow
                  label="Unrecoverable payments"
                  value={stats.unrecoverablePayments}
                  danger
                />
              </div>
            </div>
          </div>

          {/* RECENT PAYMENTS */}
          <div className="dashboard-card recent-payments-card">
            <div className="dashboard-card-header">
              <div>
                <h2>Recent Payments</h2>
                <p>
                  Latest transactions recorded by PayRecover AI
                </p>
              </div>

              <button
                className="dashboard-small-button"
                onClick={async () => {
                  try {
                    const response =
                      await getRecentPayments(5);

                    setRecent(response?.data || []);

                    setToast({
                      type: "success",
                      message:
                        "Recent payments refreshed.",
                    });
                  } catch {
                    setToast({
                      type: "error",
                      message:
                        "Unable to refresh recent payments.",
                    });
                  }
                }}
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            {recentLoading ? (
              <LoadingTable />
            ) : recentError ? (
              <ErrorState
                message={recentError}
                onRetry={loadDashboard}
              />
            ) : recent.length === 0 ? (
              <EmptyState
                title="No recent payments"
                description="Recent payment activity will appear here."
              />
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Recovery</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recent.map((payment) => (
                      <tr key={payment._id}>
                        <td>
                          <div className="customer-info">
                            <div className="customer-avatar">
                              {payment.customerName
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </div>

                            <div>
                              <strong>
                                {payment.customerName ||
                                  "Unknown customer"}
                              </strong>

                              <span>
                                {payment.customerEmail ||
                                  "No email"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              payment.amount,
                              payment.currency || "INR"
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="payment-method">
                            {payment.paymentMethod || "—"}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={payment.paymentStatus}
                          />
                        </td>

                        <td>
                          <StatusBadge
                            status={payment.recoveryStatus}
                          />
                        </td>

                        <td className="date-cell">
                          {formatDate(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  type,
  color,
  loading,
}) {
  let displayValue = value;

  if (type === "currency") {
    displayValue = formatCurrency(value);
  } else if (type === "percent") {
    displayValue = `${Number(value || 0).toFixed(1)}%`;
  } else {
    displayValue = Number(value || 0).toLocaleString(
      "en-IN"
    );
  }

  return (
    <div className="dashboard-stat-card">
      <div className="stat-card-top">
        <div className={`stat-card-icon ${color}`}>
          <Icon size={19} />
        </div>

        <ArrowUpRight
          size={16}
          className="stat-arrow"
        />
      </div>

      <span className="stat-card-title">{title}</span>

      {loading ? (
        <div className="stat-value-skeleton"></div>
      ) : (
        <strong className="stat-card-value">
          {displayValue}
        </strong>
      )}
    </div>
  );
}

function HealthRow({
  label,
  value,
  suffix = "",
  positive,
  danger,
}) {
  return (
    <div className="health-row">
      <span>{label}</span>

      <strong
        className={
          danger
            ? "health-danger"
            : positive
            ? "health-positive"
            : ""
        }
      >
        {Number(value || 0).toLocaleString("en-IN")}
        {suffix}
      </strong>
    </div>
  );
}

function LoadingChart() {
  return (
    <div className="dashboard-loading">
      <RefreshCw className="dashboard-spin" size={25} />
      <span>Loading analytics...</span>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="dashboard-loading table-loading">
      <RefreshCw className="dashboard-spin" size={22} />
      <span>Loading recent payments...</span>
    </div>
  );
}