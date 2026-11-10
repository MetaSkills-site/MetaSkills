/**
 * @file user.routes.js
 * @description Defines the Express routes for user authentication, profile management, and admin controls.
 * @architecture Serves as the main entry point for user-related API requests and routes them to appropriate controller functions.
 */
import express from "express";
import userController from "../controllers/user.controller.js";
import protect, { protectAdmin } from "../middlewares/authMiddleware.js";
import { sendErrorReport } from "../controllers/email.controller.js";
import { attendance } from "../controllers/attendance.controller.js";
import { getUserPerformance } from "../controllers/performance.controller.js";

const router = express.Router();

// Google OAuth routes
import { loginLimiter } from "../middlewares/rateLimiters.js";
router.post("/google-auth", loginLimiter, userController.googleAuth);
router.put("/complete-profile", protect, userController.completeProfile);

// User profile routes
router.put("/edit", protect, userController.updateUser);
router.get("/getProfile", protect, userController.read);
router.get("/carrots", protect, userController.getCarrots);
router.post("/deleteSession", protect, userController.deleteSession);

// Attendance
router.get("/streaks", protect, attendance);

// Performance
router.get("/performance", protect, getUserPerformance);

// Error reporting
router.post("/report-error", sendErrorReport);

// Admin routes
// Get all users (Admin)
// Get all users (Admin)
router.get("/", protectAdmin, userController.getAllUsers);
// Delete user (Admin)
router.delete("/:id", protectAdmin, userController.deleteUser);
// Update user by ID (Admin)
router.put("/:id", protectAdmin, userController.updateUserById);
// Get user by ID (Admin)
router.get("/:id", protectAdmin, userController.getUser);

// Notifications
import notificationController from "../controllers/notification.controller.js";
router.get(
  "/notifications/unread",
  protect,
  notificationController.getUnreadStatus,
);
router.post(
  "/notifications/read",
  protect,
  notificationController.getNotifications,
);

/**
 * @module userRouter
 * @description Serves all user and admin-related API routes for profile, auth, and performance data.
 */
export default router;
