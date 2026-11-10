/**
 * @file storage.js
 * @description Handles general Google Cloud Storage operations including file uploads and metadata management.
 * @architecture Provides the primary GCS abstraction layer for file management in the application.
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

const bucketName = process.env.GCS_BUCKET_NAME || "metaskills";
const bucket = storage.bucket(bucketName);

/**
 * Generate a V4 signed URL for uploading a file.
 * Sets x-goog-meta-pending to "true".
 * @param {string} filename - The name of the file.
 * @param {string} contentType - The MIME type of the file.
 * @returns {Promise<{uploadUrl: string, filename: string}>}
 */
export const generateV4UploadSignedUrl = async (filename, contentType) => {
  // Sanitize and ensure unique filename
  // Replace spaces and special chars with underscores to ensure clean URLs
  const sanitizedBasename = path
    .basename(filename)
    .replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueFilename = `${Date.now()}-${sanitizedBasename}`;
  const file = bucket.file(uniqueFilename);

  const options = {
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
    extensionHeaders: {
      "x-goog-meta-pending": "true",
    },
  };

  const [url] = await file.getSignedUrl(options);

  return {
    uploadUrl: url,
    filename: uniqueFilename,
  };
};

/**
 * Update file metadata to mark it as final.
 * @param {string} filename
 * @param {object} metadata
 */
export const setFileMetadata = async (filename, metadata) => {
  const file = bucket.file(filename);
  await file.setMetadata({
    metadata: {
      pending: "false",
      ...metadata,
    },
  });
};

/**
 * Delete files from GCS.
 * @param {string[]} filenames
 */
export const deleteFiles = async (filenames) => {
  const promises = filenames.map((filename) =>
    bucket
      .file(filename)
      .delete()
      .catch((err) => {
        console.error(`Failed to delete ${filename}:`, err.message);
      }),
  );
  await Promise.all(promises);
};

/**
 * List pending files older than TTL.
 * @param {number} ttlMs - Time to live in milliseconds.
 * @returns {Promise<string[]>} - List of filenames.
 */
export const listPendingFiles = async (ttlMs) => {
  const [files] = await bucket.getFiles();
  const now = Date.now();

  const pendingFiles = files.filter((file) => {
    const metadata = file.metadata.metadata || {};
    const created = new Date(file.metadata.timeCreated).getTime();

    return metadata.pending === "true" && now - created > ttlMs;
  });

  return pendingFiles.map((file) => file.name);
};
