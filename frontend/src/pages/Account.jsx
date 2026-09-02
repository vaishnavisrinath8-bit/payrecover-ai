import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import "./Account.css";

const DEFAULT_ACCOUNT = {
  fullName: "PayRecover Admin",
  email: "admin@payrecover.ai",
  phone: "+91 98765 43210",
  role: "Administrator",

  companyName: "PayRecover Technologies",
  industry: "Technology / SaaS",
  location: "Bengaluru, India",
  timezone: "Asia/Kolkata",
};

function loadAccount() {
  try {
    const stored = localStorage.getItem("payrecover_account");

    if (stored) {
      return {
        ...DEFAULT_ACCOUNT,
        ...JSON.parse(stored),
      };
    }
  } catch (error) {
    console.error("Failed to load account:", error);
  }

  return { ...DEFAULT_ACCOUNT };
}

export default function Account() {
  const [account, setAccount] = useState(loadAccount);
  const [draft, setDraft] = useState(loadAccount);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const currentAccount = loadAccount();

    setAccount(currentAccount);
    setDraft(currentAccount);
  }, []);

  const handleEdit = () => {
    setDraft({ ...account });
    setEditing(true);
    setSaved(false);
  };

  const handleCancel = () => {
    setDraft({ ...account });
    setEditing(false);
    setSaved(false);
  };

  const handleChange = (field, value) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(
        "payrecover_account",
        JSON.stringify(draft)
      );

      setAccount({ ...draft });
      setDraft({ ...draft });
      setEditing(false);
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save account:", error);
    }
  };

  return (
    <div className="account-page">

      {/* HEADER */}
      <div className="account-header">
        <div>
          <div className="account-eyebrow">
            <User size={15} />
            ACCOUNT MANAGEMENT
          </div>

          <h1>Account</h1>

          <p>
            Manage your personal profile, business information and
            account security.
          </p>
        </div>

        <div className="account-header-actions">

          {saved && (
            <div className="account-save-success">
              <CheckCircle2 size={17} />
              Changes saved
            </div>
          )}

          {!editing ? (
            <button
              className="account-primary-button"
              onClick={handleEdit}
            >
              <Edit3 size={17} />
              Edit profile
            </button>
          ) : (
            <>
              <button
                className="account-secondary-button"
                onClick={handleCancel}
              >
                <X size={17} />
                Cancel
              </button>

              <button
                className="account-primary-button"
                onClick={handleSave}
              >
                <Save size={17} />
                Save changes
              </button>
            </>
          )}

        </div>
      </div>

      <div className="account-layout">

        <main className="account-main">

          {/* PERSONAL INFORMATION */}
          <section className="account-card">

            <div className="account-card-header">
              <div>
                <h2>Personal information</h2>

                <p>
                  Manage the personal details associated with
                  your PayRecover account.
                </p>
              </div>

              <div className="account-section-icon">
                <User size={19} />
              </div>
            </div>

            {/* PROFILE SUMMARY */}
            <div className="profile-summary">

              <div className="profile-avatar">
                {draft.fullName
                  ? draft.fullName.charAt(0).toUpperCase()
                  : "P"}
              </div>

              <div className="profile-summary-content">

                <h3>
                  {draft.fullName || "Your name"}
                </h3>

                <span>
                  {draft.role || "Administrator"}
                </span>

                <div className="profile-email">
                  <Mail size={14} />
                  {draft.email || "No email configured"}
                </div>

              </div>

              <div className="account-active-badge">
                <span />
                Active
              </div>

            </div>

            <div className="account-divider" />

            <div className="account-form-grid">

              <AccountField
                label="Full name"
                value={draft.fullName}
                editing={editing}
                onChange={(value) =>
                  handleChange("fullName", value)
                }
              />

              <AccountField
                label="Email address"
                value={draft.email}
                editing={editing}
                type="email"
                icon={<Mail size={14} />}
                onChange={(value) =>
                  handleChange("email", value)
                }
              />

              <AccountField
                label="Phone number"
                value={draft.phone}
                editing={editing}
                type="tel"
                icon={<Phone size={14} />}
                onChange={(value) =>
                  handleChange("phone", value)
                }
              />

              <AccountField
                label="Role"
                value={draft.role}
                editing={editing}
                onChange={(value) =>
                  handleChange("role", value)
                }
              />

            </div>

          </section>

          {/* BUSINESS INFORMATION */}
          <section className="account-card">

            <div className="account-card-header">

              <div>
                <h2>Business information</h2>

                <p>
                  Manage your organization's profile and
                  workspace information.
                </p>
              </div>

              <div className="account-section-icon">
                <Building2 size={19} />
              </div>

            </div>

            <div className="account-form-grid">

              <AccountField
                label="Company name"
                value={draft.companyName}
                editing={editing}
                icon={<Building2 size={14} />}
                onChange={(value) =>
                  handleChange("companyName", value)
                }
              />

              <AccountField
                label="Industry"
                value={draft.industry}
                editing={editing}
                onChange={(value) =>
                  handleChange("industry", value)
                }
              />

              <AccountField
                label="Location"
                value={draft.location}
                editing={editing}
                icon={<MapPin size={14} />}
                onChange={(value) =>
                  handleChange("location", value)
                }
              />

              <AccountField
                label="Timezone"
                value={draft.timezone}
                editing={editing}
                onChange={(value) =>
                  handleChange("timezone", value)
                }
              />

            </div>

          </section>

          {/* SECURITY */}
          <section className="account-card security-card">

            <div className="account-card-header">

              <div>
                <h2>Security</h2>

                <p>
                  Keep your PayRecover account protected.
                </p>
              </div>

              <div className="account-section-icon">
                <ShieldCheck size={19} />
              </div>

            </div>

            <div className="security-row">

              <div className="security-row-icon">
                <ShieldCheck size={18} />
              </div>

              <div className="security-row-content">

                <h3>Account security</h3>

                <p>
                  Your account is currently protected by
                  standard authentication.
                </p>

              </div>

              <div className="security-status">
                <CheckCircle2 size={15} />
                Protected
              </div>

            </div>

            <div className="security-row">

              <div className="security-row-icon">
                <Mail size={18} />
              </div>

              <div className="security-row-content">

                <h3>Email verification</h3>

                <p>
                  Your account email address is configured
                  for recovery communications.
                </p>

              </div>

              <div className="security-status">
                <CheckCircle2 size={15} />
                Verified
              </div>

            </div>

            <div className="security-row">

              <div className="security-row-icon">
                <Phone size={18} />
              </div>

              <div className="security-row-content">

                <h3>Recovery contact</h3>

                <p>
                  A phone number is available for account
                  notifications.
                </p>

              </div>

              <div className="security-status">
                <CheckCircle2 size={15} />
                Configured
              </div>

            </div>

          </section>

        </main>

        {/* SIDEBAR */}
        <aside className="account-sidebar">

          {/* STATUS */}
          <section className="account-card account-status-card">

            <div className="status-card-top">

              <div className="status-icon">
                <CheckCircle2 size={23} />
              </div>

              <div>
                <span className="status-label">
                  ACCOUNT STATUS
                </span>

                <h2>Active</h2>
              </div>

            </div>

            <p>
              Your PayRecover workspace is active and ready
              to process recovery workflows.
            </p>

            <div className="status-line">
              <span>Workspace</span>
              <strong>PayRecover AI</strong>
            </div>

            <div className="status-line">
              <span>Access level</span>
              <strong>
                {account.role || "Administrator"}
              </strong>
            </div>

          </section>

          {/* CONTACT */}
          <section className="account-card contact-card">

            <div className="sidebar-card-title">
              <Mail size={17} />
              Contact information
            </div>

            <div className="contact-item">

              <Mail size={15} />

              <div>
                <span>Email</span>

                <strong>
                  {account.email}
                </strong>
              </div>

            </div>

            <div className="contact-item">

              <Phone size={15} />

              <div>
                <span>Phone</span>

                <strong>
                  {account.phone}
                </strong>
              </div>

            </div>

            <div className="contact-item">

              <MapPin size={15} />

              <div>
                <span>Location</span>

                <strong>
                  {account.location}
                </strong>
              </div>

            </div>

          </section>

          {/* WORKSPACE */}
          <section className="account-card plan-card">

            <div className="plan-header">

              <div>
                <span className="plan-label">
                  WORKSPACE
                </span>

                <h2>
                  Recovery Intelligence
                </h2>
              </div>

              <div className="plan-badge">
                ACTIVE
              </div>

            </div>

            <p>
              AI-powered payment recovery, monitoring
              and revenue intelligence.
            </p>

            <div className="plan-feature">
              <CheckCircle2 size={15} />
              AI recovery workflows
            </div>

            <div className="plan-feature">
              <CheckCircle2 size={15} />
              Recovery analytics
            </div>

            <div className="plan-feature">
              <CheckCircle2 size={15} />
              Compliance guardrails
            </div>

          </section>

        </aside>

      </div>
    </div>
  );
}


/* =========================================================
   ACCOUNT FIELD
========================================================= */

function AccountField({
  label,
  value,
  editing,
  onChange,
  type = "text",
  icon = null,
}) {
  return (
    <div className="account-field">

      <label>{label}</label>

      {editing ? (
        <div className="account-input-wrapper">

          {icon}

          <input
            type={type}
            value={value || ""}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={`Enter ${label.toLowerCase()}`}
          />

        </div>
      ) : (
        <div className="account-value">

          {icon}

          <span>
            {value || "Not configured"}
          </span>

        </div>
      )}

    </div>
  );
}