/**
 * @file uploadService.js
 * @description Dedicated service for Google Cloud Storage (GCS) uploads.
 * Handles signed-URL uploads with structured retry logic and exponential backoff.
 * MUST use raw fetch() — never apiClient — to guarantee zero JWT leakage to GCS.
 */

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

/**
 * Uploads a file to a pre-signed GCS URL with retry logic.
 *
 * @param {string} signedUrl - The presigned PUT URL.
 * @param {Blob|File} file - The file data to upload.
 * @param {Object} options - Optional configuration options.
 * @param {string} [options.contentType] - Explicit content type (defaults to file.type).
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} If upload fails after max attempts.
 */
export async function uploadFileToGCS(signedUrl, file, options = {}) {
  const { contentType } = options;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType || file.type,
          "x-goog-meta-pending": "true",
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`GCS upload failed: HTTP ${response.status}`);
      }

      return { success: true };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        await new Promise((res) =>
          setTimeout(res, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)),
        );
      }
    }
  }

  throw new Error(
    `GCS upload failed after ${MAX_RETRIES} attempts: ${lastError?.message || lastError}`,
  );
}
