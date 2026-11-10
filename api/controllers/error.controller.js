/**
 * @file error.controller.js
 * @description Manages application error reports submitted by users.
 * @architecture Controller layer interacting with the ErrorModel and screenshot storage utilities for admin review and tracking.
 */
import ErrorModel from "../models/Errors.model.js";
import mongoose from "mongoose";
import path from "path";
import {
  generateScreenshotUploadSignedUrl,
  generateScreenshotReadUrl,
  deleteScreenshot,
  deleteScreenshots,
} from "../utils/screenshotStorage.js";
import expressAsyncHandler from "express-async-handler";

const logger = console; // Project's structured logger wrapper

const sanitizeError = (err) => {
  if (!err) return null;
  return {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  };
};

/**
 * @desc    Report an error from the client, including environment metadata and optional screenshot
 * @route   POST /api/errors/report
 * @access  Private
 */
export const reportError = async (req, res) => {
  try {
    const {
      screenshotUrl,
      screenshotFilename,
      environment,
      userDescription,
      systemMetadata,
      reportType,
      category,
    } = req.body;

    if (!environment || !userDescription) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    let sanitizedMetadata = null;
    if (systemMetadata !== undefined && systemMetadata !== null) {
      if (typeof systemMetadata !== "object" || Array.isArray(systemMetadata)) {
        return res.status(400).json({
          success: false,
          message: "systemMetadata must be an object",
        });
      }

      const { ...extraKeys } = systemMetadata;

      delete extraKeys.source;
      delete extraKeys.version;
      delete extraKeys.runtime;
      delete extraKeys.userAgent;
      delete extraKeys.language;
      delete extraKeys.windowSize;
      delete extraKeys.screenSize;
      delete extraKeys.timeZone;
      delete extraKeys.pixelRatio;

      if (Object.keys(extraKeys).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid keys in systemMetadata.",
        });
      }

      sanitizedMetadata = {};

      const stringFields = {
        source: 100,
        version: 50,
        runtime: 100,
        language: 50,
        windowSize: 50,
        screenSize: 50,
        timeZone: 100,
      };

      for (const [key, maxLength] of Object.entries(stringFields)) {
        if (systemMetadata[key] !== undefined) {
          if (
            typeof systemMetadata[key] !== "string" ||
            systemMetadata[key].length > maxLength
          ) {
            return res.status(400).json({
              success: false,
              message: `systemMetadata.${key} must be a string (max ${maxLength} chars)`,
            });
          }
          sanitizedMetadata[key] = systemMetadata[key].trim();
        }
      }

      if (systemMetadata.userAgent !== undefined) {
        if (
          typeof systemMetadata.userAgent !== "string" ||
          systemMetadata.userAgent.length > 500
        ) {
          return res.status(400).json({
            success: false,
            message:
              "systemMetadata.userAgent must be a string (max 500 chars)",
          });
        }
        sanitizedMetadata.userAgent = systemMetadata.userAgent.trim();
      }

      if (systemMetadata.pixelRatio !== undefined) {
        if (
          !Number.isFinite(systemMetadata.pixelRatio) ||
          systemMetadata.pixelRatio < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "systemMetadata.pixelRatio must be a positive finite number",
          });
        }
        sanitizedMetadata.pixelRatio = systemMetadata.pixelRatio;
      }

      if (Object.keys(sanitizedMetadata).length === 0) {
        sanitizedMetadata = null;
      }
    }

    const newError = new ErrorModel({
      user: req.user._id,
      screenshotFilename: screenshotFilename || screenshotUrl,
      environment,
      userDescription,
      systemMetadata: sanitizedMetadata,
      reportType: reportType || "manual",
      category: category || "other",
    });

    await newError.save();

    res.status(201).json({
      success: true,
      message: "Error reported successfully",
      data: newError,
    });
  } catch (error) {
    logger.error("Error reporting issue:", sanitizeError(error));
    res.status(500).json({
      success: false,
      message: "Server Error: Could not report issue",
    });
  }
};

/**
 * @desc    Get all error reports
 * @route   GET /api/errors
 * @access  Private/Admin
 */
export const getErrors = async (req, res) => {
  try {
    const errors = await ErrorModel.find()
      .populate("user", "fullname email")
      .select({
        user: 1,
        screenshotFilename: 1,
        environment: 1,
        userDescription: 1,
        systemMetadata: 1,
        createdAt: 1,
        status: 1,
        reportType: 1,
        category: 1,
      })
      .sort({ createdAt: -1 })
      .lean();

    // Dynamically generate signed URLs for each error report
    const processedErrors = await Promise.all(
      errors.map(async (error) => {
        if (error.screenshotFilename) {
          try {
            error.screenshotUrl = await generateScreenshotReadUrl(
              error.screenshotFilename,
            );
          } catch (err) {
            logger.error(
              `Failed to sign URL for ${error.screenshotFilename}:`,
              err,
            );
            error.screenshotUrl = null;
          }
        }
        return error;
      }),
    );

    res.status(200).json({
      success: true,
      data: processedErrors,
    });
  } catch (error) {
    logger.error("Error fetching issues:", sanitizeError(error));
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch issues",
    });
  }
};

/**
 * @desc    Get an error report by its ID
 * @route   GET /api/errors/:id
 * @access  Private/Admin
 */
export const getErrorById = async (req, res) => {
  try {
    const errorId = req.params.id;

    if (!mongoose.isValidObjectId(errorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid error report ID format",
      });
    }

    const error = await ErrorModel.findById(errorId)
      .populate("user", "fullname email")
      .lean();

    if (!error) {
      return res.status(404).json({
        success: false,
        message: "Error report not found",
      });
    }

    // Dynamically generate signed URL
    if (error.screenshotFilename) {
      try {
        error.screenshotUrl = await generateScreenshotReadUrl(
          error.screenshotFilename,
        );
      } catch (err) {
        logger.error(
          `Failed to sign URL for ${error.screenshotFilename}:`,
          err,
        );
        error.screenshotUrl = null;
      }
    }

    res.status(200).json({
      success: true,
      data: error,
    });
  } catch (error) {
    logger.error("Error fetching issue by ID:", sanitizeError(error));
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch issue by ID",
    });
  }
};

/**
 * @desc    Resolve and delete an error by ID, and clean up any associated screenshot
 * @route   DELETE /api/errors/:id
 * @access  Private/Admin
 */
export const resolveError = async (req, res) => {
  try {
    const errorId = req.params.id;

    if (!mongoose.isValidObjectId(errorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid error report ID format",
      });
    }

    const error = await ErrorModel.findById(errorId);
    if (!error) {
      return res.status(404).json({
        success: false,
        message: "Error report not found",
      });
    }

    // Cleanup screenshot from bucket if it exists
    if (error.screenshotFilename) {
      const cleanupResult = await deleteScreenshot(error.screenshotFilename);
      if (cleanupResult.ok) {
        logger.log(
          `[Cleanup] Successfully deleted screenshot from bucket: ${error.screenshotFilename}`,
        );
      } else {
        logger.error(
          `[Cleanup] Failed to delete screenshot ${error.screenshotFilename}: ${cleanupResult.error}`,
        );
      }
    }

    await ErrorModel.findByIdAndDelete(errorId);

    res.status(200).json({
      success: true,
      message: "Error report resolved/deleted and screenshot cleaned up",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid error report ID format",
      });
    }
    logger.error("Error resolving issue:", sanitizeError(error));
    res.status(500).json({
      success: false,
      message: "Server Error: Could not resolve issue",
    });
  }
};

/**
 * @desc    Resolve and delete all error reports in bulk
 * @route   DELETE /api/errors
 * @access  Private/Admin
 */
export const resolveAllErrors = async (req, res) => {
  try {
    if (req.query.confirm !== "true") {
      return res.status(400).json({
        success: false,
        message:
          "Confirmation required to delete all errors. Provide ?confirm=true",
      });
    }

    // Find all error reports that have associated screenshots
    const reportsWithScreenshots = await ErrorModel.find({
      screenshotFilename: { $ne: null, $exists: true },
    })
      .select("screenshotFilename")
      .lean();

    const filenames = reportsWithScreenshots
      .map((r) => r.screenshotFilename)
      .filter((f) => typeof f === "string" && f.length > 0);

    // Perform bulk cleanup
    if (filenames.length > 0) {
      const cleanupResult = await deleteScreenshots(filenames);
      logger.log(
        `[Cleanup] Bulk resolved: Deleted ${cleanupResult.deletedCount} of ${filenames.length} screenshots from bucket.`,
      );
    }

    await ErrorModel.deleteMany({});

    res.status(200).json({
      success: true,
      message: `All error reports resolved. Cleaned up ${filenames.length} screenshot references.`,
    });
  } catch (error) {
    logger.error("Error resolving all issues:", sanitizeError(error));
    res.status(500).json({
      success: false,
      message: "Server Error: Could not resolve all issues",
    });
  }
};

/**
 * @desc    Check if any pending or open errors exist
 * @route   GET /api/errors/pending-status
 * @access  Private/Admin
 */
export const checkPendingErrorsStatus = async (req, res) => {
  try {
    const hasPending = await ErrorModel.exists({ status: "open" });

    res.status(200).json({
      success: true,
      errorReportsAvailable: !!hasPending,
    });
  } catch (error) {
    logger.error("Error checking pending errors status:", sanitizeError(error));
    res.status(500).json({
      success: false,
      message: "Server Error: Could not check errors status",
    });
  }
};

/**
 * @desc    Generate a signed URL for uploading a screenshot
 * @route   POST /api/errors/screenshot-url
 * @access  Private
 */
export const getScreenshotUploadUrl = expressAsyncHandler(async (req, res) => {
  const { filename, contentType } = req.body;

  const allowedContentTypes = ["image/png", "image/jpeg", "image/webp"];

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({
      success: false,
      message: "Filename is required and must be a string",
    });
  }

  // Security check: ensure filename is a simple basename and does not contain dangerous characters
  const decodedFilename = decodeURIComponent(filename);
  const containsTraversal = (fn) =>
    fn.includes("/") ||
    fn.includes("\\") ||
    fn.includes("../") ||
    fn.includes("\0") ||
    fn.includes("%00") ||
    fn.includes("%2e%2e") ||
    fn.includes("%2f") ||
    fn === ".." ||
    fn === ".";

  if (
    filename.length > 255 ||
    containsTraversal(filename) ||
    containsTraversal(decodedFilename) ||
    path.isAbsolute(filename) ||
    filename.startsWith("/") ||
    filename.startsWith("\\")
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid filename: must be a simple basename (max 255 chars) without paths or special characters",
    });
  }

  if (!contentType || !allowedContentTypes.includes(contentType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid contentType. Allowed: ${allowedContentTypes.join(", ")}`,
    });
  }

  try {
    const result = await generateScreenshotUploadSignedUrl(
      filename,
      contentType,
    );
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "Error generating screenshot signed URL:",
      sanitizeError(error),
    );
    res.status(500);
    throw new Error("Failed to generate upload URL", { cause: error });
  }
});
