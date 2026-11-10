/**
 * FILE PURPOSE: Generic asynchronous request handler wrapper with toast notifications.
 * Provides a standardized way to execute API calls with loading states and user feedback.
 *
 * DEPENDENCIES:
 * - api.js: Centralized axios instance with baseURL and auto token injection.
 * - react-hot-toast: UI library for showing promise-based notifications.
 *
 * EXPORTS:
 * - handleAsync (default): Executes async request with loading/success/error handlers.
 * - getPromiseState: Utility to check if a promise is pending, fulfilled, or rejected.
 *
 * INTERCONNECT:
 * - Used across various components to wrap API interactions with a consistent UX.
 * - Connects backend responses directly to frontend toast notifications.
 */

import apiClient from "../services/api";
import toast from "react-hot-toast";

/**
 * Execute an asynchronous request with integrated toast notifications.
 *
 * @param {string} url - API endpoint (relative to same-origin base URL)
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {Object} data - Request payload
 * @param {HTMLElement|string} submitter - Button element to disable during loading, or "NA"
 * @param {string} onLoading - Message to show while request is pending
 * @param {Function} onPass - Callback for successful response
 * @param {Function} onFail - Callback for failed response
 */
export default function handleAsync(
  url,
  method,
  data,
  submitter,
  onLoading,
  onPass,
  onFail,
) {
  if (!submitter) {
    throw new Error("Submitter can't be accessed", submitter);
  }

  // toast.promise handles the full lifecycle: loading -> success/error
  // Auth token is injected automatically by the apiClient request interceptor.
  toast.promise(
    apiClient({
      method: method,
      url: url,
      data: data,
    }),
    {
      loading: () => {
        // Disable the submit button to prevent double submissions
        submitter === "NA" || (submitter.disabled = true);
        return onLoading;
      },
      success: (res) => {
        // Execute optional success callback
        typeof onPass === "function" ? onPass(res) : null;
        return res.data.message;
      },
      error: (error) => {
        // Execute optional failure callback and re-enable the button
        typeof onFail === "function" ? onFail(error) : null;
        submitter === "NA" || (submitter.disabled = false);
        // Extract error message from response or fallback to generic message
        return error.response?.data?.message || error.message;
      },
    },
  );
}

export function getPromiseState(p) {
  const t = {};
  return Promise.race([p, t]).then(
    (v) => (v === t ? "pending" : "fulfilled"),
    () => "rejected",
  );
}
