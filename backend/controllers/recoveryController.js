const {
  createRecovery,
  sendRecoveryEmail,
  getRecoveryById,
  getAllRecoveries,
} = require("../services/recoveryService");


// ============================================
// CREATE RECOVERY
// POST /api/recovery/create
// ============================================

const createRecoveryController = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "paymentId is required",
      });
    }

    const recovery = await createRecovery(paymentId);

    return res.status(201).json({
      success: true,
      message: "Recovery created successfully",
      data: recovery,
    });

  } catch (error) {
    console.error(
      "Create recovery controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create recovery",
      error: error.name || "UnknownError",
    });
  }
};


// ============================================
// SEND RECOVERY EMAIL
// POST /api/recovery/send
// ============================================

const sendRecoveryEmailController = async (req, res) => {
  try {
    const { recoveryId } = req.body;

    if (!recoveryId) {
      return res.status(400).json({
        success: false,
        message: "recoveryId is required",
      });
    }

    const result = await sendRecoveryEmail(
      recoveryId
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        recovery: result.recovery,
        messageId: result.messageId,
      },
    });

  } catch (error) {
    console.error(
      "Send recovery email controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to send recovery email",
      error: error.name || "UnknownError",
    });
  }
};


// ============================================
// GET RECOVERY BY ID
// GET /api/recovery/:id
// ============================================

const getRecovery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Recovery ID is required",
      });
    }

    const recovery =
      await getRecoveryById(id);

    return res.status(200).json({
      success: true,
      data: recovery,
    });

  } catch (error) {
    console.error(
      "Get recovery controller error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Recovery not found",
      error: error.name || "UnknownError",
    });
  }
};


// ============================================
// GET ALL RECOVERIES
// GET /api/recovery
// ============================================

const getRecoveries = async (req, res) => {
  try {
    const recoveries =
      await getAllRecoveries();

    return res.status(200).json({
      success: true,
      count: recoveries.length,
      data: recoveries,
    });

  } catch (error) {
    console.error(
      "Get recoveries controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch recoveries",
      error: error.name || "UnknownError",
    });
  }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
  createRecoveryController,
  sendRecoveryEmailController,
  getRecovery,
  getRecoveries,
};