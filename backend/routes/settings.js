
const express = require("express");

const router = express.Router();

const Settings = require("../models/Settings");

// ============================================================
// HELPERS
// ============================================================

const normalizeSettings = (settings) => {
  if (!settings) {
    return null;
  }

  const object =
    typeof settings.toObject === "function"
      ? settings.toObject()
      : settings;

  return {
    ...object,

    id:
      object._id ||
      object.id,

    name:
      object.name ||
      "PayRecover Admin",

    email:
      object.email ||
      "",

    company:
      object.company ||
      "PayRecover AI",

    phone:
      object.phone ||
      "",

    role:
      object.role ||
      "Administrator",

    recovery: {
      autoRetry:
        object.recovery?.autoRetry ??
        true,

      maxAttempts:
        Number(
          object.recovery?.maxAttempts
        ) || 3,

      defaultChannel:
        object.recovery?.defaultChannel ||
        "email",

      escalationEnabled:
        object.recovery?.escalationEnabled ??
        true,

      escalationAfterAttempts:
        Number(
          object.recovery
            ?.escalationAfterAttempts
        ) || 2,
    },

    notifications: {
      paymentFailureAlerts:
        object.notifications
          ?.paymentFailureAlerts ??
        true,

      recoveryAlerts:
        object.notifications
          ?.recoveryAlerts ??
        true,

      recoverySuccessAlerts:
        object.notifications
          ?.recoverySuccessAlerts ??
        true,

      dailyReport:
        object.notifications?.dailyReport ??
        true,

      weeklyReport:
        object.notifications?.weeklyReport ??
        true,
    },

    compliance: {
      contactAllowed:
        object.compliance?.contactAllowed ??
        true,

      honorCustomerStop:
        object.compliance?.honorCustomerStop ??
        true,

      maxContactAttempts:
        Number(
          object.compliance
            ?.maxContactAttempts
        ) || 3,

      minimumContactIntervalHours:
        Number(
          object.compliance
            ?.minimumContactIntervalHours
        ) || 24,

      requireConsent:
        object.compliance?.requireConsent ??
        true,

      stopOnSuccessfulPayment:
        object.compliance
          ?.stopOnSuccessfulPayment ??
        true,
    },

    communication: {
      emailEnabled:
        object.communication?.emailEnabled ??
        true,

      smsEnabled:
        object.communication?.smsEnabled ??
        false,

      whatsappEnabled:
        object.communication?.whatsappEnabled ??
        false,

      phoneEnabled:
        object.communication?.phoneEnabled ??
        false,
    },
  };
};

// ============================================================
// GET SETTINGS
// GET /api/settings
// ============================================================

router.get("/", async (req, res) => {
  try {
    const settings =
      await Settings.getSettings();

    const result =
      normalizeSettings(settings);

    res.json({
      success: true,

      settings: result,

      data: result,
    });
  } catch (error) {
    console.error(
      "GET /settings error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load settings.",
      error:
        error.message,
    });
  }
});

// ============================================================
// UPDATE SETTINGS
// PUT /api/settings
// ============================================================

router.put("/", async (req, res) => {
  try {
    const body =
      req.body || {};

    let settings =
      await Settings.getSettings();

    // ========================================================
    // ACCOUNT
    // ========================================================

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "name"
      )
    ) {
      settings.name =
        String(body.name).trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "email"
      )
    ) {
      settings.email =
        String(body.email)
          .trim()
          .toLowerCase();
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "company"
      )
    ) {
      settings.company =
        String(body.company).trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "phone"
      )
    ) {
      settings.phone =
        String(body.phone).trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "role"
      )
    ) {
      settings.role =
        String(body.role).trim();
    }

    // ========================================================
    // RECOVERY
    // ========================================================

    if (body.recovery) {
      if (
        typeof body.recovery.autoRetry ===
        "boolean"
      ) {
        settings.recovery.autoRetry =
          body.recovery.autoRetry;
      }

      if (
        body.recovery.maxAttempts !==
        undefined
      ) {
        settings.recovery.maxAttempts =
          Math.min(
            Math.max(
              Number(
                body.recovery.maxAttempts
              ) || 3,
              1
            ),
            10
          );
      }

      if (
        body.recovery.defaultChannel
      ) {
        const allowedChannels = [
          "email",
          "sms",
          "whatsapp",
          "phone",
        ];

        if (
          allowedChannels.includes(
            body.recovery.defaultChannel
          )
        ) {
          settings.recovery.defaultChannel =
            body.recovery.defaultChannel;
        }
      }

      if (
        typeof body.recovery
          .escalationEnabled ===
        "boolean"
      ) {
        settings.recovery.escalationEnabled =
          body.recovery.escalationEnabled;
      }

      if (
        body.recovery
          .escalationAfterAttempts !==
        undefined
      ) {
        settings.recovery
          .escalationAfterAttempts =
          Math.min(
            Math.max(
              Number(
                body.recovery
                  .escalationAfterAttempts
              ) || 2,
              1
            ),
            10
          );
      }
    }

    // ========================================================
    // NOTIFICATIONS
    // ========================================================

    if (body.notifications) {
      const notificationFields = [
        "paymentFailureAlerts",
        "recoveryAlerts",
        "recoverySuccessAlerts",
        "dailyReport",
        "weeklyReport",
      ];

      notificationFields.forEach(
        (field) => {
          if (
            typeof body.notifications[
              field
            ] === "boolean"
          ) {
            settings.notifications[
              field
            ] =
              body.notifications[field];
          }
        }
      );
    }

    // ========================================================
    // COMPLIANCE
    // ========================================================

    if (body.compliance) {
      if (
        typeof body.compliance
          .contactAllowed ===
        "boolean"
      ) {
        settings.compliance.contactAllowed =
          body.compliance.contactAllowed;
      }

      if (
        typeof body.compliance
          .honorCustomerStop ===
        "boolean"
      ) {
        settings.compliance.honorCustomerStop =
          body.compliance.honorCustomerStop;
      }

      if (
        body.compliance
          .maxContactAttempts !==
        undefined
      ) {
        settings.compliance
          .maxContactAttempts =
          Math.min(
            Math.max(
              Number(
                body.compliance
                  .maxContactAttempts
              ) || 3,
              1
            ),
            20
          );
      }

      if (
        body.compliance
          .minimumContactIntervalHours !==
        undefined
      ) {
        settings.compliance
          .minimumContactIntervalHours =
          Math.min(
            Math.max(
              Number(
                body.compliance
                  .minimumContactIntervalHours
              ) || 24,
              1
            ),
            720
          );
      }

      if (
        typeof body.compliance
          .requireConsent ===
        "boolean"
      ) {
        settings.compliance.requireConsent =
          body.compliance.requireConsent;
      }

      if (
        typeof body.compliance
          .stopOnSuccessfulPayment ===
        "boolean"
      ) {
        settings.compliance
          .stopOnSuccessfulPayment =
          body.compliance.stopOnSuccessfulPayment;
      }
    }

    // ========================================================
    // COMMUNICATION
    // ========================================================

    if (body.communication) {
      const communicationFields = [
        "emailEnabled",
        "smsEnabled",
        "whatsappEnabled",
        "phoneEnabled",
      ];

      communicationFields.forEach(
        (field) => {
          if (
            typeof body.communication[
              field
            ] === "boolean"
          ) {
            settings.communication[
              field
            ] =
              body.communication[field];
          }
        }
      );
    }

    await settings.save();

    const result =
      normalizeSettings(settings);

    res.json({
      success: true,

      message:
        "Settings updated successfully.",

      settings: result,

      data: result,
    });
  } catch (error) {
    console.error(
      "PUT /settings error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update settings.",
      error:
        error.message,
    });
  }
});

// ============================================================
// GET COMPLIANCE SETTINGS
// GET /api/settings/compliance
// ============================================================

router.get(
  "/compliance",
  async (req, res) => {
    try {
      const settings =
        await Settings.getSettings();

      const compliance =
        settings.compliance;

      res.json({
        success: true,

        compliance,

        data: compliance,
      });
    } catch (error) {
      console.error(
        "GET /settings/compliance error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load compliance settings.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// UPDATE COMPLIANCE SETTINGS
// PUT /api/settings/compliance
// ============================================================

router.put(
  "/compliance",
  async (req, res) => {
    try {
      const settings =
        await Settings.getSettings();

      const body =
        req.body || {};

      if (
        typeof body.contactAllowed ===
        "boolean"
      ) {
        settings.compliance.contactAllowed =
          body.contactAllowed;
      }

      if (
        typeof body.honorCustomerStop ===
        "boolean"
      ) {
        settings.compliance.honorCustomerStop =
          body.honorCustomerStop;
      }

      if (
        body.maxContactAttempts !==
        undefined
      ) {
        settings.compliance
          .maxContactAttempts =
          Math.min(
            Math.max(
              Number(
                body.maxContactAttempts
              ) || 3,
              1
            ),
            20
          );
      }

      if (
        body.minimumContactIntervalHours !==
        undefined
      ) {
        settings.compliance
          .minimumContactIntervalHours =
          Math.min(
            Math.max(
              Number(
                body.minimumContactIntervalHours
              ) || 24,
              1
            ),
            720
          );
      }

      if (
        typeof body.requireConsent ===
        "boolean"
      ) {
        settings.compliance.requireConsent =
          body.requireConsent;
      }

      if (
        typeof body.stopOnSuccessfulPayment ===
        "boolean"
      ) {
        settings.compliance
          .stopOnSuccessfulPayment =
          body.stopOnSuccessfulPayment;
      }

      await settings.save();

      res.json({
        success: true,

        message:
          "Compliance settings updated successfully.",

        compliance:
          settings.compliance,

        data:
          settings.compliance,
      });
    } catch (error) {
      console.error(
        "PUT /settings/compliance error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update compliance settings.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;

