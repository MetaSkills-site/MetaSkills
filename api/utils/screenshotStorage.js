/**
 * @file screenshotStorage.js
 * @description Manages Google Cloud Storage operations for screenshot uploads, reads, and deletions.
 * @architecture Serves as the storage interface for screenshot-related endpoints using GCS.
 */
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to initialize GCS client options resiliently across ADC, file paths, and environment strings
const getStorageOptions = () => {
  const options = {};
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT) {
    options.projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
  }
  if (process.env.GCS_CREDENTIALS) {
    try {
      options.credentials = JSON.parse(process.env.GCS_CREDENTIALS);
      return options;
    } catch (err) {
      console.warn("[GCS] Failed to parse GCS_CREDENTIALS JSON:", err.message);
    }
  }
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    options.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  } else {
    const localKey = path.join(__dirname, "../gcs-key.json");
    if (fs.existsSync(localKey)) {
      options.keyFilename = localKey;
    }
    // If no key file exists, let @google-cloud/storage resolve credentials automatically via ADC
  }
  return options;
};

// Initialize GCS
const storage = new Storage(getStorageOptions());

const bucketName =
  process.env.GCS_SCREENSHOT_BUCKET_NAME || "metaskills_screenshots";
const bucket = storage.bucket(bucketName);

/**
 * Generate a V4 signed URL for uploading a screenshot.
 * @param {string} filename - The name of the file.
 * @param {string} contentType - The MIME type of the file.
 * @returns {Promise<{uploadUrl: string, filename: string}>}
 */
export const generateScreenshotUploadSignedUrl = async (
  filename,
  contentType,
) => {
  if (typeof filename !== "string" || filename.trim() === "") {
    throw new Error("generateScreenshotUploadSignedUrl: missing filename");
  }
  if (typeof contentType !== "string" || contentType.trim() === "") {
    throw new Error("generateScreenshotUploadSignedUrl: missing contentType");
  }

  // Sanitize and ensure unique filename
  const sanitizedBasename = path
    .basename(filename)
    .replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueFilename = `${Date.now()}-${sanitizedBasename}`;
  const file = bucket.file(uniqueFilename);

  const uploadOptions = {
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  };

  const [uploadUrl] = await file.getSignedUrl(uploadOptions);

  return {
    uploadUrl,
    filename: uniqueFilename,
  };
};

/**
 * Generate a short-lived signed URL for reading a screenshot.
 * @param {string} filename
 * @returns {Promise<string>}
 */
export const generateScreenshotReadUrl = async (filename) => {
  if (typeof filename !== "string" || filename.trim() === "") {
    throw new Error(
      "generateScreenshotReadUrl: filename is required and must be a non-empty string",
    );
  }

  // If a full URL was passed (legacy data), extract just the basename
  const actualFilename = path.basename(filename).split("?")[0];

  const file = bucket.file(actualFilename);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return url;
};

/**
 * Delete multiple screenshots from GCS.
 * @param {string[]} filenames
 */
export const deleteScreenshots = async (filenames) => {
  if (!Array.isArray(filenames) || filenames.length === 0)
    return { ok: true, deletedCount: 0 };

  const promises = filenames.map((filename) =>
    bucket
      .file(filename)
      .delete()
      .catch((err) => {
        // Log errors but don't fail the entire batch
        console.error(
          `[Cleanup] Failed to delete screenshot ${filename}:`,
          err.message,
        );
        return null; // Return null for failed deletions
      }),
  );

  const results = await Promise.all(promises);
  const deletedCount = results.filter((r) => r !== null).length;

  return { ok: true, deletedCount };
};

export const deleteScreenshot = async (filename) => {
  try {
    if (!filename) return { ok: false, error: "Filename is required" };
    await bucket.file(filename).delete();
    return { ok: true };
  } catch (err) {
    console.error(
      `[Cleanup] Failed to delete screenshot ${filename}:`,
      err.message,
    );
    return { ok: false, error: err.message || String(err) };
  }
};
