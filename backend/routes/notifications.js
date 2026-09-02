const express = require("express");

const router = express.Router();

const Notification = require("../models/Notification");

// ============================================================
// HELPERS
// ============================================================

const normalizeNotification = (notification) => {
  if (!notification) {
    return null;
  }

  const object =
    typeof notification.toObject === "function"
      ? notification.toObject()
      : notification;

  return {
    ...object,

    id:
      object._id ||
      object.id,

    title:
      object.title ||
      "Notification",

    message:
      object.message ||
      "",

    type:
      object.type ||
      "system",

    priority:
      object.priority ||
      "MEDIUM",

    read:
      Boolean(object.read),

    channel:
      object.channel ||
      "system",

    communicationStatus:
      object.communicationStatus ||
      "pending",

    action:
      object.action ||
      "",

    actionRequired:
      Boolean(object.actionRequired),

    actionUrl:
      object.actionUrl ||
      "",

    customerName:
      object.customerName ||
      "",

    customerEmail:
      object.customerEmail ||
      "",

    recoveryId:
      object.recoveryId ||
      object.recovery ||
      "",

    paymentId:
      object.paymentId ||
      object.payment ||
      "",
  };
};

// ============================================================
// GET ALL NOTIFICATIONS
// GET /api/notifications
// ============================================================

router.get("/", async (req, res) => {
  try {
    const {
      type,
      priority,
      read,
      channel,
      search,
      limit = 50,
      page = 1,
    } = req.query;

    const filter = {};

    // ----------------------------------------------------------
    // TYPE
    // ----------------------------------------------------------

    if (type) {
      filter.type = String(type).toLowerCase();
    }

    // ----------------------------------------------------------
    // PRIORITY
    // ----------------------------------------------------------

    if (priority) {
      filter.priority = String(priority).toUpperCase();
    }

    // ----------------------------------------------------------
    // READ STATUS
    // ----------------------------------------------------------

    if (read !== undefined) {
      filter.read =
        String(read).toLowerCase() === "true";
    }

    // ----------------------------------------------------------
    // CHANNEL
    // ----------------------------------------------------------

    if (channel) {
      filter.channel = String(channel).toLowerCase();
    }

    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    if (search) {
      const searchRegex = new RegExp(
        String(search),
        "i"
      );

      filter.$or = [
        {
          title: searchRegex,
        },
        {
          message: searchRegex,
        },
        {
          customerName: searchRegex,
        },
        {
          customerEmail: searchRegex,
        },
        {
          paymentId: searchRegex,
        },
        {
          recoveryId: searchRegex,
        },
      ];
    }

    // ----------------------------------------------------------
    // PAGINATION
    // ----------------------------------------------------------

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const pageLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      200
    );

    const skip =
      (pageNumber - 1) * pageLimit;

    const [
      notifications,
      total,
    ] = await Promise.all([
      Notification.find(filter)
        .sort({
          read: 1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      Notification.countDocuments(filter),
    ]);

    const normalized =
      notifications.map(
        normalizeNotification
      );

    res.json({
      success: true,

      count: normalized.length,

      total,

      page: pageNumber,

      limit: pageLimit,

      pages: Math.ceil(
        total / pageLimit
      ),

      notifications: normalized,

      data: normalized,
    });
  } catch (error) {
    console.error(
      "GET /notifications error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load notifications.",
      error: error.message,
    });
  }
});

// ============================================================
// GET UNREAD NOTIFICATIONS
// GET /api/notifications/unread
// ============================================================

router.get(
  "/unread",
  async (req, res) => {
    try {
      const limit = Math.min(
        Math.max(
          Number(req.query.limit) || 20,
          1
        ),
        100
      );

      const notifications =
        await Notification.find({
          read: false,
        })
          .sort({
            priority: 1,
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      const normalized =
        notifications.map(
          normalizeNotification
        );

      res.json({
        success: true,

        count: normalized.length,

        unreadCount:
          normalized.length,

        notifications:
          normalized,

        data:
          normalized,
      });
    } catch (error) {
      console.error(
        "GET /notifications/unread error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load unread notifications.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// GET NOTIFICATION STATS
// GET /api/notifications/stats
// ============================================================

router.get(
  "/stats",
  async (req, res) => {
    try {
      const [
        total,
        unread,
        read,
        critical,
        high,
        medium,
        low,
      ] = await Promise.all([
        Notification.countDocuments(),

        Notification.countDocuments({
          read: false,
        }),

        Notification.countDocuments({
          read: true,
        }),

        Notification.countDocuments({
          priority: "CRITICAL",
          read: false,
        }),

        Notification.countDocuments({
          priority: "HIGH",
          read: false,
        }),

        Notification.countDocuments({
          priority: "MEDIUM",
          read: false,
        }),

        Notification.countDocuments({
          priority: "LOW",
          read: false,
        }),
      ]);

      res.json({
        success: true,

        stats: {
          total,

          unread,

          read,

          critical,

          high,

          medium,

          low,
        },
      });
    } catch (error) {
      console.error(
        "GET /notifications/stats error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load notification statistics.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// GET SINGLE NOTIFICATION
// GET /api/notifications/:id
// ============================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const notification =
        await Notification.findById(
          req.params.id
        ).lean();

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }

      const result =
        normalizeNotification(
          notification
        );

      res.json({
        success: true,

        notification: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "GET /notifications/:id error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load notification.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// CREATE NOTIFICATION
// POST /api/notifications
// ============================================================

router.post(
  "/",
  async (req, res) => {
    try {
      const body = req.body || {};

      const {
        title,
        message,
        type = "system",
        priority = "MEDIUM",
        recovery,
        recoveryId = "",
        payment,
        paymentId = "",
        customerName = "",
        customerEmail = "",
        channel = "system",
        communicationStatus = "pending",
        action = "",
        actionRequired = false,
        actionUrl = "",
        metadata = {},
        expiresAt = null,
      } = body;

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message:
            "Notification title and message are required.",
        });
      }

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      const notification =
        new Notification({
          title: String(title).trim(),

          message: String(message).trim(),

          type,

          priority,

          recovery:
            recovery || null,

          recoveryId:
            recoveryId
              ? String(recoveryId)
              : "",

          payment:
            payment || null,

          paymentId:
            paymentId
              ? String(paymentId)
              : "",

          customerName:
            customerName || "",

          customerEmail:
            customerEmail || "",

          channel,

          communicationStatus,

          action,

          actionRequired:
            Boolean(actionRequired),

          actionUrl,

          metadata,

          expiresAt,
        });

      await notification.save();

      const result =
        normalizeNotification(
          notification
        );

      res.status(201).json({
        success: true,

        message:
          "Notification created successfully.",

        notification: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "POST /notifications error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create notification.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// MARK NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ============================================================

router.patch(
  "/:id/read",
  async (req, res) => {
    try {
      const notification =
        await Notification.findById(
          req.params.id
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }

      notification.read = true;

      notification.readAt =
        new Date();

      notification.communicationStatus =
        notification.communicationStatus ===
        "sent"
          ? "read"
          : notification.communicationStatus;

      await notification.save();

      const result =
        normalizeNotification(
          notification
        );

      res.json({
        success: true,

        message:
          "Notification marked as read.",

        notification: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark notification as read.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// MARK NOTIFICATION AS UNREAD
// PATCH /api/notifications/:id/unread
// ============================================================

router.patch(
  "/:id/unread",
  async (req, res) => {
    try {
      const notification =
        await Notification.findById(
          req.params.id
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }

      notification.read = false;

      notification.readAt = null;

      if (
        notification.communicationStatus ===
        "read"
      ) {
        notification.communicationStatus =
          "sent";
      }

      await notification.save();

      const result =
        normalizeNotification(
          notification
        );

      res.json({
        success: true,

        message:
          "Notification marked as unread.",

        notification: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "Mark notification unread error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark notification as unread.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ============================================================

router.patch(
  "/read-all",
  async (req, res) => {
    try {
      const result =
        await Notification.updateMany(
          {
            read: false,
          },
          {
            $set: {
              read: true,

              readAt:
                new Date(),
            },
          }
        );

      res.json({
        success: true,

        message:
          "All notifications marked as read.",

        modifiedCount:
          result.modifiedCount ||
          0,
      });
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark all notifications as read.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// UPDATE COMMUNICATION STATUS
// PATCH /api/notifications/:id/status
// ============================================================

router.patch(
  "/:id/status",
  async (req, res) => {
    try {
      const notification =
        await Notification.findById(
          req.params.id
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }

      const allowedStatuses = [
        "pending",
        "queued",
        "sent",
        "delivered",
        "failed",
        "read",
      ];

      const status =
        String(
          req.body?.communicationStatus ||
            ""
        ).toLowerCase();

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid communication status.",
          allowedStatuses,
        });
      }

      notification.communicationStatus =
        status;

      if (status === "read") {
        notification.read = true;

        notification.readAt =
          new Date();
      }

      await notification.save();

      const result =
        normalizeNotification(
          notification
        );

      res.json({
        success: true,

        message:
          "Notification communication status updated.",

        notification: result,

        data: result,
      });
    } catch (error) {
      console.error(
        "Update notification status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update notification status.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================================

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const notification =
        await Notification.findByIdAndDelete(
          req.params.id
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }

      res.json({
        success: true,

        message:
          "Notification deleted successfully.",

        id:
          notification._id,
      });
    } catch (error) {
      console.error(
        "DELETE /notifications/:id error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete notification.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;