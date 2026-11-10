/**
 * @file backup.routes.js
 * @description Defines routes for managing Google Drive backups of the system database.
 * @architecture Interfaces with the backup controller to expose backup creation, retrieval, and deletion capabilities to administrators.
 */
import express from "express";
import backupController from "../controllers/backup.controller.js";
import { protectAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/drive", protectAdmin, backupController.backupToDrive);
router.get("/list", protectAdmin, backupController.getBackupFiles);
router.delete("/:fileId", protectAdmin, backupController.deleteBackupFile);
router.get(
  "/:fileId/content",
  protectAdmin,
  backupController.getBackupFileContent,
);
router.delete("/", protectAdmin, backupController.emptyBackupDrive);

/**
 * @module backupRouter
 * @description Serves administrative endpoints for triggering and managing database backups.
 */
export default router;
