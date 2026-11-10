/**
 * @file notification.controller.js
 * @description Controller for managing user notifications.
 * @architecture Handles fetching, creating, and deleting notifications.
 */
import Notification from "../models/Notification.model.js";

/**
 * @desc    Helper to get or create the singleton notification document
 * @returns {Promise<Object>} The notification document
 */
// Helper to get or create the singleton notification document
const getNotificationDoc = async () => {
  let notification = await Notification.findOne();
  if (!notification) {
    notification = await Notification.create({ data: [], seenBy: [] });
  }
  return notification;
};

const notificationController = {
  /**
   * @desc    Get boolean status if there are unread notifications for the user
   * @route   GET /api/notifications/unread
   * @access  Private
   */
  getUnreadStatus: async (req, res) => {
    try {
      const notification = await getNotificationDoc();
      const isUnread = !notification.seenBy.includes(req.user._id);
      res.status(200).json(isUnread);
    } catch (error) {
      console.error("Error getting unread status:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @desc    Get all notifications and mark as read for the current user
   * @route   GET /api/notifications
   * @access  Private
   */
  getNotifications: async (req, res) => {
    try {
      const notification = await getNotificationDoc();

      // Mark as seen if not already
      if (!notification.seenBy.includes(req.user._id)) {
        notification.seenBy.push(req.user._id);
        await notification.save();
      }

      // Return notifications sorted by newest first (though they are stored in array, usually appended)
      // If we want newest first, we can reverse the array in response
      const notifications = [...notification.data].reverse();

      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @desc    Create a new notification and clear seen status for all users
   * @route   POST /api/notifications
   * @access  Private (Admin)
   */
  createNotification: async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res
          .status(400)
          .json({ message: "Title and content are required" });
      }

      const notification = await getNotificationDoc();

      notification.data.push({ title, content });
      notification.seenBy = []; // Clear seenBy on new notification

      await notification.save();

      res.status(201).json({
        message: "Notification created",
        notification: notification.data[notification.data.length - 1],
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @desc    Get paginated notifications
   * @route   GET /api/notifications/all
   * @access  Private (Admin)
   */
  getAllNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const notification = await getNotificationDoc();

      // Data is stored older->newer. We want newer->older.
      let allNotifications = [...notification.data].reverse();

      if (search) {
        const query = search.toLowerCase();
        allNotifications = allNotifications.filter(
          (notif) => notif.title && notif.title.toLowerCase().includes(query),
        );
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);

      const paginatedNotifications = allNotifications.slice(
        startIndex,
        endIndex,
      );

      res.status(200).json({
        success: true,
        data: paginatedNotifications,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total: allNotifications.length,
          pages: Math.ceil(allNotifications.length / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching all notifications:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @desc    Delete a specific notification by ID
   * @route   DELETE /api/notifications
   * @access  Private (Admin)
   */
  deleteNotification: async (req, res) => {
    try {
      const { notificationId, clearSeen } = req.body;

      const notification = await getNotificationDoc();

      // Filter out the notification to delete
      // Assuming notificationId is the _id of the subdocument in data array
      notification.data = notification.data.filter(
        (n) => n._id.toString() !== notificationId,
      );

      if (clearSeen) {
        notification.seenBy = [];
      }

      await notification.save();

      res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
};

export default notificationController;
