import React, { useEffect, useMemo, useState } from "react";
import {
  getPaymentStats,
  getRecentPayments,
  getAllPayments,
  getAllRecoveries,
} from "../services/api";

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
};

const getStatus = (item) => {
  return String(
    item?.status ||
      item?.paymentStatus ||
      item?.recoveryStatus ||
      item?.state ||
      ""
  ).toLowerCase();
};

const getAmount = (item) => {
  return Number(
    item?.amount ??
      item?.paymentAmount ??
      item?.transactionAmount ??
      item?.value ??
      0
  );
};

const getDate = (item) => {
  return (
    item?.createdAt ||
    item?.created_at ||
    item?.date ||
    item?.paymentDate ||
    item?.updatedAt ||
    new Date().toISOString()
  );
};

const isSuccessful = (item) => {
  const status = getStatus(item);

  return [
    "success",
    "successful",
    "paid",
    "completed",
    "captured",
    "recovered",
    "recovered_successfully",
  ].includes(status);
};

const isFailed = (item) => {
  const status = getStatus(item);

  return [
    "failed",
    "failure",
    "failure_payment",
    "declined",
    "cancelled",
    "canceled",
    "unpaid",
  ].includes(status);
};

const isRecovered = (item) => {
  const status = getStatus(item);

  return [
    "recovered",
    "success",
    "successful",
    "completed",
    "paid",
  ].includes(status);
};

function StatCard({ title, value, subtitle, icon, className = "" }) {
  return (
    <div className={`analytics-stat-card ${className}`}>
      <div className="analytics-stat-top">
        <div>
          <div className="analytics-stat-title">{title}</div>
          <div className="analytics-stat-value">{value}</div>
        </div>

        <div className="analytics-stat-icon">{icon}</div>
      </div>

      {subtitle && (
        <div className="analytics-stat-subtitle">{subtitle}</div>
      )}
    </div>
  );
}

function SimpleBarChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="analytics-bar-chart">
      {data.map((item) => {
        const height = Math.max((item.value / max) * 100, 4);

        return (
          <div className="analytics-bar-column" key={item.label}>
            <div className="analytics-bar-value">
              {formatCurrency(item.value)}
            </div>

            <div className="analytics-bar-track">
              <div
                className="analytics-bar-fill"
                style={{ height: `${height}%` }}
              />
            </div>

            <div className="analytics-bar-label">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ successful, failed, pending }) {
  const total = successful + failed + pending;

  if (total === 0) {
    return (
      <div className="analytics-donut-empty">
        <div className="analytics-donut-empty-circle">
          <strong>0</strong>
          <span>Payments</span>
        </div>
      </div>
    );
  }

  const successPercent = (successful / total) * 100;
  const failedPercent = (failed / total) * 100;

  return (
    <div className="analytics-donut-wrapper">
      <div
        className="analytics-donut"
        style={{
          background: `conic-gradient(
            #16a34a 0% ${successPercent}%,
            #dc2626 ${successPercent}% ${
            successPercent + failedPercent
          }%,
            #f59e0b ${successPercent + failedPercent}% 100%
          )`,
        }}
      >
        <div className="analytics-donut-inner">
          <strong>{formatNumber(total)}</strong>
          <span>Total</span>
        </div>
      </div>

      <div className="analytics-legend">
        <div className="analytics-legend-item">
          <span className="legend-dot success" />
          <span>Successful</span>
          <strong>{formatNumber(successful)}</strong>
        </div>

        <div className="analytics-legend-item">
          <span className="legend-dot failed" />
          <span>Failed</span>
          <strong>{formatNumber(failed)}</strong>
        </div>

        <div className="analytics-legend-item">
          <span className="legend-dot pending" />
          <span>Pending</span>
          <strong>{formatNumber(pending)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [payments, setPayments] = useState([]);
  const [recoveries, setRecoveries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [apiStats, setApiStats] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      setLoading(true);
      setError("");

      let paymentData = [];
      let recoveryData = [];

      /*
       * ---------------------------------------------------------
       * 1. TRY PAYMENT STATS API
       * ---------------------------------------------------------
       */

      try {
        if (typeof getPaymentStats === "function") {
          const response = await getPaymentStats();

          if (mounted) {
            setApiStats(response?.data || response);
          }
        }
      } catch (err) {
        console.warn("Payment stats API unavailable:", err);
      }

      /*
       * ---------------------------------------------------------
       * 2. LOAD PAYMENTS
       * ---------------------------------------------------------
       */

      try {
        if (typeof getAllPayments === "function") {
          const response = await getAllPayments();

          paymentData =
            response?.data?.payments ||
            response?.data?.data ||
            response?.data ||
            response?.payments ||
            response ||
            [];

          if (!Array.isArray(paymentData)) {
            paymentData = [];
          }
        }
      } catch (err) {
        console.warn("getAllPayments failed:", err);

        /*
         * Fallback to recent payments.
         */

        try {
          if (typeof getRecentPayments === "function") {
            const response = await getRecentPayments();

            paymentData =
              response?.data?.payments ||
              response?.data?.data ||
              response?.data ||
              response?.payments ||
              response ||
              [];

            if (!Array.isArray(paymentData)) {
              paymentData = [];
            }
          }
        } catch (recentError) {
          console.warn(
            "getRecentPayments also failed:",
            recentError
          );
        }
      }

      /*
       * ---------------------------------------------------------
       * 3. LOAD RECOVERIES
       * ---------------------------------------------------------
       */

      try {
        if (typeof getAllRecoveries === "function") {
          const response = await getAllRecoveries();

          recoveryData =
            response?.data?.recoveries ||
            response?.data?.data ||
            response?.data ||
            response?.recoveries ||
            response ||
            [];

          if (!Array.isArray(recoveryData)) {
            recoveryData = [];
          }
        }
      } catch (err) {
        console.warn("getAllRecoveries failed:", err);
      }

      if (mounted) {
        setPayments(paymentData);
        setRecoveries(recoveryData);
        setLoading(false);

        if (
          paymentData.length === 0 &&
          recoveryData.length === 0
        ) {
          setError(
            "No payment or recovery records were returned by the backend."
          );
        }
      }
    };

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * -----------------------------------------------------------
   * ANALYTICS CALCULATIONS
   * -----------------------------------------------------------
   */

  const analytics = useMemo(() => {
    const totalPayments = payments.length;

    const successfulPayments = payments.filter(isSuccessful);

    const failedPayments = payments.filter(isFailed);

    const pendingPayments = payments.filter((payment) => {
      return !isSuccessful(payment) && !isFailed(payment);
    });

    const totalPaymentValue = payments.reduce(
      (sum, payment) => sum + getAmount(payment),
      0
    );

    const successfulValue = successfulPayments.reduce(
      (sum, payment) => sum + getAmount(payment),
      0
    );

    const failedValue = failedPayments.reduce(
      (sum, payment) => sum + getAmount(payment),
      0
    );

    const totalRecoveries = recoveries.length;

    const recoveredRecords = recoveries.filter(isRecovered);

    const recoveredAmount = recoveries.reduce((sum, recovery) => {
      return sum + getAmount(recovery);
    }, 0);

    const recoveryRate =
      totalRecoveries > 0
        ? (recoveredRecords.length / totalRecoveries) * 100
        : 0;

    const successRate =
      totalPayments > 0
        ? (successfulPayments.length / totalPayments) * 100
        : 0;

    /*
     * ---------------------------------------------------------
     * LAST 7 DAYS
     * ---------------------------------------------------------
     */

    const dailyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayPayments = payments.filter((payment) => {
        const paymentDate = new Date(getDate(payment));

        return (
          paymentDate >= date &&
          paymentDate < nextDate
        );
      });

      const amount = dayPayments.reduce(
        (sum, payment) => sum + getAmount(payment),
        0
      );

      dailyData.push({
        label: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        value: amount,
      });
    }

    /*
     * ---------------------------------------------------------
     * FAILURE REASONS
     * ---------------------------------------------------------
     */

    const failureReasons = {};

    failedPayments.forEach((payment) => {
      const reason =
        payment?.failureReason ||
        payment?.failure_reason ||
        payment?.errorDescription ||
        payment?.reason ||
        payment?.error ||
        "Other";

      failureReasons[reason] =
        (failureReasons[reason] || 0) + 1;
    });

    const failureReasonData = Object.entries(failureReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalPayments,
      successfulPayments: successfulPayments.length,
      failedPayments: failedPayments.length,
      pendingPayments: pendingPayments.length,

      totalPaymentValue,
      successfulValue,
      failedValue,

      totalRecoveries,
      recoveredCount: recoveredRecords.length,
      recoveredAmount,

      recoveryRate,
      successRate,

      dailyData,
      failureReasonData,
    };
  }, [payments, recoveries]);

  /*
   * -----------------------------------------------------------
   * API STATS FALLBACK
   * -----------------------------------------------------------
   */

  const displayedStats = {
    totalPayments:
      analytics.totalPayments ||
      Number(
        apiStats?.totalPayments ||
          apiStats?.total ||
          apiStats?.count ||
          0
      ),

    successfulPayments:
      analytics.successfulPayments ||
      Number(
        apiStats?.successfulPayments ||
          apiStats?.successful ||
          apiStats?.successCount ||
          0
      ),

    failedPayments:
      analytics.failedPayments ||
      Number(
        apiStats?.failedPayments ||
          apiStats?.failed ||
          apiStats?.failureCount ||
          0
      ),

    recoveredAmount:
      analytics.recoveredAmount ||
      Number(
        apiStats?.recoveredAmount ||
          apiStats?.totalRecovered ||
          0
      ),
  };

  /*
   * -----------------------------------------------------------
   * LOADING
   * -----------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <div className="analytics-spinner" />
          <h3>Loading analytics...</h3>
          <p>
            Fetching payment and recovery performance data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <style>{`
        .analytics-page {
          padding: 28px;
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          box-sizing: border-box;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          gap: 20px;
        }

        .analytics-header h1 {
          margin: 0 0 7px;
          font-size: 30px;
          font-weight: 750;
          letter-spacing: -0.6px;
        }

        .analytics-header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .analytics-live {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ecfdf5;
          color: #15803d;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 650;
        }

        .analytics-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
        }

        .analytics-error {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .analytics-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }

        .analytics-stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
        }

        .analytics-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .analytics-stat-title {
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .analytics-stat-value {
          font-size: 25px;
          font-weight: 750;
          color: #0f172a;
        }

        .analytics-stat-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f1f5f9;
          font-size: 20px;
        }

        .analytics-stat-subtitle {
          margin-top: 12px;
          font-size: 12px;
          color: #64748b;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(320px, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .analytics-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
        }

        .analytics-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 12px;
        }

        .analytics-panel-header h2 {
          margin: 0 0 5px;
          font-size: 17px;
          font-weight: 720;
        }

        .analytics-panel-header p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
        }

        .analytics-bar-chart {
          height: 290px;
          display: flex;
          align-items: stretch;
          justify-content: space-around;
          gap: 12px;
          padding: 15px 4px 0;
        }

        .analytics-bar-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          min-width: 30px;
        }

        .analytics-bar-value {
          font-size: 10px;
          color: #64748b;
          margin-bottom: 7px;
          white-space: nowrap;
        }

        .analytics-bar-track {
          height: 210px;
          width: min(42px, 80%);
          background: #f1f5f9;
          border-radius: 8px 8px 4px 4px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .analytics-bar-fill {
          width: 100%;
          background: linear-gradient(
            180deg,
            #2563eb,
            #60a5fa
          );
          border-radius: 8px 8px 4px 4px;
          min-height: 4px;
          transition: height 0.5s ease;
        }

        .analytics-bar-label {
          margin-top: 9px;
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }

        .analytics-donut-wrapper {
          min-height: 290px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 35px;
        }

        .analytics-donut {
          width: 185px;
          height: 185px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .analytics-donut-inner {
          width: 125px;
          height: 125px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .analytics-donut-inner strong {
          font-size: 25px;
          font-weight: 750;
        }

        .analytics-donut-inner span {
          color: #64748b;
          font-size: 11px;
          margin-top: 3px;
        }

        .analytics-legend {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .analytics-legend-item {
          display: grid;
          grid-template-columns: 9px auto auto;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #475569;
        }

        .analytics-legend-item strong {
          color: #0f172a;
          margin-left: 8px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.success {
          background: #16a34a;
        }

        .legend-dot.failed {
          background: #dc2626;
        }

        .legend-dot.pending {
          background: #f59e0b;
        }

        .analytics-donut-empty {
          min-height: 290px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .analytics-donut-empty-circle {
          width: 185px;
          height: 185px;
          border: 24px solid #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .analytics-donut-empty-circle strong {
          font-size: 25px;
        }

        .analytics-donut-empty-circle span {
          color: #64748b;
          font-size: 11px;
        }

        .analytics-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .analytics-progress-row {
          margin-bottom: 20px;
        }

        .analytics-progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .analytics-progress-header span {
          color: #475569;
        }

        .analytics-progress-header strong {
          color: #0f172a;
        }

        .analytics-progress-track {
          height: 9px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .analytics-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #2563eb,
            #60a5fa
          );
        }

        .analytics-failure-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .analytics-failure-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .analytics-failure-name {
          font-size: 13px;
          color: #475569;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .analytics-failure-count {
          min-width: 28px;
          text-align: center;
          padding: 4px 8px;
          border-radius: 7px;
          background: #fef2f2;
          color: #dc2626;
          font-size: 11px;
          font-weight: 700;
        }

        .analytics-empty {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }

        .analytics-empty-icon {
          font-size: 34px;
          margin-bottom: 10px;
        }

        .analytics-empty h3 {
          margin: 0 0 5px;
          color: #334155;
          font-size: 15px;
        }

        .analytics-empty p {
          margin: 0;
          font-size: 12px;
        }

        .analytics-loading {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
        }

        .analytics-spinner {
          width: 35px;
          height: 35px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: analytics-spin 0.8s linear infinite;
          margin-bottom: 15px;
        }

        .analytics-loading h3 {
          margin: 0 0 5px;
        }

        .analytics-loading p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        @keyframes analytics-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .analytics-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .analytics-page {
            padding: 16px;
          }

          .analytics-header {
            flex-direction: column;
          }

          .analytics-stat-grid {
            grid-template-columns: 1fr;
          }

          .analytics-bottom-grid {
            grid-template-columns: 1fr;
          }

          .analytics-donut-wrapper {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>
            Monitor payment performance, failures and recovery
            outcomes.
          </p>
        </div>

        <div className="analytics-live">
          <span className="analytics-live-dot" />
          Analytics Dashboard
        </div>
      </div>

      {error && (
        <div className="analytics-error">
          ⚠️ {error}
        </div>
      )}

      {/* -------------------------------------------------------
          STAT CARDS
      ------------------------------------------------------- */}

      <div className="analytics-stat-grid">
        <StatCard
          title="Total Payments"
          value={formatNumber(displayedStats.totalPayments)}
          subtitle={`${formatCurrency(
            analytics.totalPaymentValue
          )} processed`}
          icon="💳"
        />

        <StatCard
          title="Successful Payments"
          value={formatNumber(
            displayedStats.successfulPayments
          )}
          subtitle={`${analytics.successRate.toFixed(
            1
          )}% success rate`}
          icon="✓"
        />

        <StatCard
          title="Failed Payments"
          value={formatNumber(displayedStats.failedPayments)}
          subtitle={formatCurrency(analytics.failedValue)}
          icon="!"
        />

        <StatCard
          title="Recovered Amount"
          value={formatCurrency(
            displayedStats.recoveredAmount
          )}
          subtitle={`${analytics.recoveryRate.toFixed(
            1
          )}% recovery rate`}
          icon="↻"
        />
      </div>

      {/* -------------------------------------------------------
          CHARTS
      ------------------------------------------------------- */}

      <div className="analytics-grid">
        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>Payment Volume</h2>
              <p>Payment value processed over the last 7 days</p>
            </div>
          </div>

          {analytics.totalPayments === 0 ? (
            <div className="analytics-empty">
              <div className="analytics-empty-icon">
                📊
              </div>

              <h3>No payment data available</h3>

              <p>
                Payment records will appear here once the
                backend returns data.
              </p>
            </div>
          ) : (
            <SimpleBarChart data={analytics.dailyData} />
          )}
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>Payment Success Rate</h2>
              <p>Current payment outcome distribution</p>
            </div>
          </div>

          <DonutChart
            successful={analytics.successfulPayments}
            failed={analytics.failedPayments}
            pending={analytics.pendingPayments}
          />
        </div>
      </div>

      {/* -------------------------------------------------------
          BOTTOM ANALYTICS
      ------------------------------------------------------- */}

      <div className="analytics-bottom-grid">
        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>Recovery Performance</h2>
              <p>
                How effectively failed payments are being
                recovered
              </p>
            </div>
          </div>

          <div className="analytics-progress-row">
            <div className="analytics-progress-header">
              <span>Recovery Rate</span>

              <strong>
                {analytics.recoveryRate.toFixed(1)}%
              </strong>
            </div>

            <div className="analytics-progress-track">
              <div
                className="analytics-progress-fill"
                style={{
                  width: `${Math.min(
                    analytics.recoveryRate,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="analytics-progress-row">
            <div className="analytics-progress-header">
              <span>Payment Success Rate</span>

              <strong>
                {analytics.successRate.toFixed(1)}%
              </strong>
            </div>

            <div className="analytics-progress-track">
              <div
                className="analytics-progress-fill"
                style={{
                  width: `${Math.min(
                    analytics.successRate,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="analytics-progress-row">
            <div className="analytics-progress-header">
              <span>Recovered Transactions</span>

              <strong>
                {formatNumber(analytics.recoveredCount)} /{" "}
                {formatNumber(analytics.totalRecoveries)}
              </strong>
            </div>

            <div className="analytics-progress-track">
              <div
                className="analytics-progress-fill"
                style={{
                  width: `${Math.min(
                    analytics.recoveryRate,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="analytics-progress-row">
            <div className="analytics-progress-header">
              <span>Recovered Value</span>

              <strong>
                {formatCurrency(analytics.recoveredAmount)}
              </strong>
            </div>
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>Top Failure Reasons</h2>
              <p>
                Most common reasons for unsuccessful payments
              </p>
            </div>
          </div>

          {analytics.failureReasonData.length === 0 ? (
            <div className="analytics-empty">
              <div className="analytics-empty-icon">
                ✓
              </div>

              <h3>No failure reasons</h3>

              <p>
                Failure reason analytics will appear when
                failed payment data is available.
              </p>
            </div>
          ) : (
            <div className="analytics-failure-list">
              {analytics.failureReasonData.map(
                ([reason, count]) => (
                  <div
                    className="analytics-failure-row"
                    key={reason}
                  >
                    <div className="analytics-failure-name">
                      {reason}
                    </div>

                    <div className="analytics-failure-count">
                      {count}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}