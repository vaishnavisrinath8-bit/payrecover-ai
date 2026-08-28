import React, { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock3,
  RefreshCw,
  Check,
  Mail,
  Search,
  Trash2,
} from "lucide-react";

const initialNotifications = [
  {
    id: 1,
    type: "error",
    title: "Payment failed",
    message:
      "Payment pay_demo_00291 for ₹7,500 failed due to insufficient funds.",
    time: "10 minutes ago",
    status: "Unread",
  },
  {
    id: 2,
    type: "warning",
    title: "Recovery action pending",
    message:
      "A recovery notification is waiting to be sent for payment pay_demo_00291.",
    time: "24 minutes ago",
    status: "Unread",
  },
  {
    id: 3,
    type: "success",
    title: "Payment recovered",
    message:
      "Payment pay_demo_00002 was successfully recovered after 3 retry attempts.",
    time: "1 hour ago",
    status: "Read",
  },
  {
    id: 4,
    type: "warning",
    title: "Pending payment",
    message:
      "Payment pay_demo_00170 has remained pending and should be monitored.",
    time: "2 hours ago",
    status: "Unread",
  },
  {
    id: 5,
    type: "success",
    title: "Recovery completed",
    message:
      "₹799 from payment pay_demo_00154 has been successfully recovered.",
    time: "3 hours ago",
    status: "Read",
  },
  {
    id: 6,
    type: "error",
    title: "Payment failure detected",
    message:
      "Payment pay_demo_00088 failed because of a network error. Automatic retry completed.",
    time: "5 hours ago",
    status: "Read",
  },
  {
    id: 7,
    type: "warning",
    title: "Transaction limit exceeded",
    message:
      "Payment pay_demo_00008 exceeded the transaction limit. Recovery is currently in progress.",
    time: "Yesterday",
    status: "Unread",
  },
  {
    id: 8,
    type: "info",
    title: "Recovery monitoring active",
    message:
      "The system is monitoring pending and failed transactions for recovery opportunities.",
    time: "Yesterday",
    status: "Read",
  },
];

export default function Notifications() {
  const [notifications, setNotifications] =
    useState(initialNotifications);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter(
    (item) => item.status === "Unread"
  ).length;

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !query ||
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "unread" &&
          notification.status === "Unread") ||
        (filter === "read" &&
          notification.status === "Read");

      return matchesSearch && matchesFilter;
    });
  }, [notifications, search, filter]);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              status: "Read",
            }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        status: "Read",
      }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const refreshNotifications = () => {
    setRefreshing(true);

    setTimeout(() => {
      setNotifications(initialNotifications);
      setRefreshing(false);
    }, 700);
  };

  return (
    <div className="notifications-page">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="notifications-header">
        <div>
          <h1 className="notifications-title">
            Notifications
          </h1>

          <p className="notifications-subtitle">
            Stay updated on payment failures, recovery actions
            and important account activity.
          </p>
        </div>

        <div className="notification-actions">
          <button
            type="button"
            className="notification-action"
            onClick={refreshNotifications}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="notification-action primary"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check size={16} />

            Mark all as read
          </button>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="notification-summary">
        <div className="notification-summary-card">
          <div className="notification-summary-label">
            Total notifications
          </div>

          <div className="notification-summary-value">
            {notifications.length}
          </div>

          <div className="notification-summary-meta">
            All system notifications
          </div>
        </div>

        <div className="notification-summary-card">
          <div className="notification-summary-label">
            Unread
          </div>

          <div className="notification-summary-value">
            {unreadCount}
          </div>

          <div className="notification-summary-meta">
            Requires your attention
          </div>
        </div>

        <div className="notification-summary-card">
          <div className="notification-summary-label">
            Payment alerts
          </div>

          <div className="notification-summary-value">
            {
              notifications.filter(
                (item) =>
                  item.type === "error" ||
                  item.type === "warning"
              ).length
            }
          </div>

          <div className="notification-summary-meta">
            Failures and recovery events
          </div>
        </div>

        <div className="notification-summary-card">
          <div className="notification-summary-label">
            Recovery updates
          </div>

          <div className="notification-summary-value">
            {
              notifications.filter((item) =>
                item.title.toLowerCase().includes("recover")
              ).length
            }
          </div>

          <div className="notification-summary-meta">
            Recent recovery activity
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTERS
          ===================================================== */}

      <div className="notification-filter-card">
        <div className="notification-filters">
          <input
            type="text"
            className="notification-search"
            placeholder="Search notifications..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            className="notification-select"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* =====================================================
          NOTIFICATION LIST
          ===================================================== */}

      {filteredNotifications.length === 0 ? (
        <div className="notifications-empty">
          <Bell size={34} />

          <h3>
            {notifications.length === 0
              ? "No notifications"
              : "No matching notifications"}
          </h3>

          <p>
            {notifications.length === 0
              ? "You're all caught up. New payment and recovery events will appear here."
              : "Try changing your search or notification filter."}
          </p>
        </div>
      ) : (
        <div className="notification-list">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}

      {/* =====================================================
          GLOBAL ANIMATION
          ===================================================== */}

      <style>{`
        .spin {
          animation: notification-spin 0.8s linear infinite;
        }

        @keyframes notification-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   NOTIFICATION CARD
   ========================================================= */

function NotificationCard({
  notification,
  onRead,
  onDelete,
}) {
  const Icon = getNotificationIcon(notification.type);

  return (
    <div
      className={`notification-card ${
        notification.status === "Unread" ? "unread" : ""
      }`}
    >
      {/* ICON */}

      <div
        className={`notification-icon ${notification.type}`}
      >
        <Icon size={20} />
      </div>

      {/* CONTENT */}

      <div className="notification-content">
        <div className="notification-card-header">
          <h3 className="notification-card-title">
            {notification.title}
          </h3>

          <span className="notification-card-time">
            {notification.time}
          </span>
        </div>

        <p className="notification-card-message">
          {notification.message}
        </p>

        <div className="notification-card-footer">
          <span
            className={`notification-status ${
              notification.status === "Unread"
                ? "unread"
                : ""
            }`}
          >
            {notification.status === "Unread" ? (
              <>
                <span>●</span>
                Unread
              </>
            ) : (
              <>
                <CheckCircle2 size={12} />
                Read
              </>
            )}
          </span>

          <div className="notification-card-actions">
            {notification.status === "Unread" && (
              <button
                type="button"
                className="notification-small-button"
                onClick={() => onRead(notification.id)}
              >
                <Check size={14} />
                Mark as read
              </button>
            )}

            <button
              type="button"
              className="notification-small-button"
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ICON SELECTION
   ========================================================= */

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return CheckCircle2;

    case "warning":
      return AlertTriangle;

    case "error":
      return XCircle;

    case "info":
    default:
      return Bell;
  }
}