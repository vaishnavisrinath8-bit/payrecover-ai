const RecoveryAudit = require("../models/RecoveryAudit");

/**
 * ============================================================
 * CREATE RECOVERY AUDIT LOG
 * ============================================================
 */
const createAuditLog = async ({
  recoveryId,
  paymentId,
  event,
  action = null,
  status = null,
  previousStatus = null,
  newStatus = null,
  strategy = null,
  failureReason = null,
  failureCode = null,
  retryCount = 0,
  message,
  metadata = {},
  performedBy = "system",
}) => {
  try {
    if (!recoveryId) {
      throw new Error(
        "Recovery ID is required for audit log"
      );
    }

    if (!paymentId) {
      throw new Error(
        "Payment ID is required for audit log"
      );
    }

    if (!event) {
      throw new Error(
        "Audit event is required"
      );
    }

    if (!message) {
      throw new Error(
        "Audit message is required"
      );
    }

    const audit =
      await RecoveryAudit.create({
        recoveryId,
        paymentId,
        event,
        action,
        status,
        previousStatus,
        newStatus,
        strategy,
        failureReason,
        failureCode,
        retryCount,
        message,
        metadata,
        performedBy,
      });

    console.log(
      `[AUDIT] ${event}: ${message}`
    );

    return audit;
  } catch (error) {
    console.error(
      "Create recovery audit log error:",
      error.message
    );

    throw error;
  }
};

/**
 * ============================================================
 * GET AUDIT LOGS FOR RECOVERY
 * ============================================================
 */
const getRecoveryAuditLogs = async (
  recoveryId
) => {
  return RecoveryAudit.find({
    recoveryId,
  })
    .sort({
      createdAt: -1,
    })
    .lean();
};

/**
 * ============================================================
 * GET AUDIT LOGS FOR PAYMENT
 * ============================================================
 */
const getPaymentAuditLogs = async (
  paymentId
) => {
  return RecoveryAudit.find({
    paymentId,
  })
    .sort({
      createdAt: -1,
    })
    .lean();
};

/**
 * ============================================================
 * GET ALL AUDIT LOGS
 * ============================================================
 */
const getAllAuditLogs = async ({
  event,
  performedBy,
  page = 1,
  limit = 50,
} = {}) => {
  const query = {};

  if (event) {
    query.event = event;
  }

  if (performedBy) {
    query.performedBy =
      performedBy;
  }

  const pageNumber = Math.max(
    Number(page) || 1,
    1
  );

  const limitNumber = Math.min(
    Math.max(
      Number(limit) || 50,
      1
    ),
    500
  );

  const skip =
    (pageNumber - 1) *
    limitNumber;

  const [
    logs,
    total,
  ] = await Promise.all([
    RecoveryAudit.find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .populate(
        "recoveryId"
      )
      .populate(
        "paymentId"
      )
      .lean(),

    RecoveryAudit.countDocuments(
      query
    ),
  ]);

  return {
    logs,
    total,
    page: pageNumber,
    limit: limitNumber,
    pages:
      total > 0
        ? Math.ceil(
            total /
              limitNumber
          )
        : 1,
  };
};

module.exports = {
  createAuditLog,
  getRecoveryAuditLogs,
  getPaymentAuditLogs,
  getAllAuditLogs,
};