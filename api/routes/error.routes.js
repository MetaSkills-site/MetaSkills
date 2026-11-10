/**
 * @file error.routes.js
 * @description Defines routes for client-side error reporting and administrative error management.
 * @architecture Connects user-facing error reporting and admin error resolution interfaces to the error controller.
 */
import express from "express";
import {
  protect,
  protectAdmin as admin,
} from "../middlewares/authMiddleware.js";
import idempotencyGuard from "../middlewares/idempotency.js";
import {
  reportError,
  getErrors,
  getErrorById,
  resolveError,
  resolveAllErrors,
  checkPendingErrorsStatus,
  getScreenshotUploadUrl,
} from "../controllers/error.controller.js";

const router = express.Router();

router.post("/report", protect, idempotencyGuard, reportError);
router.post("/screenshot-url", protect, getScreenshotUploadUrl);
router.get("/", admin, getErrors);
router.get("/pending-status", admin, checkPendingErrorsStatus);
router.get("/:id", admin, getErrorById);
router.delete("/:id", admin, resolveError);
router.delete("/", admin, resolveAllErrors);

/**
 * @module errorRouter
 * @description Serves endpoints for users to report errors and for admins to review and resolve them.
 */
export default router;
