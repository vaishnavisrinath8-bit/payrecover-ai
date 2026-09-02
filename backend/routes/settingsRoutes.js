
const express = require("express");

const router = express.Router();

// ============================================================
// DEFAULT COMPLIANCE SETTINGS
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

// ============================================================
// GET ALL SETTINGS
// ============================================================

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      compliance: complianceRules,
    },
  });
});

// ============================================================
// GET COMPLIANCE RULES
// ============================================================

router.get(
  "/compliance",
  (req, res) => {
    console.log(
      "GET /api/settings/compliance"
    );

    res.json({
      success: true,
      data: complianceRules,
    });
  }
);

// ============================================================
// UPDATE COMPLIANCE RULES
// ============================================================

router.put(
  "/compliance",
  (req, res) => {
    try {
      console.log(
        "PUT /api/settings/compliance"
      );

      console.log(
        "Received settings:",
        req.body
      );

      const allowedFields = [
        "maxRecoveryAttempts",
        "minimumRecoveryProbability",
        "stopAfterDays",
        "customerContactLimit",
        "minimumAmountForRecovery",
        "enableAutomaticRetry",
        "enableEmailRecovery",
        "enableWhatsAppRecovery",
        "enableVoiceRecovery",
        "enableAIRecovery",
        "respectCustomerOptOut",
        "requireCustomerConsent",
        "escalationEnabled",
        "escalationAfterAttempts",
      ];

      allowedFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            complianceRules[field] =
              req.body[field];
          }
        }
      );

      // --------------------------------------------------------
      // Normalize numeric values
      // --------------------------------------------------------

      const numericFields = [
        "maxRecoveryAttempts",
        "minimumRecoveryProbability",
        "stopAfterDays",
        "customerContactLimit",
        "minimumAmountForRecovery",
        "escalationAfterAttempts",
      ];

      numericFields.forEach(
        (field) => {
          if (
            complianceRules[field] !==
            undefined
          ) {
            complianceRules[field] =
              Number(
                complianceRules[field]
              );
          }
        }
      );

      // --------------------------------------------------------
      // Safety limits
      // --------------------------------------------------------

      if (
        complianceRules.maxRecoveryAttempts <
        1
      ) {
        complianceRules.maxRecoveryAttempts = 1;
      }

      if (
        complianceRules.maxRecoveryAttempts >
        10
      ) {
        complianceRules.maxRecoveryAttempts = 10;
      }

      if (
        complianceRules.minimumRecoveryProbability <
        0
      ) {
        complianceRules.minimumRecoveryProbability = 0;
      }

      if (
        complianceRules.minimumRecoveryProbability >
        100
      ) {
        complianceRules.minimumRecoveryProbability = 100;
      }

      if (
        complianceRules.stopAfterDays <
        1
      ) {
        complianceRules.stopAfterDays = 1;
      }

      if (
        complianceRules.customerContactLimit <
        1
      ) {
        complianceRules.customerContactLimit = 1;
      }

      if (
        complianceRules.minimumAmountForRecovery <
        0
      ) {
        complianceRules.minimumAmountForRecovery = 0;
      }

      if (
        complianceRules.escalationAfterAttempts <
        1
      ) {
        complianceRules.escalationAfterAttempts = 1;
      }

      // --------------------------------------------------------
      // Response
      // --------------------------------------------------------

      res.json({
        success: true,
        message:
          "Compliance rules updated successfully.",
        data: complianceRules,
      });
    } catch (error) {
      console.error(
        "Compliance update error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update compliance rules.",
      });
    }
  }
);

// ============================================================
// RESET COMPLIANCE RULES
// ============================================================

router.post(
  "/compliance/reset",
  (req, res) => {
    complianceRules = {
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

    res.json({
      success: true,
      message:
        "Compliance rules reset successfully.",
      data: complianceRules,
    });
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;

