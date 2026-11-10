/**
 * @file backup.controller.js
 * @description Manages database backups to Google Drive.
 * @architecture Integrates with Google Drive API to export, list, and restore critical application collections.
 */
import expressAsyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import os from "os";
import Question from "../models/Questions.model.js";
import Module from "../models/Module.model.js";
import {
  uploadBackupToDrive,
  listDriveFiles,
  deleteDriveFile,
  emptyDriveFolder,
  getDriveFileContent,
} from "../config/googledriveupload.js";

const runBackupService = async () => {
  const tempDir = os.tmpdir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `metaskills_backup_${timestamp}.json`;
  const filePath = path.join(tempDir, fileName);

  try {
    // 1. Fetch data
    const questions = await Question.find({});
    const modules = await Module.find({});

    const backupData = {
      timestamp: new Date().toISOString(),
      questions,
      modules,
    };

    // 2. Write to temp file
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    // 3. Upload to Google Drive
    const fileId = await uploadBackupToDrive(
      fileName,
      filePath,
      "application/json",
    );

    // 4. Cleanup
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return fileId;
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Backup service failed:", error);
    throw error;
  }
};

/**
 * @desc    Trigger manual backup to Google Drive
 * @route   POST /api/backup
 * @access  Private (Admin)
 */
const backupToDrive = expressAsyncHandler(async (req, res) => {
  try {
    const fileId = await runBackupService();
    res.status(200).json({
      success: true,
      message: "Backup uploaded successfully to Google Drive",
      fileId: fileId,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Backup failed", { cause: error });
  }
});

/**
 * @desc    List all backup files in Google Drive
 * @route   GET /api/backup
 * @access  Private (Admin)
 */
const getBackupFiles = expressAsyncHandler(async (req, res) => {
  try {
    const files = await listDriveFiles();
    res.status(200).json({
      success: true,
      files,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Failed to fetch backup files", {
      cause: error,
    });
  }
});

/**
 * @desc    Delete a specific backup file
 * @route   DELETE /api/backup/:fileId
 * @access  Private (Admin)
 */
const deleteBackupFile = expressAsyncHandler(async (req, res) => {
  const { fileId } = req.params;
  try {
    await deleteDriveFile(fileId);
    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Failed to delete file", { cause: error });
  }
});

/**
 * @desc    Delete all backup files from Google Drive
 * @route   DELETE /api/backup/empty
 * @access  Private (Admin)
 */
const emptyBackupDrive = expressAsyncHandler(async (req, res) => {
  try {
    const count = await emptyDriveFolder();
    res.status(200).json({
      success: true,
      message: `Drive emptied. Deleted ${count} files.`,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Failed to empty drive", { cause: error });
  }
});

/**
 * @desc    Fetch content of a specific backup file
 * @route   GET /api/backup/:fileId/content
 * @access  Private (Admin)
 */
const getBackupFileContent = expressAsyncHandler(async (req, res) => {
  const { fileId } = req.params;
  try {
    const content = await getDriveFileContent(fileId);
    res.status(200).json({
      success: true,
      content,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Failed to fetch file content", {
      cause: error,
    });
  }
});

export default {
  backupToDrive,
  getBackupFiles,
  deleteBackupFile,
  emptyBackupDrive,
  getBackupFileContent,
  runBackupService, // Exporting the service for internal use
};
