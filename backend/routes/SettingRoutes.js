const express = require("express");

const router = express.Router();

// ============================================================
// IN-MEMORY SETTINGS
// ============================================================
// This is suitable for the current demo/internship version.
// Later, these can be moved into a MongoDB Settings model.
// ============================================================

let complianceRules = {
  maxRecoveryAttempts: 3,

  minimumRecoveryProbability: 30,

  stopAfterDays: 14,

  customerContactLimit: 3,

  minimumAmountForRecovery: 100,

  enableAutomaticRetry: true,

  enableEmailRecovery: true,

  enableWhatsAppRecovery: false,

  enableVoiceRecovery: false,

  enableAIRecovery: true,

  respectCustomerOptOut: true,

  requireCustomerConsent: true,

  escalationEnabled: true,

  escalationAfterAttempts: 2,
};

let generalSettings = {
  companyName: "PayRecover AI",

  defaultCurrency: "INR",

  timezone: "Asia/Kolkata",

  emailNotifications: true,

  recoveryNotifications: true,

  systemNotifications: true,
};

// ============================================================
// GET ALL SETTINGS
// ============================================================

router.get("/", (req, res) => {
  try {
    res.json({
      success: true,

      data: {
        compliance: complianceRules,
        general: generalSettings,
      },
    });
  } catch (error) {
    console.error(
      "GET SETTINGS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load settings",
    });
  }
});

// ============================================================
// GET COMPLIANCE RULES
// ============================================================

router.get("/compliance", (req, res) => {
  try {
    res.json({
      success: true,

      data: complianceRules,
    });
  } catch (error) {
    console.error(
      "GET COMPLIANCE RULES ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load compliance rules",
    });
  }
});

// ============================================================
// UPDATE COMPLIANCE RULES
// ============================================================

router.put("/compliance", (req, res) => {
  try {
    const updates = req.body || {};

    // --------------------------------------------------------
    // Numeric validation
    // --------------------------------------------------------

    if (
      updates.maxRecoveryAttempts !== undefined
    ) {
      const value = Number(
        updates.maxRecoveryAttempts
      );

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 20
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum recovery attempts must be between 1 and 20",
        });
      }

      complianceRules.maxRecoveryAttempts =
        value;
    }

    if (
      updates.minimumRecoveryProbability !==
      undefined
    ) {
      const value = Number(
        updates.minimumRecoveryProbability
      );

      if (
        Number.isNaN(value) ||
        value < 0 ||
        value > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum recovery probability must be between 0 and 100",
        });
      }

      complianceRules.minimumRecoveryProbability =
        value;
    }

    if (
      updates.stopAfterDays !== undefined
    ) {
      const value = Number(
        updates.stopAfterDays
      );

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 365
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stop-after days must be between 1 and 365",
        });
      }

      complianceRules.stopAfterDays =
        value;
    }

    if (
      updates.customerContactLimit !==
      undefined
    ) {
      const value = Number(
        updates.customerContactLimit
      );

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 20
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer contact limit must be between 1 and 20",
        });
      }

      complianceRules.customerContactLimit =
        value;
    }

    if (
      updates.minimumAmountForRecovery !==
      undefined
    ) {
      const value = Number(
        updates.minimumAmountForRecovery
      );

      if (
        Number.isNaN(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum recovery amount must be a positive number",
        });
      }

      complianceRules.minimumAmountForRecovery =
        value;
    }

    if (
      updates.escalationAfterAttempts !==
      undefined
    ) {
      const value = Number(
        updates.escalationAfterAttempts
      );

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 20
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Escalation attempt value must be between 1 and 20",
        });
      }

      complianceRules.escalationAfterAttempts =
        value;
    }

    // --------------------------------------------------------
    // Boolean settings
    // --------------------------------------------------------

    const booleanFields = [
      "enableAutomaticRetry",
      "enableEmailRecovery",
      "enableWhatsAppRecovery",
      "enableVoiceRecovery",
      "enableAIRecovery",
      "respectCustomerOptOut",
      "requireCustomerConsent",
      "escalationEnabled",
    ];

    booleanFields.forEach((field) => {
      if (
        updates[field] !== undefined
      ) {
        complianceRules[field] =
          Boolean(updates[field]);
      }
    });

    console.log(
      "Compliance rules updated:",
      complianceRules
    );

    res.json({
      success: true,

      message:
        "Compliance rules updated successfully",

      data: complianceRules,
    });
  } catch (error) {
    console.error(
      "UPDATE COMPLIANCE RULES ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to update compliance rules",
    });
  }
});

// ============================================================
// UPDATE GENERAL SETTINGS
// ============================================================

router.put("/", (req, res) => {
  try {
    const updates = req.body || {};

    if (
      updates.companyName !== undefined
    ) {
      generalSettings.companyName =
        String(
          updates.companyName
        ).trim();
    }

    if (
      updates.defaultCurrency !==
      undefined
    ) {
      generalSettings.defaultCurrency =
        String(
          updates.defaultCurrency
        ).toUpperCase();
    }

    if (
      updates.timezone !== undefined
    ) {
      generalSettings.timezone =
        String(
          updates.timezone
        );
    }

    const notificationFields = [
      "emailNotifications",
      "recoveryNotifications",
      "systemNotifications",
    ];

    notificationFields.forEach(
      (field) => {
        if (
          updates[field] !== undefined
        ) {
          generalSettings[field] =
            Boolean(
              updates[field]
            );
        }
      }
    );

    res.json({
      success: true,

      message:
        "Settings updated successfully",

      data: generalSettings,
    });
  } catch (error) {
    console.error(
      "UPDATE SETTINGS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to update settings",
    });
  }
});

module.exports = router;