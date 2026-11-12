/**
 * @file admin.routes.js
 * @description Defines the routes for admin-related operations including auth, sessions, scripts, and notifications.
 * @architecture Serves as the primary entry point for admin API endpoints, integrating with admin, session, scripts, and notification controllers.
 */
import express from "express";
import adminAuthControl from "../controllers/admin.auth.controller.js";

const router = express.Router();

import { loginLimiter, adminLimiter } from "../middlewares/rateLimiters.js";
router.post("/google-auth", loginLimiter, adminAuthControl.googleAuth);

router.use(adminLimiter);

import { protectAdmin } from "../middlewares/authMiddleware.js";
router.get("/check", protectAdmin, adminAuthControl.checkAuth);
router.post("/logout", protectAdmin, adminAuthControl.logout);

import sessionController from "../controllers/session.controller.js";
router.get("/sessions", protectAdmin, sessionController.getActiveSessions);
router.delete("/sessions", protectAdmin, sessionController.deleteSession);
router.delete(
  "/sessions/all",
  protectAdmin,
  sessionController.deleteAllSessions,
);

import scriptsController from "../controllers/scripts.controller.js";
router.get("/scripts", protectAdmin, scriptsController.getScripts);
router.post("/scripts/run", protectAdmin, scriptsController.runScript);

import notificationController from "../controllers/notification.controller.js";
import idempotencyGuard from "../middlewares/idempotency.js";

router.post(
  "/notifications",
  protectAdmin,
  idempotencyGuard,
  notificationController.createNotification,
);
router.get(
  "/notifications",
  protectAdmin,
  notificationController.getAllNotifications,
);
router.delete(
  "/notifications",
  protectAdmin,
  notificationController.deleteNotification,
);

/**
 * @module adminRouter
 * @description Serves admin endpoints for authentication, session management, script execution, and notifications.
 */
export default router;
