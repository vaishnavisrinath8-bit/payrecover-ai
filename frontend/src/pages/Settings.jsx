import React, { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Globe,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";

import { Toast } from "../components/UI";

const DEFAULT_SETTINGS = {
  businessName: "PayRecover AI",
  currency: "INR",
  timezone: "Asia/Kolkata",

  paymentFailureNotifications: true,
  recoveryNotifications: true,
  emailNotifications: true,

  enableRecoveryWorkflow: true,
  automaticRecoveryEmails: false,
  retryPreferences: "standard",

  sessionSecurity: true,
};

export default function Settings() {
  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "payrecover_settings"
      );

      if (stored) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored),
        });
      }
    } catch {
      // Keep defaults.
    }
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const update = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveSettings = () => {
    localStorage.setItem(
      "payrecover_settings",
      JSON.stringify(settings)
    );

    setToast({
      type: "success",
      message: "Settings saved successfully.",
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("payrecover_settings");

    setToast({
      type: "success",
      message: "Settings have been reset.",
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Configuration</span>
          <h1>Settings</h1>
          <p>
            Configure workspace preferences and recovery
            behavior.
          </p>
        </div>

        <div className="header-buttons">
          <button
            className="btn secondary"
            onClick={resetSettings}
          >
            <RotateCcw size={17} />
            Reset
          </button>

          <button
            className="btn primary"
            onClick={saveSettings}
          >
            <Save size={17} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="settings-layout">
        <section className="card settings-section">
          <SettingsHeading
            icon={Globe}
            title="General"
            description="Default workspace configuration"
          />

          <div className="settings-grid">
            <Field
              label="Business name"
              value={settings.businessName}
              onChange={(value) =>
                update("businessName", value)
              }
            />

            <div className="field">
              <label>Default currency</label>

              <select
                value={settings.currency}
                onChange={(event) =>
                  update(
                    "currency",
                    event.target.value
                  )
                }
              >
                <option value="INR">
                  INR — Indian Rupee
                </option>
                <option value="USD">
                  USD — US Dollar
                </option>
                <option value="EUR">
                  EUR — Euro
                </option>
                <option value="GBP">
                  GBP — British Pound
                </option>
              </select>
            </div>

            <div className="field">
              <label>Timezone</label>

              <select
                value={settings.timezone}
                onChange={(event) =>
                  update(
                    "timezone",
                    event.target.value
                  )
                }
              >
                <option value="Asia/Kolkata">
                  Asia/Kolkata
                </option>
                <option value="UTC">UTC</option>
                <option value="Asia/Singapore">
                  Asia/Singapore
                </option>
                <option value="Europe/London">
                  Europe/London
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <SettingsHeading
            icon={Bell}
            title="Notifications"
            description="Choose which operational events you want to monitor"
          />

          <ToggleRow
            title="Payment failure notifications"
            description="Receive notifications when a payment fails."
            checked={
              settings.paymentFailureNotifications
            }
            onChange={(value) =>
              update(
                "paymentFailureNotifications",
                value
              )
            }
          />

          <ToggleRow
            title="Recovery notifications"
            description="Receive updates about recovery workflows."
            checked={settings.recoveryNotifications}
            onChange={(value) =>
              update("recoveryNotifications", value)
            }
          />

          <ToggleRow
            title="Email notifications"
            description="Enable operational email notifications."
            checked={settings.emailNotifications}
            onChange={(value) =>
              update("emailNotifications", value)
            }
          />
        </section>

        <section className="card settings-section">
          <SettingsHeading
            icon={ShieldCheck}
            title="Recovery preferences"
            description="Configure how payment recovery should behave"
          />

          <ToggleRow
            title="Enable recovery workflow"
            description="Allow failed payments to enter the recovery workflow."
            checked={settings.enableRecoveryWorkflow}
            onChange={(value) =>
              update(
                "enableRecoveryWorkflow",
                value
              )
            }
          />

          <ToggleRow
            title="Automatic recovery emails"
            description="Enable automatic recovery email behavior when supported by the backend."
            checked={settings.automaticRecoveryEmails}
            onChange={(value) =>
              update(
                "automaticRecoveryEmails",
                value
              )
            }
          />

          <div className="field settings-field">
            <label>Retry preference</label>

            <select
              value={settings.retryPreferences}
              onChange={(event) =>
                update(
                  "retryPreferences",
                  event.target.value
                )
              }
            >
              <option value="conservative">
                Conservative
              </option>
              <option value="standard">Standard</option>
              <option value="aggressive">
                Aggressive
              </option>
            </select>
          </div>
        </section>

        <section className="card settings-section">
          <SettingsHeading
            icon={Lock}
            title="Security"
            description="Frontend workspace security preferences"
          />

          <ToggleRow
            title="Session security"
            description="Keep frontend session state isolated from payment API data."
            checked={settings.sessionSecurity}
            onChange={(value) =>
              update("sessionSecurity", value)
            }
          />

          <div className="security-note">
            <Check size={16} />
            <span>
              No authentication API is assumed. Logout only
              clears frontend session state.
            </span>
          </div>
        </section>
      </div>

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </>
  );
}

function SettingsHeading({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="settings-heading">
      <div className="settings-icon">
        <Icon size={19} />
      </div>

      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}) {
  return (
    <div className="field">
      <label>{label}</label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="toggle-row">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        className={`toggle ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
        aria-label={title}
        aria-pressed={checked}
      >
        <span />
      </button>
    </div>
  );
}