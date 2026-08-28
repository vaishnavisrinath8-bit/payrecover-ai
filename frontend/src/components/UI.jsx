import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Info,
  RefreshCw,
  Search,
} from "lucide-react";

/* =========================================================
   DATE / CURRENCY UTILITIES
========================================================= */

export function formatCurrency(
  amount,
  currency = "INR"
) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "₹0.00";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || "INR"} ${value.toFixed(2)}`;
  }
}

export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(value) {
  return formatDate(value);
}

/* =========================================================
   GENERAL UTILITIES
========================================================= */

export function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function getInitials(name) {
  if (!name) {
    return "?";
  }

  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/* =========================================================
   BUTTON
========================================================= */

export function Button({
  children,
  variant = "primary",
  size = "medium",
  type = "button",
  disabled = false,
  loading = false,
  onClick,
  icon: Icon,
  className = "",
}) {
  return (
    <button
      type={type}
      className={`button button-${variant} button-${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <RefreshCw
          size={16}
          className="spin"
        />
      ) : (
        Icon && <Icon size={16} />
      )}

      {loading ? "Please wait..." : children}
    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

export function StatusBadge({
  status,
  type = "default",
}) {
  const normalized = normalizeStatus(status);

  let variant = "neutral";
  let icon = <Info size={13} />;

  if (
    normalized.includes("success") ||
    normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("recovered")
  ) {
    variant = "success";
    icon = <CheckCircle2 size={13} />;
  } else if (
    normalized.includes("fail") ||
    normalized.includes("cancel") ||
    normalized.includes("unrecover")
  ) {
    variant = "danger";
    icon = <AlertCircle size={13} />;
  } else if (
    normalized.includes("pending") ||
    normalized.includes("process") ||
    normalized.includes("progress") ||
    normalized.includes("sent")
  ) {
    variant = "warning";
    icon = <Clock3 size={13} />;
  } else if (type === "success") {
    variant = "success";
    icon = <CheckCircle2 size={13} />;
  } else if (type === "danger") {
    variant = "danger";
    icon = <AlertCircle size={13} />;
  } else if (type === "warning") {
    variant = "warning";
    icon = <Clock3 size={13} />;
  }

  return (
    <span
      className={`status-badge status-${variant}`}
    >
      {icon}
      <span>{status || "Unknown"}</span>
    </span>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

export function EmptyState({
  icon: Icon = Search,
  title = "Nothing to display",
  description = "There are no records available.",
  action,
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={27} />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {action ? (
        action
      ) : actionLabel && onAction ? (
        <button
          type="button"
          className="button button-primary"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/* =========================================================
   ERROR STATE
========================================================= */

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this information.",
  onRetry,
  retryLabel = "Try again",
}) {
  return (
    <div className="error-state">
      <div className="empty-state-icon danger">
        <AlertCircle size={27} />
      </div>

      <h3>{title}</h3>

      <p>{message}</p>

      {onRetry && (
        <button
          type="button"
          className="button button-primary"
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   LOADING STATE
========================================================= */

export function LoadingState({
  message = "Loading...",
}) {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <span>{message}</span>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

export function Skeleton({
  width = "100%",
  height = "18px",
  className = "",
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
      }}
    />
  );
}

/* =========================================================
   TOAST
========================================================= */

export function Toast({
  type = "success",
  message,
  onClose,
}) {
  if (!message) {
    return null;
  }

  let icon;

  if (type === "success") {
    icon = <CheckCircle2 size={18} />;
  } else if (type === "error") {
    icon = <AlertCircle size={18} />;
  } else if (type === "warning") {
    icon = <Clock3 size={18} />;
  } else {
    icon = <Info size={18} />;
  }

  return (
    <div className={`toast toast-${type}`}>
      {icon}

      <span>{message}</span>

      {onClose && (
        <button
          type="button"
          className="toast-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
}

/* =========================================================
   SEARCH INPUT
========================================================= */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  onKeyDown,
}) {
  return (
    <div className="search-box">
      <Search size={17} />

      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

/* =========================================================
   CONFIRM BUTTON
========================================================= */

export function ConfirmButton({
  children,
  confirmMessage = "Are you sure?",
  onConfirm,
  className = "",
  ...props
}) {
  const handleClick = () => {
    const confirmed = window.confirm(
      confirmMessage
    );

    if (confirmed) {
      onConfirm?.();
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}