const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

/**
 * ============================================================
 * CREATE JWT TOKEN
 * ============================================================
 */
const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/**
 * ============================================================
 * REGISTER
 * ============================================================
 *
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      companyName,
      phone,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // CHECK EXISTING USER
    // --------------------------------------------------------

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    // --------------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 12);

    // --------------------------------------------------------
    // CREATE USER
    // --------------------------------------------------------

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      companyName:
        companyName?.trim() || "",
      phone:
        phone?.trim() || "",
      role: "admin",
      isActive: true,
    });

    // --------------------------------------------------------
    // CREATE TOKEN
    // --------------------------------------------------------

    const token =
      createToken(user);

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName:
          user.companyName,
        phone: user.phone,
        role: user.role,
        isActive:
          user.isActive,
        lastLogin:
          user.lastLogin,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create account",
      error:
        error.message,
    });
  }
};

/**
 * ============================================================
 * LOGIN
 * ============================================================
 *
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // --------------------------------------------------------
    // CHECK ACCOUNT STATUS
    // --------------------------------------------------------

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This account has been disabled",
      });
    }

    // --------------------------------------------------------
    // CHECK PASSWORD
    // --------------------------------------------------------

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // --------------------------------------------------------
    // UPDATE LAST LOGIN
    // --------------------------------------------------------

    user.lastLogin = new Date();

    await user.save();

    // --------------------------------------------------------
    // CREATE TOKEN
    // --------------------------------------------------------

    const token =
      createToken(user);

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName:
          user.companyName,
        phone:
          user.phone,
        role:
          user.role,
        isActive:
          user.isActive,
        lastLogin:
          user.lastLogin,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to login",
      error:
        error.message,
    });
  }
};

/**
 * ============================================================
 * GET CURRENT USER
 * ============================================================
 *
 * GET /api/auth/me
 *
 * Requires authentication middleware.
 */
const getCurrentUser =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        ).select(
          "-password"
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found",
        });
      }

      return res.status(200).json({
        success: true,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          companyName:
            user.companyName,
          phone:
            user.phone,
          role:
            user.role,
          isActive:
            user.isActive,
          lastLogin:
            user.lastLogin,
          createdAt:
            user.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch account",
        error:
          error.message,
      });
    }
  };

/**
 * ============================================================
 * LOGOUT
 * ============================================================
 *
 * POST /api/auth/logout
 *
 * JWT is stateless, so logout is handled by
 * removing the token on the frontend.
 */
const logout = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,
    message:
      "Logout successful",
  });
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
};