const express = require("express");

const router =
  express.Router();

const {
  getRecoveryAudit,
  getPaymentAudit,
  getAuditLogs,
} = require("../controllers/recoveryAuditController");

/**
 * ============================================================
 * ALL AUDIT LOGS
 * ============================================================
 *
 * GET /api/recoveries/audit
 *
 * ============================================================
 */
router.get(
  "/audit",
  getAuditLogs
);

/**
 * ============================================================
 * PAYMENT AUDIT
 * ============================================================
 *
 * GET /api/recoveries/payment/:paymentId/audit
 *
 * ============================================================
 */
router.get(
  "/payment/:paymentId/audit",
  getPaymentAudit
);

/**
 * ============================================================
 * RECOVERY AUDIT
 * ============================================================
 *
 * GET /api/recoveries/:recoveryId/audit
 *
 * ============================================================
 */
router.get(
  "/:recoveryId/audit",
  getRecoveryAudit
);

module.exports = router;