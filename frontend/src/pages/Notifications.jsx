import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";

import {
  getAllRecoveries,
  getAllPayments,
} from "../services/api";

import "./Notifications.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getArray(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.recoveries)) {
    return response.recoveries;
  }

  if (Array.isArray(response?.data?.recoveries)) {
    return response.data.recoveries;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadNotifications(refresh = false) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [recoveryResponse, paymentResponse] =
        await Promise.all([
          getAllRecoveries(),
          getAllPayments(),
        ]);

      const recoveries = getArray(recoveryResponse);
      const payments = getArray(paymentResponse);

      const generated = [];

      recoveries.forEach((recovery, index) => {
        const status = String(
          recovery?.status ||
            recovery?.recoveryStatus ||
            "pending"
        ).toLowerCase();

        const customer =
          recovery?.customerName ||
          recovery?.payment?.customerName ||
          "Customer";

        const amount = Number(
          recovery?.amount ||
            recovery?.payment?.amount ||
            0
        );

        const failureReason =
          recovery?.failureReason ||
          recovery?.payment?.failureReason ||
          recovery?.reason ||
          "Payment failure";

        const id =
          recovery?._id ||
          recovery?.id ||
          `recovery-${index}`;

        if (status === "recovered") {
          generated.push({
            id: `recovered-${id}`,
            type: "success",
            title: "Payment recovered",
            message: `${customer} recovered ${formatCurrency(
              recovery?.recoveredAmount || amount
            )}.`,
            timestamp:
              recovery?.recoveredAt ||
              recovery?.updatedAt,
            unread: true,
            category: "Recovery",
          });
        } else if (
          status === "unrecoverable"
        ) {
          generated.push({
            id: `unrecoverable-${id}`,
            type: "danger",
            title: "Recovery stopped",
            message: `Recovery for ${customer} was marked unrecoverable.`,
            timestamp:
              recovery?.updatedAt,
            unread: true,
            category: "Recovery",
          });
        } else if (
          status === "contacted"
        ) {
          generated.push({
            id: `contacted-${id}`,
            type: "info",
            title: "Customer contacted",
            message: `Recovery communication was initiated for ${customer}.`,
            timestamp:
              recovery?.lastActionAt ||
              recovery?.lastAttemptAt ||
              recovery?.updatedAt,
            unread: false,
            category: "Communication",
          });
        } else {
          generated.push({
            id: `active-${id}`,
            type: "warning",
            title: "Recovery requires attention",
            message: `${customer} has ${failureReason} with ${formatCurrency(
              amount
            )} at risk.`,
            timestamp:
              recovery?.nextActionAt ||
              recovery?.updatedAt ||
              recovery?.createdAt,
            unread: true,
            category: "Recovery",
          });
        }
      });

      payments.forEach((payment, index) => {
        const status = String(
          payment?.paymentStatus || ""
        ).toLowerCase();

        if (status !== "failed") {
          return;
        }

        const id =
          payment?._id ||
          payment?.id ||
          `payment-${index}`;

        generated.push({
          id: `payment-failed-${id}`,
          type: "danger",
          title: "Payment failed",
          message: `${
            payment?.customerName || "Customer"
          } payment of ${formatCurrency(
            payment?.amount
          )} failed due to ${
            payment?.failureReason ||
            "payment processing error"
          }.`,
          timestamp:
            payment?.updatedAt ||
            payment?.createdAt,
          unread: true,
          category: "Payments",
        });
      });

      generated.sort((a, b) => {
        const aTime = new Date(
          a.timestamp || 0
        ).getTime();

        const bTime = new Date(
          b.timestamp || 0
        ).getTime();

        return bTime - aTime;
      });

      setNotifications(generated);
    } catch (error) {
      console.error(
        "Notifications error:",
        error
      );

      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return notifications.filter(
      (notification) => {
        const matchesSearch =
          !query ||
          notification.title
            .toLowerCase()
            .includes(query) ||
          notification.message
            .toLowerCase()
            .includes(query) ||
          notification.category
            .toLowerCase()
            .includes(query);

        const matchesFilter =
          filter === "all" ||
          notification.type === filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }, [notifications, search, filter]);

  const unreadCount = notifications.filter(
    (item) => item.unread
  ).length;

  const recoveryAlerts = notifications.filter(
    (item) =>
      item.category === "Recovery"
  ).length;

  const paymentAlerts = notifications.filter(
    (item) =>
      item.category === "Payments"
  ).length;

  function iconForType(type) {
    if (type === "success") {
      return <CheckCircle2 size={19} />;
    }

    if (type === "danger") {
      return <XCircle size={19} />;
    }

    if (type === "warning") {
      return <AlertCircle size={19} />;
    }

    return <Bell size={19} />;
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <div className="notifications-eyebrow">
            <Bell size={15} />
            Operations Center
          </div>

          <h1>Notifications</h1>

          <p>
            Monitor payment failures, recovery
            activity and customer communication
            events in one place.
          </p>
        </div>

        <button
          className="notifications-refresh"
          onClick={() =>
            loadNotifications(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "notifications-spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      <div className="notifications-metrics">
        <div className="notification-metric">
          <div className="notification-metric-icon">
            <Bell size={19} />
          </div>

          <div>
            <span>Unread alerts</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        <div className="notification-metric">
          <div className="notification-metric-icon">
            <Zap size={19} />
          </div>

          <div>
            <span>Recovery alerts</span>
            <strong>{recoveryAlerts}</strong>
          </div>
        </div>

        <div className="notification-metric">
          <div className="notification-metric-icon">
            <AlertCircle size={19} />
          </div>

          <div>
            <span>Payment alerts</span>
            <strong>{paymentAlerts}</strong>
          </div>
        </div>

        <div className="notification-metric">
          <div className="notification-metric-icon">
            <ShieldCheck size={19} />
          </div>

          <div>
            <span>Monitoring</span>
            <strong>Active</strong>
          </div>
        </div>
      </div>

      <div className="notifications-toolbar">
        <div className="notification-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="notification-filters">
          <button
            className={
              filter === "all"
                ? "active"
                : ""
            }
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={
              filter === "danger"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("danger")
            }
          >
            Critical
          </button>

          <button
            className={
              filter === "warning"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("warning")
            }
          >
            Attention
          </button>

          <button
            className={
              filter === "success"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("success")
            }
          >
            Success
          </button>
        </div>
      </div>

      <div className="notifications-content">
        <div className="notifications-list-header">
          <div>
            <h2>Activity Feed</h2>
            <p>
              Live operational events generated
              from your payment and recovery data.
            </p>
          </div>

          <span>
            {filteredNotifications.length} events
          </span>
        </div>

        {loading ? (
          <div className="notifications-empty">
            <RefreshCw
              size={25}
              className="notifications-spin"
            />

            <strong>
              Loading notifications...
            </strong>

            <p>
              Fetching recent payment and recovery
              activity.
            </p>
          </div>
        ) : filteredNotifications.length ===
          0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">
              <CheckCircle2 size={28} />
            </div>

            <strong>
              No notifications found
            </strong>

            <p>
              There are no events matching your
              current filters.
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(
              (notification) => (
                <div
                  className={`notification-item ${notification.unread ? "unread" : ""}`}
                  key={notification.id}
                >
                  <div
                    className={`notification-type-icon ${notification.type}`}
                  >
                    {iconForType(
                      notification.type
                    )}
                  </div>

                  <div className="notification-main">
                    <div className="notification-title-row">
                      <div>
                        <strong>
                          {notification.title}
                        </strong>

                        <span className="notification-category">
                          {notification.category}
                        </span>
                      </div>

                      <span className="notification-time">
                        <Clock3 size={13} />
                        {formatDate(
                          notification.timestamp
                        )}
                      </span>
                    </div>

                    <p>
                      {notification.message}
                    </p>

                    {notification.category ===
                      "Communication" && (
                      <div className="notification-action">
                        <Mail size={13} />
                        Customer communication
                        recorded
                      </div>
                    )}
                  </div>

                  {notification.unread && (
                    <span className="notification-unread">
                      New
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}