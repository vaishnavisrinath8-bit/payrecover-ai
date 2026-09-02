const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// ============================================================
// GET ALL NOTIFICATIONS
// GET /api/notifications
// ============================================================

const getAllNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = "false",
      type,
      severity,
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const filter = {};

    // --------------------------------------------------------
    // UNREAD FILTER
    // --------------------------------------------------------

    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    // --------------------------------------------------------
    // TYPE FILTER
    // --------------------------------------------------------

    if (type && type !== "all") {
      filter.type = type;
    }

    // --------------------------------------------------------
    // SEVERITY FILTER
    // --------------------------------------------------------

    if (severity && severity !== "all") {
      filter.severity = severity;
    }

    const skip =
      (pageNumber - 1) * limitNumber;

    const [
      notifications,
      total,
      unreadCount,
    ] = await Promise.all([
      Notification.find(filter)
        .populate(
          "recoveryId",
          "customerName customerEmail amount status priority recoveryProbability"
        )
        .populate(
          "paymentId",
          "razorpayPaymentId amount currency status paymentStatus"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        isRead: false,
      }),
    ]);

    const totalPages =
      Math.max(
        Math.ceil(total / limitNumber),
        1
      );

    return res.status(200).json({
      success: true,

      count: notifications.length,

      total,

      page: pageNumber,

      limit: limitNumber,

      totalPages,

      unreadCount,

      notifications,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load notifications.",
      error: error.message,
    });
  }
};

// ============================================================
// GET UNREAD COUNT
// GET /api/notifications/unread-count
// ============================================================

const getUnreadCount = async (
  req,
  res
) => {
  try {
    const count =
      await Notification.countDocuments({
        isRead: false,
      });

    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error(
      "GET UNREAD COUNT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load unread notification count.",
      error: error.message,
    });
  }
};

// ============================================================
// GET SINGLE NOTIFICATION
// GET /api/notifications/:id
// ============================================================

const getNotificationById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid notification ID.",
      });
    }

    const notification =
      await Notification.findById(id)
        .populate(
          "recoveryId",
          "customerName customerEmail amount status priority recoveryProbability failureReason"
        )
        .populate(
          "paymentId",
          "razorpayPaymentId amount currency status paymentStatus"
        )
        .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load notification.",
      error: error.message,
    });
  }
};

// ============================================================
// CREATE NOTIFICATION
// POST /api/notifications
// ============================================================

const createNotification = async (
  req,
  res
) => {
  try {
    const {
      type,
      title,
      message,
      severity,
      paymentId,
      recoveryId,
      customerName,
      customerEmail,
      amount,
      currency,
      actionUrl,
      actionLabel,
      metadata,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Title and message are required.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE REFERENCES
    // --------------------------------------------------------

    if (
      paymentId &&
      !mongoose.Types.ObjectId.isValid(
        paymentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment ID.",
      });
    }

    if (
      recoveryId &&
      !mongoose.Types.ObjectId.isValid(
        recoveryId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid recovery ID.",
      });
    }

    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    const notification =
      await Notification.create({
        type:
          type || "system",

        title:
          title.trim(),

        message:
          message.trim(),

        severity:
          severity || "info",

        paymentId:
          paymentId || null,

        recoveryId:
          recoveryId || null,

        customerName:
          customerName || null,

        customerEmail:
          customerEmail || null,

        amount:
          Number(amount) || 0,

        currency:
          currency || "INR",

        actionUrl:
          actionUrl || null,

        actionLabel:
          actionLabel || null,

        metadata:
          metadata || {},
      });

    return res.status(201).json({
      success: true,
      message:
        "Notification created successfully.",
      notification,
    });
  } catch (error) {
    console.error(
      "CREATE NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create notification.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK ONE AS READ
// PATCH /api/notifications/:id/read
// ============================================================

const markNotificationRead = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid notification ID.",
      });
    }

    const notification =
      await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    return res.status(200).json({
      success: true,
      message:
        "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error(
      "MARK NOTIFICATION READ ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to mark notification as read.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// ============================================================

const markAllNotificationsRead = async (
  req,
  res
) => {
  try {
    const result =
      await Notification.updateMany(
        {
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

    return res.status(200).json({
      success: true,

      message:
        "All notifications marked as read.",

      modifiedCount:
        result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "MARK ALL NOTIFICATIONS READ ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to mark all notifications as read.",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================================

const deleteNotification = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid notification ID.",
      });
    }

    const notification =
      await Notification.findByIdAndDelete(
        id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Notification deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete notification.",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getAllNotifications,
  getUnreadCount,
  getNotificationById,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};