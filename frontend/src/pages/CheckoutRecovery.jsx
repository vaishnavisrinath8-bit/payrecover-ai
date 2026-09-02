
import React, { useEffect, useMemo, useState } from "react";
import {
  getCheckoutAnalytics,
  startCheckout,
  abandonCheckout,
} from "../services/api";

export default function CheckoutRecovery() {
  const [analytics, setAnalytics] = useState(null);
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      const response = await getCheckoutAnalytics();

      const data = response?.data || {};

      setAnalytics(data);

      const list =
        data.checkouts ||
        data.abandonedCheckouts ||
        data.recentCheckouts ||
        [];

      setCheckouts(
        Array.isArray(list) ? list : []
      );
    } catch (error) {
      console.error(
        "Checkout analytics error:",
        error
      );

      setMessage(
        error?.response?.data?.message ||
          "Unable to load checkout recovery data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const getValue = (...values) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return 0;
  };

  const totalCheckouts = Number(
    getValue(
      analytics?.totalCheckouts,
      analytics?.summary?.totalCheckouts,
      analytics?.total
    )
  );

  const abandonedCheckouts = Number(
    getValue(
      analytics?.abandonedCheckouts,
      analytics?.summary?.abandonedCheckouts,
      analytics?.abandoned
    )
  );

  const recoveredCheckouts = Number(
    getValue(
      analytics?.recoveredCheckouts,
      analytics?.summary?.recoveredCheckouts,
      analytics?.recovered
    )
  );

  const revenueAtRisk = Number(
    getValue(
      analytics?.revenueAtRisk,
      analytics?.summary?.revenueAtRisk
    )
  );

  const filteredCheckouts = useMemo(() => {
    return checkouts.filter((checkout) => {
      const name = String(
        checkout.customerName ||
          checkout.name ||
          ""
      ).toLowerCase();

      const email = String(
        checkout.customerEmail ||
          checkout.email ||
          ""
      ).toLowerCase();

      const status = String(
        checkout.status || ""
      ).toLowerCase();

      const text = search.toLowerCase();

      const matchesSearch =
        name.includes(text) ||
        email.includes(text);

      let matchesFilter = true;

      if (filter === "abandoned") {
        matchesFilter =
          status === "abandoned";
      }

      if (filter === "recovered") {
        matchesFilter =
          status === "recovered";
      }

      if (filter === "active") {
        matchesFilter =
          status === "active" ||
          status === "started" ||
          status === "created";
      }

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [checkouts, search, filter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(Number(amount || 0));
  };

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Unknown";
    }

    return parsed.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatus = (checkout) => {
    return String(
      checkout.status || "abandoned"
    ).toLowerCase();
  };

  const getProbability = (checkout) => {
    return Number(
      getValue(
        checkout.recoveryProbability,
        checkout.aiRecoveryProbability,
        checkout.probability,
        0
      )
    );
  };

  const getAmount = (checkout) => {
    return Number(
      getValue(
        checkout.amount,
        checkout.totalAmount,
        checkout.value,
        0
      )
    );
  };

  const getCustomerName = (checkout) => {
    return (
      checkout.customerName ||
      checkout.name ||
      "Unknown Customer"
    );
  };

  const handleRecover = async (checkout) => {
    try {
      setMessage("");

      const checkoutId =
        checkout._id ||
        checkout.id ||
        checkout.checkoutId;

      if (!checkoutId) {
        setMessage(
          "Checkout ID is missing."
        );
        return;
      }

      await startCheckout({
        checkoutId,
        customerName:
          checkout.customerName ||
          checkout.name,
        customerEmail:
          checkout.customerEmail ||
          checkout.email,
        amount: getAmount(checkout),
        recoveryAction:
          "recover_abandoned_checkout",
      });

      setMessage(
        `Recovery workflow started for ${getCustomerName(
          checkout
        )}.`
      );

      await loadCheckoutData();
    } catch (error) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Unable to start checkout recovery."
      );
    }
  };

  const handleMarkAbandoned = async (
    checkout
  ) => {
    try {
      setMessage("");

      const checkoutId =
        checkout._id ||
        checkout.id ||
        checkout.checkoutId;

      if (!checkoutId) {
        setMessage(
          "Checkout ID is missing."
        );
        return;
      }

      await abandonCheckout({
        checkoutId,
        customerName:
          checkout.customerName ||
          checkout.name,
        customerEmail:
          checkout.customerEmail ||
          checkout.email,
        amount: getAmount(checkout),
      });

      setMessage(
        "Checkout marked as abandoned."
      );

      await loadCheckoutData();
    } catch (error) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Unable to update checkout."
      );
    }
  };

  return (
    <div
      style={{
        padding: "28px",
        maxWidth: "1500px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "26px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Checkout Recovery
          </h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#64748b",
              fontSize: "15px",
            }}
          >
            Detect abandoned checkouts and
            recover lost revenue with AI-driven
            interventions.
          </p>
        </div>

        <button
          onClick={loadCheckoutData}
          style={{
            padding: "11px 18px",
            borderRadius: "9px",
            border: "1px solid #dbe2ea",
            background: "#ffffff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Refresh
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          style={{
            padding: "13px 16px",
            marginBottom: "20px",
            borderRadius: "9px",
            background: "#f1f5f9",
            color: "#334155",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "18px",
          marginBottom: "25px",
        }}
      >
        <SummaryCard
          title="Total Checkouts"
          value={totalCheckouts}
          subtitle="Tracked sessions"
        />

        <SummaryCard
          title="Abandoned"
          value={abandonedCheckouts}
          subtitle="Potential recovery cases"
        />

        <SummaryCard
          title="Recovered"
          value={recoveredCheckouts}
          subtitle="Successful recoveries"
        />

        <SummaryCard
          title="Revenue at Risk"
          value={formatCurrency(
            revenueAtRisk
          )}
          subtitle="Potentially recoverable"
        />
      </div>

      {/* RECOVERY FLOW */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "22px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
          }}
        >
          AI Checkout Recovery Flow
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          <FlowStep
            number="01"
            title="Detect"
            text="Identify checkout drop-off."
          />

          <FlowStep
            number="02"
            title="Score"
            text="Estimate recovery probability."
          />

          <FlowStep
            number="03"
            title="Intervene"
            text="Choose the best recovery action."
          />

          <FlowStep
            number="04"
            title="Recover"
            text="Track recovered money."
          />
        </div>
      </div>

      {/* FILTERS */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search customer or email..."
          style={{
            flex: 1,
            minWidth: "260px",
            padding: "12px 14px",
            border:
              "1px solid #dbe2ea",
            borderRadius: "9px",
            outline: "none",
          }}
        />

        {[
          ["all", "All"],
          ["abandoned", "Abandoned"],
          ["active", "Active"],
          ["recovered", "Recovered"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() =>
              setFilter(value)
            }
            style={{
              padding: "11px 16px",
              borderRadius: "9px",
              border:
                filter === value
                  ? "1px solid #111827"
                  : "1px solid #dbe2ea",
              background:
                filter === value
                  ? "#111827"
                  : "#ffffff",
              color:
                filter === value
                  ? "#ffffff"
                  : "#334155",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "50px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          Loading checkout recovery data...
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        filteredCheckouts.length === 0 && (
          <div
            style={{
              background: "#ffffff",
              border:
                "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "55px 20px",
              textAlign: "center",
            }}
          >
            <h3>
              No checkout records found
            </h3>

            <p
              style={{
                color: "#64748b",
              }}
            >
              Checkout data will appear here
              when sessions are tracked.
            </p>
          </div>
        )}

      {/* CHECKOUT RECORDS */}
      {!loading &&
        filteredCheckouts.map(
          (checkout, index) => {
            const status =
              getStatus(checkout);

            const probability =
              getProbability(checkout);

            const amount =
              getAmount(checkout);

            const isRecovered =
              status === "recovered";

            return (
              <div
                key={
                  checkout._id ||
                  checkout.id ||
                  index
                }
                style={{
                  background:
                    "#ffffff",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "22px",
                  marginBottom: "16px",
                }}
              >
                {/* TOP */}
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    gap: "20px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems:
                          "center",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize:
                            "19px",
                        }}
                      >
                        {getCustomerName(
                          checkout
                        )}
                      </h3>

                      <span
                        style={{
                          padding:
                            "5px 10px",
                          borderRadius:
                            "20px",
                          background:
                            isRecovered
                              ? "#dcfce7"
                              : "#fef3c7",
                          color:
                            isRecovered
                              ? "#166534"
                              : "#92400e",
                          fontSize:
                            "12px",
                          fontWeight:
                            700,
                        }}
                      >
                        {status}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop:
                          "7px",
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                      }}
                    >
                      {checkout.customerEmail ||
                        checkout.email ||
                        "No email available"}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign:
                        "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "24px",
                        fontWeight:
                          700,
                      }}
                    >
                      {formatCurrency(
                        amount
                      )}
                    </div>

                    <div
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "12px",
                      }}
                    >
                      Checkout value
                    </div>
                  </div>
                </div>

                {/* METRICS */}
                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(4, minmax(0, 1fr))",
                    gap: "12px",
                    marginTop:
                      "20px",
                  }}
                >
                  <Metric
                    label="Recovery Probability"
                    value={`${probability}%`}
                  />

                  <Metric
                    label="Checkout Started"
                    value={formatDate(
                      checkout.createdAt ||
                        checkout.startedAt
                    )}
                  />

                  <Metric
                    label="Last Activity"
                    value={formatDate(
                      checkout.updatedAt ||
                        checkout.lastActivityAt
                    )}
                  />

                  <Metric
                    label="Recommended Action"
                    value={
                      checkout.recommendedAction ||
                      "Recovery Email"
                    }
                  />
                </div>

                {/* AI RECOMMENDATION */}
                <div
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "14px 16px",
                    borderRadius:
                      "10px",
                    background:
                      "#f8fafc",
                    border:
                      "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      fontWeight:
                        700,
                      color:
                        "#64748b",
                      marginBottom:
                        "5px",
                    }}
                  >
                    AI RECOMMENDATION
                  </div>

                  <div
                    style={{
                      fontSize:
                        "14px",
                      color:
                        "#334155",
                    }}
                  >
                    {checkout.recommendedAction
                      ? String(
                          checkout.recommendedAction
                        ).replace(
                          /_/g,
                          " "
                        )
                      : probability >=
                        70
                      ? "High recovery potential — contact the customer immediately."
                      : probability >=
                        40
                      ? "Moderate recovery potential — send a personalized reminder."
                      : "Low recovery probability — avoid repeated intervention."}
                  </div>
                </div>

                {/* ACTIONS */}
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    gap: "10px",
                    marginTop:
                      "18px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  {!isRecovered && (
                    <button
                      onClick={() =>
                        handleRecover(
                          checkout
                        )
                      }
                      style={{
                        padding:
                          "10px 16px",
                        borderRadius:
                          "8px",
                        border:
                          "1px solid #111827",
                        background:
                          "#111827",
                        color:
                          "#ffffff",
                        cursor:
                          "pointer",
                        fontWeight:
                          600,
                      }}
                    >
                      Start Recovery
                    </button>
                  )}

                  {!isRecovered &&
                    status !==
                      "abandoned" && (
                      <button
                        onClick={() =>
                          handleMarkAbandoned(
                            checkout
                          )
                        }
                        style={{
                          padding:
                            "10px 16px",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #fecaca",
                          background:
                            "#ffffff",
                          color:
                            "#b91c1c",
                          cursor:
                            "pointer",
                          fontWeight:
                            600,
                        }}
                      >
                        Mark Abandoned
                      </button>
                    )}
                </div>
              </div>
            );
          }
        )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border:
          "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#64748b",
          fontWeight: 600,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "27px",
          fontWeight: 700,
          marginTop: "8px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "5px",
          color: "#94a3b8",
          fontSize: "12px",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function FlowStep({
  number,
  title,
  text,
}) {
  return (
    <div
      style={{
        padding: "16px",
        background: "#f8fafc",
        borderRadius: "10px",
        border:
          "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#64748b",
          fontWeight: 700,
        }}
      >
        {number}
      </div>

      <div
        style={{
          marginTop: "6px",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "12px",
          color: "#64748b",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: "13px",
        background: "#f8fafc",
        borderRadius: "9px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#64748b",
          fontWeight: 700,
          textTransform:
            "uppercase",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#1e293b",
          wordBreak:
            "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

