const express = require("express");

const router = express.Router();

const {
  createRecoveryController,
  sendRecoveryEmailController,
  getRecovery,
  getRecoveries,
} = require("../controllers/recoveryController");


// ============================================
// Create a recovery
// POST /api/recovery/create
// ============================================

router.post(
  "/create",
  createRecoveryController
);


// ============================================
// Send recovery email
// POST /api/recovery/send
// ============================================

router.post(
  "/send",
  sendRecoveryEmailController
);


// ============================================
// Get all recoveries
// GET /api/recovery
// ============================================

router.get(
  "/",
  getRecoveries
);


// ============================================
// Get recovery by ID
// GET /api/recovery/:id
// ============================================

router.get(
  "/:id",
  getRecovery
);


module.exports = router;