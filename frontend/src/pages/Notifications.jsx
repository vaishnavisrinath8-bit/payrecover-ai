import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  AlertTriangle,
  CircleCheck,
  Info,
  X,
} from "lucide-react";

import "./Notifications.css";

const STORAGE_KEY = "payrecover_notifications";

const DEFAULT_NOTIFICATIONS = [
  {
    id: "notification-1",
    title: "Payment recovered successfully",
    message:
      "A previously failed payment has been recovered successfully.",
    type: "success",
    category: "Recovery",
    priority: "high",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
    action: "View recovery",
  },
  {
    id: "notification-2",
    title: "Recovery action completed",
    message:
      "The recovery workflow completed the configured customer communication step.",
    type: "success",
    category: "Workflow",
    priority: "medium",
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    read: true,
    action: "View workflow",
  },
  {
    id: "notification-3",
    title: "Payment requires attention",
    message:
      "A failed payment has entered the recovery queue and is awaiting action.",
    type: "warning",
    category: "Payment",
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    action: "Open recovery",
  },
  {
    id: "notification-4",
    title: "Recovery email sent",
    message:
      "A recovery communication was sent to the customer successfully.",
    type: "info",
    category: "Communication",
    priority: "medium",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: true,
    action: "View communication",
  },
  {
    id: "notification-5",
    title: "Recovery attempt failed",
    message:
      "The latest recovery attempt did not result in a successful payment.",
    type: "danger",
    category: "Recovery",
    priority: "high",
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    read: false,
    action: "Review recovery",
  },
  {
    id: "notification-6",
    title: "AI recovery recommendation updated",
    message:
      "The recovery decision engine generated a new recommended intervention.",
    type: "info",
    category: "AI",
    priority: "medium",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    read: true,
    action: "View recommendation",
  },
];

function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_NOTIFICATIONS;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_NOTIFICATIONS;
    }

    return parsed;
  } catch (error) {
    console.error("Unable to load notifications:", error);
    return DEFAULT_NOTIFICATIONS;
  }
}

function formatTime(dateValue) {
  if (!dateValue) {
    return "Recently";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return <CircleCheck size={17} strokeWidth={2.2} />;

    case "danger":
      return <X size={17} strokeWidth={2.2} />;

    case "warning":
      return <AlertTriangle size={17} strokeWidth={2.2} />;

    case "info":
    default:
      return <Info size={17} strokeWidth={2.2} />;
  }
}

function getNotificationType(type) {
  if (["success", "danger", "warning", "info"].includes(type)) {
    return type;
  }

  return "info";
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(() =>
    loadNotifications()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Unable to save notifications:", error);
    }
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const readCount = useMemo(
    () => notifications.filter((item) => item.read).length,
    [notifications]
  );

  const recoveryCount = useMemo(
    () =>
      notifications.filter(
        (item) =>
          String(item.category || "").toLowerCase() ===
            "recovery" ||
          String(item.category || "").toLowerCase() ===
            "workflow"
      ).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !query ||
        String(notification.title || "")
          .toLowerCase()
          .includes(query) ||
        String(notification.message || "")
          .toLowerCase()
          .includes(query) ||
        String(notification.category || "")
          .toLowerCase()
          .includes(query);

      let matchesFilter = true;

      if (activeFilter === "unread") {
        matchesFilter = !notification.read;
      }

      if (activeFilter === "read") {
        matchesFilter = notification.read;
      }

      if (activeFilter === "recovery") {
        matchesFilter =
          String(notification.category || "")
            .toLowerCase()
            .includes("recovery") ||
          String(notification.category || "")
            .toLowerCase()
            .includes("workflow");
      }

      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchQuery, activeFilter]);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  };

  const toggleRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: !notification.read,
            }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  };

  const clearAll = () => {
    const confirmed = window.confirm(
      "Clear all notifications?"
    );

    if (!confirmed) {
      return;
    }

    setNotifications([]);
  };

  const refreshNotifications = () => {
    setLoading(true);

    window.setTimeout(() => {
      setNotifications((current) => [...current]);
      setLoading(false);
    }, 500);
  };

  const resetDemoNotifications = () => {
    setNotifications(DEFAULT_NOTIFICATIONS);
    setSearchQuery("");
    setActiveFilter("all");
  };

  return (
    <div className="notifications-page">
      {/* HEADER */}
      <div className="notifications-header">
        <div>
          <div className="notifications-eyebrow">
            <Bell size={13} />
            Notification Center
          </div>

          <h1>Notifications</h1>

          <p>
            Monitor payment events, recovery activity, AI
            decisions, and customer communication from one
            place.
          </p>
        </div>

        <button
          type="button"
          className="notifications-refresh"
          onClick={refreshNotifications}
          disabled={loading}
        >
          <RefreshCw
            size={14}
            className={loading ? "notifications-spin" : ""}
          />

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* METRICS */}
      <div className="notifications-metrics">
        <div className="notification-metric">
          <div className="notification-metric-icon">
            <Bell size={18} />
          </div>

          <div>
            <span>Total notifications</span>
            <strong>{notifications.length}</strong>
          </div>
        </div>

        <div className="notification-metric">
          <div className="notification-metric-icon">
            <Mail size={18} />
          </div>

          <div>
            <span>Unread</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        <div className="notification-metric">
          <div className="notification-metric-icon">
            <RefreshCw size={18} />
          </div>

          <div>
            <span>Recovery activity</span>
            <strong>{recoveryCount}</strong>
          </div>
        </div>

        <div className="notification-metric">
          <div className="notification-metric-icon">
            <CheckCheck size={18} />
          </div>

          <div>
            <span>Read</span>
            <strong>{readCount}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="notifications-toolbar">
        <label className="notification-search">
          <Search size={15} />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search notifications..."
            aria-label="Search notifications"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="notification-filters">
          <button
            type="button"
            className={
              activeFilter === "all" ? "active" : ""
            }
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className={
              activeFilter === "unread" ? "active" : ""
            }
            onClick={() => setActiveFilter("unread")}
          >
            Unread
          </button>

          <button
            type="button"
            className={
              activeFilter === "read" ? "active" : ""
            }
            onClick={() => setActiveFilter("read")}
          >
            Read
          </button>

          <button
            type="button"
            className={
              activeFilter === "recovery" ? "active" : ""
            }
            onClick={() => setActiveFilter("recovery")}
          >
            Recovery
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="notifications-content">
        <div className="notifications-list-header">
          <div>
            <h2>Recent activity</h2>

            <p>
              Payment and recovery events from your account.
            </p>
          </div>

          <span>
            {filteredNotifications.length}{" "}
            {filteredNotifications.length === 1
              ? "notification"
              : "notifications"}
          </span>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">
              <Bell size={24} />
            </div>

            <strong>No notifications found</strong>

            <p>
              {searchQuery
                ? "Try a different search term or clear your search."
                : "There are no notifications matching the selected filter."}
            </p>

            {(searchQuery || activeFilter !== "all") && (
              <button
                type="button"
                className="notification-action"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
              >
                Clear filters
              </button>
            )}

            {notifications.length === 0 && (
              <button
                type="button"
                className="notification-action"
                onClick={resetDemoNotifications}
              >
                Restore demo notifications
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const type = getNotificationType(
              notification.type
            );

            return (
              <div
                className={`notification-item ${
                  !notification.read ? "unread" : ""
                }`}
                key={notification.id}
              >
                <div
                  className={`notification-type-icon ${type}`}
                >
                  {getNotificationIcon(type)}
                </div>

                <div className="notification-main">
                  <div className="notification-title-row">
                    <div>
                      <strong>
                        {notification.title}
                      </strong>

                      <span className="notification-category">
                        {notification.category ||
                          "General"}
                      </span>

                      {!notification.read && (
                        <span className="notification-unread">
                          Unread
                        </span>
                      )}
                    </div>

                    <span className="notification-time">
                      <Clock3 size={11} />
                      {formatTime(
                        notification.createdAt
                      )}
                    </span>
                  </div>

                  <p>{notification.message}</p>

                  <button
                    type="button"
                    className="notification-action"
                    onClick={() =>
                      toggleRead(notification.id)
                    }
                  >
                    {notification.read ? (
                      <>
                        <Mail size={11} />
                        Mark as unread
                      </>
                    ) : (
                      <>
                        <Check size={11} />
                        Mark as read
                      </>
                    )}
                  </button>

                  {notification.action && (
                    <button
                      type="button"
                      className="notification-action"
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                    >
                      <Info size={11} />
                      {notification.action}
                    </button>
                  )}

                  <button
                    type="button"
                    className="notification-action"
                    onClick={() =>
                      deleteNotification(
                        notification.id
                      )
                    }
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}

        {notifications.length > 0 && (
          <div className="notifications-footer">
            <button
              type="button"
              className="notification-action"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={12} />
              Mark all as read
            </button>

            <button
              type="button"
              className="notification-action notification-danger-action"
              onClick={clearAll}
            >
              <Trash2 size={12} />
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}