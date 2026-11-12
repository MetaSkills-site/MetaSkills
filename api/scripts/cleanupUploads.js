/**
 * @file cleanupUploads.js
 * @description Scans Google Cloud Storage for unconfirmed temporary upload files exceeding TTL and deletes them.
 * @architecture Part of the storage lifecycle maintenance layer interfacing with Google Cloud Storage to purge stale uncommitted blobs.
 * @agent_note Relies on GCS_BUCKET_NAME environment variable and can be executed as a CLI script or imported as a module function.
 */

import { listPendingFiles, deleteFiles } from "../utils/storage.js";
import dotenv from "dotenv";

// Load env vars if run directly
if (!process.env.GCS_BUCKET_NAME) {
  dotenv.config();
}

const CLEANUP_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * @desc Lists and removes orphaned files in Google Cloud Storage older than the configured TTL threshold.
 * @returns {Promise<void>} Resolves when orphaned file deletion is completed.
 */
const cleanup = async () => {
  console.log("----------------------------------------");
  console.log("[Cleanup] Starting orphaned uploads cleanup job...");
  console.log(
    `[Cleanup] TTL configured to: ${CLEANUP_TTL_MS / 1000 / 60} minutes`,
  );

  try {
    console.log("[Cleanup] Scanning GCS bucket for pending files...");
    const pendingFiles = await listPendingFiles(CLEANUP_TTL_MS);

    if (pendingFiles.length === 0) {
      console.log("[Cleanup] No stale pending files found.");
      console.log("----------------------------------------");
      return;
    }

    console.log(`[Cleanup] Found ${pendingFiles.length} stale file(s).`);
    console.log("[Cleanup] Initiating deletion...");

    // Optional: Log filenames if not too many, or just first few
    if (pendingFiles.length <= 10) {
      pendingFiles.forEach((f) => console.log(`  - Marking for delete: ${f}`));
    } else {
      console.log(`  - ${pendingFiles[0]}`);
      console.log(`  - ... and ${pendingFiles.length - 1} more`);
    }

    await deleteFiles(pendingFiles);

    console.log("[Cleanup] Deletion complete.");
    console.log("----------------------------------------");
    console.log("SUCCESS: Cleanup finished.");
  } catch (error) {
    console.error("[Cleanup] FATAL ERROR:", error.message);
    if (error.code === 401 || error.code === 403) {
      console.error("  > Check your Google Cloud Credentials.");
    }
    throw error; // Re-throw to ensure runner sees failure
  }
};

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default cleanup;
