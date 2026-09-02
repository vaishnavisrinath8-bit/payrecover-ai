
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getPaymentsPaginated,
  getAllPayments,
} from "../services/api";
import "../Styles/Pages.css";

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClass = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "success" || value === "successful") {
    return "status-success";
  }

  if (value === "failed" || value === "failure") {
    return "status-danger";
  }

  return "status-warning";
};

export default function Payments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      let response;

      try {
        response = await getPaymentsPaginated(page, 50);
      } catch {
        response = await getAllPayments();
      }

      const data =
        response?.data ||
        response?.payments ||
        response?.results ||
        [];

      const normalized = Array.isArray(data) ? data : [];

      setPayments(normalized);

      setTotal(
        response?.total ||
          response?.count ||
          normalized.length
      );

      setPages(
        response?.pages ||
          Math.max(
            1,
            Math.ceil(
              (response?.total || normalized.length) / 50
            )
          )
      );
    } catch (err) {
      console.error("Payments API error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load payments."
      );
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [page]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        String(payment.customerName || "")
          .toLowerCase()
          .includes(query) ||
        String(payment.customerEmail || "")
          .toLowerCase()
          .includes(query) ||
        String(payment.razorpayPaymentId || "")
          .toLowerCase()
          .includes(query) ||
        String(payment.paymentMethod || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        String(payment.paymentStatus || "").toLowerCase() ===
          statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const stats = useMemo(() => {
    const successful = payments.filter(
      (p) =>
        String(p.paymentStatus).toLowerCase() === "success"
    );

    const failed = payments.filter(
      (p) =>
        String(p.paymentStatus).toLowerCase() === "failed"
    );

    const totalValue = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const failedValue = failed.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    return {
      total: total || payments.length,
      successful: successful.length,
      failed: failed.length,
      totalValue,
      failedValue,
    };
  }, [payments, total]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            PAYMENT OPERATIONS
          </div>

          <h1>Payments</h1>

          <p>
            Monitor payment activity, failures and
            recovery opportunities.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={loadPayments}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert-card">
          <XCircle size={20} />
          <div>
            <strong>Payments API error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <CreditCard size={21} />
          </div>

          <div>
            <span>Total Payments</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Successful</span>
            <strong>{stats.successful}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon red">
            <XCircle size={21} />
          </div>

          <div>
            <span>Failed</span>
            <strong>{stats.failed}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <IndianRupee size={21} />
          </div>

          <div>
            <span>Payment Volume</span>
            <strong>
              {formatCurrency(stats.totalValue)}
            </strong>
          </div>
        </div>
      </div>

      <div className="toolbar-card">
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search customer, email, payment ID..."
          />
        </div>

        <div className="filter-group">
          <button
            className={
              statusFilter === "all"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>

          <button
            className={
              statusFilter === "success"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() => setStatusFilter("success")}
          >
            Successful
          </button>

          <button
            className={
              statusFilter === "failed"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() => setStatusFilter("failed")}
          >
            Failed
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-heading">
          <div>
            <h2>Payment Activity</h2>
            <span>
              Showing {filteredPayments.length} records
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={42} />
            <h3>No payments found</h3>
            <p>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Recovery</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr
                    key={
                      payment._id ||
                      payment.razorpayPaymentId ||
                      index
                    }
                  >
                    <td>
                      <div className="customer-cell">
                        <div className="avatar">
                          {String(
                            payment.customerName || "C"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {payment.customerName ||
                              "Unknown Customer"}
                          </strong>
                          <span>
                            {payment.customerEmail || "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <code>
                        {payment.razorpayPaymentId || "—"}
                      </code>
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(payment.amount)}
                      </strong>
                    </td>

                    <td>
                      <span className="method-badge">
                        {payment.paymentMethod || "—"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          payment.paymentStatus
                        )}`}
                      >
                        {payment.paymentStatus || "unknown"}
                      </span>
                    </td>

                    <td>
                      <span className="recovery-text">
                        {payment.recoveryStatus || "not_started"}
                      </span>
                    </td>

                    <td className="date-cell">
                      {formatDate(payment.createdAt)}
                    </td>

                    <td>
                      <button
                        className="icon-button"
                        title="View payment"
                        onClick={() =>
                          navigate(
                            `/payments/${payment._id}`
                          )
                        }
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination">
          <span>
            Page {page} of {pages}
          </span>

          <div>
            <button
              className="icon-button"
              disabled={page <= 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
            >
              <ChevronLeft size={18} />
            </button>

            <button
              className="icon-button"
              disabled={page >= pages}
              onClick={() =>
                setPage((current) =>
                  Math.min(pages, current + 1)
                )
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

