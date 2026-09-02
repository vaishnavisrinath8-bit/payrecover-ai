const {
  getRecoveryAuditLogs,
  getPaymentAuditLogs,
  getAllAuditLogs,
} = require("../services/recoveryAuditService");

/**
 * ============================================================
 * GET AUDIT LOGS FOR A RECOVERY
 * ============================================================
 *
 * GET /api/recoveries/:recoveryId/audit
 *
 * ============================================================
 */
const getRecoveryAudit = async (
  req,
  res
) => {
  try {
    const { recoveryId } = req.params;

    if (!recoveryId) {
      return res.status(400).json({
        success: false,
        message: "Recovery ID is required",
      });
    }

    const logs =
      await getRecoveryAuditLogs(
        recoveryId
      );

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(
      "Get recovery audit error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch recovery audit logs",
      error: error.message,
    });
  }
};

/**
 * ============================================================
 * GET AUDIT LOGS FOR A PAYMENT
 * ============================================================
 *
 * GET /api/recoveries/payment/:paymentId/audit
 *
 * ============================================================
 */
const getPaymentAudit = async (
  req,
  res
) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const logs =
      await getPaymentAuditLogs(
        paymentId
      );

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(
      "Get payment audit error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch payment audit logs",
      error: error.message,
    });
  }
};

/**
 * ============================================================
 * GET ALL AUDIT LOGS
 * ============================================================
 *
 * GET /api/recoveries/audit
 *
 * Filters:
 *
 * ?event=retry_initiated
 * ?performedBy=system
 *
 * Pagination:
 *
 * ?page=1&limit=50
 *
 * ============================================================
 */
const getAuditLogs = async (
  req,
  res
) => {
  try {
    const {
      event,
      performedBy,
      page,
      limit,
    } = req.query;

    const result =
      await getAllAuditLogs({
        event,
        performedBy,
        page,
        limit,
      });

    return res.status(200).json({
      success: true,

      count:
        result.logs.length,

      total:
        result.total,

      page:
        result.page,

      limit:
        result.limit,

      pages:
        result.pages,

      data:
        result.logs,
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch audit logs",
      error: error.message,
    });
  }
};

module.exports = {
  getRecoveryAudit,
  getPaymentAudit,
  getAuditLogs,
};