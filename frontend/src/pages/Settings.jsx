import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Zap,
} from "lucide-react";

import "./Settings.css";

const DEFAULT_SETTINGS = {
  automationEnabled: true,
  autoCreateRecovery: true,
  autoSendRecovery: false,
  aiRecommendations: true,

  maxAttempts: 3,
  retryWindow: 72,
  recoveryExpiry: 7,

  emailEnabled: true,
  recoveryAlerts: true,
  criticalAlerts: true,
  dailySummary: true,

  complianceEnabled: true,
  respectContactRules: true,
  stopAfterLimit: true,
  requireApproval: false,

  preferredChannel: "email",
  messageLanguage: "English",
};

function loadSettings() {
  try {
    const stored = localStorage.getItem("payrecover_settings");

    if (stored) {
      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(stored),
      };
    }
  } catch (error) {
    console.error("Unable to load settings:", error);
  }

  return { ...DEFAULT_SETTINGS };
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(
        "payrecover_settings",
        JSON.stringify(settings)
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Unable to save settings:", error);
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset all PayRecover settings to their recommended defaults?"
    );

    if (!confirmed) {
      return;
    }

    const defaults = { ...DEFAULT_SETTINGS };

    setSettings(defaults);

    localStorage.setItem(
      "payrecover_settings",
      JSON.stringify(defaults)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="settings-page">

      {/* HEADER */}
      <div className="settings-header">

        <div>
          <div className="settings-eyebrow">
            <SlidersHorizontal size={15} />
            WORKSPACE CONFIGURATION
          </div>

          <h1>Settings</h1>

          <p>
            Configure how PayRecover AI monitors payments,
            executes recovery workflows and communicates with
            customers.
          </p>
        </div>

        <div className="settings-actions">

          {saved && (
            <div className="settings-saved">
              <CheckCircle2 size={16} />
              Settings saved
            </div>
          )}

          <button
            className="settings-reset-button"
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            className="settings-save-button"
            onClick={handleSave}
          >
            <Save size={16} />
            Save changes
          </button>

        </div>

      </div>

      {/* STATUS BANNER */}
      <div className="settings-status-banner">

        <div className="settings-status-icon">
          <Zap size={19} />
        </div>

        <div>
          <strong>
            Recovery intelligence is active
          </strong>

          <span>
            PayRecover is monitoring payment failures and
            applying your configured recovery policies.
          </span>
        </div>

        <div className="settings-live-badge">
          <span />
          LIVE
        </div>

      </div>

      <div className="settings-layout">

        <main className="settings-main">

          {/* AUTOMATION */}
          <SettingsSection
            icon={<Zap size={19} />}
            title="Recovery automation"
            description="Control how PayRecover responds to payment failures."
          >

            <SettingToggle
              title="Enable recovery automation"
              description="Allow PayRecover to automatically create recovery workflows for eligible failed payments."
              checked={settings.automationEnabled}
              onChange={(value) =>
                updateSetting("automationEnabled", value)
              }
            />

            <SettingToggle
              title="Automatically create recoveries"
              description="Create a recovery workflow when a payment becomes eligible for recovery."
              checked={settings.autoCreateRecovery}
              disabled={!settings.automationEnabled}
              onChange={(value) =>
                updateSetting("autoCreateRecovery", value)
              }
            />

            <SettingToggle
              title="Automatic customer communication"
              description="Allow recovery communications to be sent without manual approval."
              checked={settings.autoSendRecovery}
              disabled={!settings.automationEnabled}
              onChange={(value) =>
                updateSetting("autoSendRecovery", value)
              }
            />

            <SettingToggle
              title="AI recommendations"
              description="Use the recovery intelligence engine to recommend the next best action."
              checked={settings.aiRecommendations}
              onChange={(value) =>
                updateSetting("aiRecommendations", value)
              }
            />

          </SettingsSection>

          {/* RECOVERY POLICY */}
          <SettingsSection
            icon={<RotateCcw size={19} />}
            title="Recovery policy"
            description="Define the limits and timing of recovery attempts."
          >

            <div className="settings-grid">

              <SettingSelect
                label="Maximum attempts"
                description="Maximum recovery attempts allowed for a payment."
                value={settings.maxAttempts}
                onChange={(value) =>
                  updateSetting(
                    "maxAttempts",
                    Number(value)
                  )
                }
                options={[
                  { value: 1, label: "1 attempt" },
                  { value: 2, label: "2 attempts" },
                  { value: 3, label: "3 attempts" },
                  { value: 4, label: "4 attempts" },
                  { value: 5, label: "5 attempts" },
                ]}
              />

              <SettingSelect
                label="Retry window"
                description="Time window in which recovery attempts may be executed."
                value={settings.retryWindow}
                onChange={(value) =>
                  updateSetting(
                    "retryWindow",
                    Number(value)
                  )
                }
                options={[
                  { value: 24, label: "24 hours" },
                  { value: 48, label: "48 hours" },
                  { value: 72, label: "72 hours" },
                  { value: 96, label: "96 hours" },
                  { value: 120, label: "120 hours" },
                ]}
              />

              <SettingSelect
                label="Recovery expiry"
                description="Close recovery workflows after this period."
                value={settings.recoveryExpiry}
                onChange={(value) =>
                  updateSetting(
                    "recoveryExpiry",
                    Number(value)
                  )
                }
                options={[
                  { value: 3, label: "3 days" },
                  { value: 5, label: "5 days" },
                  { value: 7, label: "7 days" },
                  { value: 14, label: "14 days" },
                  { value: 30, label: "30 days" },
                ]}
              />

              <SettingSelect
                label="Preferred recovery channel"
                description="Default channel for customer recovery communication."
                value={settings.preferredChannel}
                onChange={(value) =>
                  updateSetting(
                    "preferredChannel",
                    value
                  )
                }
                options={[
                  { value: "email", label: "Email" },
                  { value: "sms", label: "SMS" },
                  { value: "payment_retry", label: "Payment retry" },
                  { value: "manual", label: "Manual" },
                ]}
              />

            </div>

          </SettingsSection>

          {/* CUSTOMER COMMUNICATION */}
          <SettingsSection
            icon={<Mail size={19} />}
            title="Customer communication"
            description="Configure recovery communication preferences."
          >

            <div className="settings-grid">

              <SettingSelect
                label="Message language"
                description="Preferred language for AI-generated recovery messages."
                value={settings.messageLanguage}
                onChange={(value) =>
                  updateSetting(
                    "messageLanguage",
                    value
                  )
                }
                options={[
                  {
                    value: "English",
                    label: "English",
                  },
                  {
                    value: "Hindi",
                    label: "Hindi",
                  },
                  {
                    value: "Hinglish",
                    label: "Hinglish",
                  },
                ]}
              />

            </div>

            <SettingToggle
              title="Enable recovery emails"
              description="Allow the recovery workflow to prepare and send customer email communications."
              checked={settings.emailEnabled}
              onChange={(value) =>
                updateSetting("emailEnabled", value)
              }
            />

            <SettingToggle
              title="Recovery alerts"
              description="Show alerts when a recovery workflow requires attention."
              checked={settings.recoveryAlerts}
              onChange={(value) =>
                updateSetting("recoveryAlerts", value)
              }
            />

          </SettingsSection>

          {/* NOTIFICATIONS */}
          <SettingsSection
            icon={<Bell size={19} />}
            title="Notifications"
            description="Choose which operational events should appear in your workspace."
          >

            <SettingToggle
              title="Critical alerts"
              description="Receive alerts for high-priority recovery failures and compliance events."
              checked={settings.criticalAlerts}
              onChange={(value) =>
                updateSetting("criticalAlerts", value)
              }
            />

            <SettingToggle
              title="Daily recovery summary"
              description="Receive a daily overview of recovery performance and recovered revenue."
              checked={settings.dailySummary}
              onChange={(value) =>
                updateSetting("dailySummary", value)
              }
            />

          </SettingsSection>

          {/* COMPLIANCE */}
          <SettingsSection
            icon={<ShieldCheck size={19} />}
            title="Compliance & safety"
            description="Protect customers and enforce recovery guardrails."
          >

            <SettingToggle
              title="Compliance guardrails"
              description="Enforce configured recovery safety rules before customer contact or action execution."
              checked={settings.complianceEnabled}
              onChange={(value) =>
                updateSetting(
                  "complianceEnabled",
                  value
                )
              }
            />

            <SettingToggle
              title="Respect customer contact rules"
              description="Prevent recovery communication when contact is not permitted."
              checked={settings.respectContactRules}
              disabled={!settings.complianceEnabled}
              onChange={(value) =>
                updateSetting(
                  "respectContactRules",
                  value
                )
              }
            />

            <SettingToggle
              title="Stop after attempt limit"
              description="Automatically stop recovery workflows after the configured maximum attempts."
              checked={settings.stopAfterLimit}
              disabled={!settings.complianceEnabled}
              onChange={(value) =>
                updateSetting(
                  "stopAfterLimit",
                  value
                )
              }
            />

            <SettingToggle
              title="Require manual approval"
              description="Require an operator to approve recovery actions before they are executed."
              checked={settings.requireApproval}
              onChange={(value) =>
                updateSetting(
                  "requireApproval",
                  value
                )
              }
            />

          </SettingsSection>

        </main>

        {/* SIDEBAR */}
        <aside className="settings-sidebar">

          <section className="settings-card settings-summary-card">

            <div className="settings-summary-header">
              <div className="settings-summary-icon">
                <Sparkles size={20} />
              </div>

              <div>
                <span>AI CONTROL CENTER</span>
                <h2>Recovery Intelligence</h2>
              </div>
            </div>

            <p>
              Your current configuration controls how the AI
              recovery engine evaluates failed payments and
              recommends interventions.
            </p>

            <SummaryRow
              label="Automation"
              enabled={settings.automationEnabled}
            />

            <SummaryRow
              label="AI recommendations"
              enabled={settings.aiRecommendations}
            />

            <SummaryRow
              label="Compliance"
              enabled={settings.complianceEnabled}
            />

            <SummaryRow
              label="Customer email"
              enabled={settings.emailEnabled}
            />

          </section>

          <section className="settings-card">

            <div className="settings-side-title">
              <Clock3 size={17} />
              Current policy
            </div>

            <div className="policy-row">
              <span>Max attempts</span>
              <strong>
                {settings.maxAttempts}
              </strong>
            </div>

            <div className="policy-row">
              <span>Retry window</span>
              <strong>
                {settings.retryWindow}h
              </strong>
            </div>

            <div className="policy-row">
              <span>Expiry</span>
              <strong>
                {settings.recoveryExpiry}d
              </strong>
            </div>

            <div className="policy-row">
              <span>Channel</span>
              <strong>
                {settings.preferredChannel}
              </strong>
            </div>

          </section>

          <section className="settings-card compliance-summary">

            <div className="settings-side-title">
              <ShieldCheck size={17} />
              Safety status
            </div>

            <div className="compliance-status">
              <CheckCircle2 size={18} />

              <div>
                <strong>
                  Guardrails enabled
                </strong>

                <span>
                  Recovery actions are subject to configured
                  customer-contact and attempt limits.
                </span>
              </div>
            </div>

          </section>

        </aside>

      </div>

      {/* MOBILE SAVE BAR */}
      <div className="settings-mobile-save">
        <button
          className="settings-save-button"
          onClick={handleSave}
        >
          <Save size={16} />
          Save changes
        </button>
      </div>

    </div>
  );
}


/* =========================================================
   SECTION
========================================================= */

function SettingsSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="settings-card">

      <div className="settings-section-header">

        <div className="settings-section-icon">
          {icon}
        </div>

        <div>
          <h2>{title}</h2>

          <p>{description}</p>
        </div>

      </div>

      <div className="settings-section-body">
        {children}
      </div>

    </section>
  );
}


/* =========================================================
   TOGGLE
========================================================= */

function SettingToggle({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div
      className={`setting-toggle-row ${
        disabled ? "disabled" : ""
      }`}
    >

      <div className="setting-toggle-content">

        <h3>{title}</h3>

        <p>{description}</p>

      </div>

      <button
        type="button"
        className={`settings-switch ${
          checked ? "active" : ""
        }`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        aria-label={title}
        aria-pressed={checked}
      >
        <span />
      </button>

    </div>
  );
}


/* =========================================================
   SELECT
========================================================= */

function SettingSelect({
  label,
  description,
  value,
  onChange,
  options,
}) {
  return (
    <div className="setting-select">

      <label>{label}</label>

      <p>{description}</p>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

    </div>
  );
}


/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({ label, enabled }) {
  return (
    <div className="settings-summary-row">

      <span>{label}</span>

      <strong className={enabled ? "enabled" : "disabled"}>
        <span />
        {enabled ? "Enabled" : "Off"}
      </strong>

    </div>
  );
}


/* =========================================================
   EXPORT
========================================================= */