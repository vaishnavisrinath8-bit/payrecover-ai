import React from "react";
import {
  X,
  User,
  CreditCard,
  ShieldCheck,
  CalendarDays,
  Hash,
  Mail,
  Phone,
  RefreshCcw,
} from "lucide-react";

function formatCurrency(amount, currency = "INR") {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "—";
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

function formatDate(value) {
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

function getPaymentStatus(payment) {
  return (
    payment?.paymentStatus ||
    payment?.status ||
    "unknown"
  );
}

function getRecoveryStatus(payment) {
  return payment?.recoveryStatus || "Not started";
}

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  if (
    normalized.includes("success") ||
    normalized.includes("paid") ||
    normalized.includes("completed")
  ) {
    return (
      <span className="status-badge status-success">
        <span className="status-dot" />
        Successful
      </span>
    );
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("cancel") ||
    normalized.includes("unrecover")
  ) {
    return (
      <span className="status-badge status-danger">
        <span className="status-dot" />
        Failed
      </span>
    );
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("process")
  ) {
    return (
      <span className="status-badge status-warning">
        <span className="status-dot" />
        Pending
      </span>
    );
  }

  return (
    <span className="status-badge status-neutral">
      <span className="status-dot" />
      {status || "Unknown"}
    </span>
  );
}

function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="payment-detail-row">
      <div className="payment-detail-label">
        <div className="payment-detail-icon">
          <Icon size={16} />
        </div>

        <span>{label}</span>
      </div>

      <strong className={mono ? "mono-text" : ""}>
        {value || "—"}
      </strong>
    </div>
  );
}

function PaymentModal({
  payment,
  isOpen = true,
  onClose,
  onCreateRecovery,
  recoveryLoading = false,
}) {
  if (!isOpen || !payment) {
    return null;
  }

  const paymentStatus = getPaymentStatus(payment);
  const recoveryStatus = getRecoveryStatus(payment);

  const normalizedPaymentStatus = normalizeStatus(paymentStatus);

  const isFailed =
    normalizedPaymentStatus.includes("fail") ||
    normalizedPaymentStatus.includes("cancel");

  const paymentId =
    payment?.razorpayPaymentId ||
    payment?.paymentId ||
    payment?._id;

  const orderId =
    payment?.razorpayOrderId ||
    payment?.orderId;

  const customerName =
    payment?.customerName ||
    payment?.customer?.name ||
    "Unknown customer";

  const customerEmail =
    payment?.customerEmail ||
    payment?.customer?.email ||
    "No email available";

  const customerPhone =
    payment?.customerPhone ||
    payment?.customer?.phone ||
    payment?.phone;

  const currency = payment?.currency || "INR";

  const amount = payment?.amount;

  const recoveryStarted =
    Boolean(payment?.recoveryId) ||
    Boolean(payment?.recoveryStatus) ||
    normalizeStatus(recoveryStatus) !== "notstarted";

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="modal payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">PAYMENT DETAILS</div>

            <h2 id="payment-modal-title">
              Payment information
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close payment details"
          >
            <X size={19} />
          </button>
        </div>

        <div className="payment-summary">
          <div className="payment-summary-icon">
            <CreditCard size={25} />
          </div>

          <div className="payment-summary-main">
            <span>Transaction amount</span>

            <strong>
              {formatCurrency(amount, currency)}
            </strong>

            <div className="payment-summary-status">
              <StatusBadge status={paymentStatus} />
            </div>
          </div>

          <div className="payment-summary-meta">
            <span>Created</span>

            <strong>
              {formatDate(payment?.createdAt)}
            </strong>
          </div>
        </div>

        <div className="payment-detail-sections">
          <section className="detail-section">
            <div className="detail-section-heading">
              <div className="section-icon">
                <User size={17} />
              </div>

              <div>
                <h3>Customer information</h3>
                <p>Customer details associated with this payment.</p>
              </div>
            </div>

            <div className="payment-detail-list">
              <DetailRow
                icon={User}
                label="Customer"
                value={customerName}
              />

              <DetailRow
                icon={Mail}
                label="Email"
                value={customerEmail}
              />

              <DetailRow
                icon={Phone}
                label="Phone"
                value={customerPhone}
              />
            </div>
          </section>

          <section className="detail-section">
            <div className="detail-section-heading">
              <div className="section-icon">
                <CreditCard size={17} />
              </div>

              <div>
                <h3>Payment information</h3>
                <p>Transaction and payment method information.</p>
              </div>
            </div>

            <div className="payment-detail-list">
              <DetailRow
                icon={CreditCard}
                label="Amount"
                value={formatCurrency(amount, currency)}
              />

              <DetailRow
                icon={CreditCard}
                label="Payment method"
                value={
                  payment?.paymentMethod ||
                  payment?.method ||
                  "—"
                }
              />

              <DetailRow
                icon={ShieldCheck}
                label="Payment status"
                value={paymentStatus}
              />

              <DetailRow
                icon={RefreshCcw}
                label="Recovery status"
                value={recoveryStatus}
              />
            </div>
          </section>

          <section className="detail-section">
            <div className="detail-section-heading">
              <div className="section-icon">
                <Hash size={17} />
              </div>

              <div>
                <h3>Razorpay information</h3>
                <p>Gateway identifiers for this transaction.</p>
              </div>
            </div>

            <div className="payment-detail-list">
              <DetailRow
                icon={Hash}
                label="Payment ID"
                value={paymentId}
                mono
              />

              <DetailRow
                icon={Hash}
                label="Order ID"
                value={orderId}
                mono
              />

              <DetailRow
                icon={CalendarDays}
                label="Created"
                value={formatDate(payment?.createdAt)}
              />

              <DetailRow
                icon={CalendarDays}
                label="Last updated"
                value={formatDate(payment?.updatedAt)}
              />
            </div>
          </section>
        </div>

        {isFailed && !recoveryStarted && (
          <div className="recovery-callout">
            <div className="recovery-callout-icon">
              <RefreshCcw size={19} />
            </div>

            <div className="recovery-callout-content">
              <strong>Payment recovery available</strong>

              <p>
                This payment failed and can be added to the
                recovery workflow.
              </p>
            </div>

            {onCreateRecovery && (
              <button
                type="button"
                className="button button-primary"
                disabled={recoveryLoading || !payment?._id}
                onClick={() => onCreateRecovery(payment._id)}
              >
                {recoveryLoading ? (
                  <>
                    <RefreshCcw
                      size={17}
                      className="spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <RefreshCcw size={17} />
                    Create Recovery
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {isFailed && recoveryStarted && (
          <div className="recovery-callout existing">
            <div className="recovery-callout-icon">
              <ShieldCheck size={19} />
            </div>

            <div className="recovery-callout-content">
              <strong>Recovery workflow exists</strong>

              <p>
                This payment is already associated with a
                recovery workflow.
              </p>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;