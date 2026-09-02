const express = require("express");

const router = express.Router();

const {
  register,
  login,
  getCurrentUser,
  logout,
} = require("../controllers/authController");

const {
  protect,
} = require("../middleware/authMiddleware");

/**
 * ============================================================
 * AUTHENTICATION ROUTES
 * ============================================================
 */

/**
 * Register
 *
 * POST /api/auth/register
 */
router.post(
  "/register",
  register
);

/**
 * Login
 *
 * POST /api/auth/login
 */
router.post(
  "/login",
  login
);

/**
 * Get currently authenticated user
 *
 * GET /api/auth/me
 *
 * Protected route
 */
router.get(
  "/me",
  protect,
  getCurrentUser
);

/**
 * Logout
 *
 * POST /api/auth/logout
 *
 * Protected route
 */
router.post(
  "/logout",
  protect,
  logout
);

module.exports = router;