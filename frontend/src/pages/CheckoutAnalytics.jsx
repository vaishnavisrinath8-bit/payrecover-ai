import React, { useEffect, useState } from "react";
import { getCheckoutAnalytics } from "../services/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function CheckoutAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const response = await getCheckoutAnalytics();

      setData(response?.data || response || {});
    } catch (error) {
      console.error("Checkout analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          Loading checkout analytics...
        </div>
      </div>
    );
  }

  const summary = data?.summary || data || {};

  const started =
    Number(
      summary.started ||
      summary.totalStarted ||
      summary.checkoutStarted ||
      0
    );

  const abandoned =
    Number(
      summary.abandoned ||
      summary.totalAbandoned ||
      summary.checkoutAbandoned ||
      0
    );

  const converted =
    Number(
      summary.converted ||
      summary.completed ||
      summary.totalConverted ||
      0
    );

  const abandonmentRate =
    started > 0
      ? ((abandoned / started) * 100).toFixed(1)
      : "0.0";

  const conversionRate =
    started > 0
      ? ((converted / started) * 100).toFixed(1)
      : "0.0";

  const abandonedRevenue = Number(
    summary.abandonedRevenue ||
    summary.revenueAtRisk ||
    summary.lostRevenue ||
    0
  );

  const recoveredRevenue = Number(
    summary.recoveredRevenue ||
    summary.revenueRecovered ||
    0
  );

  return (
    <div className="checkout-page">

      <div className="checkout-header">
        <div>
          <h1>Checkout Analytics</h1>

          <p>
            Monitor checkout abandonment and identify
            opportunities to recover lost revenue.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadAnalytics}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="checkout-cards">

        <div className="checkout-card">
          <span>Checkout Started</span>
          <strong>{started}</strong>
          <small>Total checkout sessions</small>
        </div>

        <div className="checkout-card">
          <span>Abandoned</span>
          <strong>{abandoned}</strong>
          <small>{abandonmentRate}% abandonment rate</small>
        </div>

        <div className="checkout-card">
          <span>Converted</span>
          <strong>{converted}</strong>
          <small>{conversionRate}% conversion rate</small>
        </div>

        <div className="checkout-card">
          <span>Revenue at Risk</span>
          <strong>{money(abandonedRevenue)}</strong>
          <small>Potentially recoverable</small>
        </div>

      </div>

      <div className="checkout-grid">

        <div className="panel funnel-panel">

          <div className="panel-header">
            <div>
              <h2>Checkout Funnel</h2>
              <p>Customer journey through checkout</p>
            </div>
          </div>

          <div className="funnel">

            <div className="funnel-step">
              <div
                className="funnel-bar"
                style={{
                  width: "100%",
                }}
              >
                <span>Checkout Started</span>
                <strong>{started}</strong>
              </div>
            </div>

            <div className="funnel-step">
              <div
                className="funnel-bar"
                style={{
                  width:
                    started > 0
                      ? `${Math.max(
                          (abandoned / started) * 100,
                          10
                        )}%`
                      : "10%",
                }}
              >
                <span>Abandoned</span>
                <strong>{abandoned}</strong>
              </div>
            </div>

            <div className="funnel-step">
              <div
                className="funnel-bar"
                style={{
                  width:
                    started > 0
                      ? `${Math.max(
                          (converted / started) * 100,
                          10
                        )}%`
                      : "10%",
                }}
              >
                <span>Converted</span>
                <strong>{converted}</strong>
              </div>
            </div>

          </div>

        </div>

        <div className="panel revenue-panel">

          <div className="panel-header">
            <div>
              <h2>Revenue Impact</h2>
              <p>Checkout recovery performance</p>
            </div>
          </div>

          <div className="revenue-row">
            <div>
              <span>Revenue at Risk</span>
              <strong>{money(abandonedRevenue)}</strong>
            </div>

            <div className="revenue-icon">
              ₹
            </div>
          </div>

          <div className="revenue-row">
            <div>
              <span>Revenue Recovered</span>
              <strong className="positive">
                {money(recoveredRevenue)}
              </strong>
            </div>

            <div className="revenue-icon">
              ✓
            </div>
          </div>

          <div className="recovery-progress">

            <div className="progress-label">
              <span>Recovery progress</span>

              <strong>
                {abandonedRevenue > 0
                  ? Math.round(
                      (recoveredRevenue /
                        abandonedRevenue) *
                        100
                    )
                  : 0}
                %
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width:
                    abandonedRevenue > 0
                      ? `${Math.min(
                          (recoveredRevenue /
                            abandonedRevenue) *
                            100,
                          100
                        )}%`
                      : "0%",
                }}
              />
            </div>

          </div>

        </div>

      </div>

      <div className="panel insight-panel">

        <div className="insight-icon">
          AI
        </div>

        <div>
          <h2>AI Recovery Insight</h2>

          <p>
            Checkout abandonment represents a direct
            opportunity for PayRecover AI. Customers who
            abandon after entering payment details can be
            prioritized for automated recovery campaigns.
          </p>
        </div>

      </div>

      <style>{`

        .checkout-page {
          min-height: 100vh;
          padding: 28px;
          background: #f7f8fc;
          color: #172033;
        }

        .checkout-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 25px;
        }

        .checkout-header h1 {
          margin: 0 0 7px;
          font-size: 28px;
        }

        .checkout-header p {
          margin: 0;
          color: #778294;
          font-size: 14px;
        }

        .refresh-btn {
          padding: 10px 16px;
          background: white;
          border: 1px solid #dfe4ec;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .checkout-cards {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .checkout-card {
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 12px;
          padding: 20px;
        }

        .checkout-card span {
          display: block;
          color: #778294;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .checkout-card strong {
          display: block;
          font-size: 25px;
          margin-bottom: 5px;
        }

        .checkout-card small {
          color: #9aa3b1;
          font-size: 12px;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.5fr)
            minmax(0, 1fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .panel {
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 12px;
          padding: 22px;
        }

        .panel-header {
          margin-bottom: 25px;
        }

        .panel-header h2 {
          margin: 0 0 5px;
          font-size: 17px;
        }

        .panel-header p {
          margin: 0;
          color: #8993a2;
          font-size: 12px;
        }

        .funnel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .funnel-step {
          display: flex;
          justify-content: center;
        }

        .funnel-bar {
          min-width: 120px;
          height: 58px;
          border-radius: 8px;
          background: #6366f1;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          transition: width .3s ease;
          box-sizing: border-box;
        }

        .funnel-bar span {
          font-size: 13px;
          font-weight: 600;
        }

        .funnel-bar strong {
          font-size: 15px;
        }

        .revenue-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #edf0f4;
        }

        .revenue-row span {
          display: block;
          color: #7c8797;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .revenue-row strong {
          font-size: 22px;
        }

        .positive {
          color: #27835b;
        }

        .revenue-icon {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #eef0ff;
          color: #5c57d9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .recovery-progress {
          margin-top: 25px;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 8px;
          color: #6f7a8b;
        }

        .progress-track {
          width: 100%;
          height: 8px;
          border-radius: 10px;
          background: #edf0f4;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #35a16f;
          border-radius: 10px;
        }

        .insight-panel {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .insight-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 10px;
          background: #eef0ff;
          color: #5b55d9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        .insight-panel h2 {
          margin: 0 0 7px;
          font-size: 16px;
        }

        .insight-panel p {
          margin: 0;
          color: #727d8e;
          font-size: 13px;
          line-height: 1.6;
        }

        .checkout-loading {
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 12px;
          padding: 60px;
          text-align: center;
          color: #718096;
        }

        @media (max-width: 900px) {

          .checkout-cards {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .checkout-grid {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 550px) {

          .checkout-page {
            padding: 18px;
          }

          .checkout-cards {
            grid-template-columns: 1fr;
          }

          .checkout-header {
            align-items: flex-start;
            gap: 15px;
          }

        }

      `}</style>
    </div>
  );
}