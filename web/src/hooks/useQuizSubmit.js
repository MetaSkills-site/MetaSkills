/**
 * @file useQuizSubmit.js
 * @description Manages the submission of quiz answers to the backend, tracking loading, error, and result states.
 *
 * DEPENDENCIES:
 * - react: useState, useCallback
 * - axios: For HTTP requests
 * - react-hot-toast: For displaying error messages
 *
 * EXPORTS:
 * - default: useQuizSubmit - Custom hook for answer submission.
 *
 * INTERCONNECTIONS:
 * - Consumed by components that require answer submission functionality (e.g., WriteAnswer, MarathonQuiz).
 */

import { useState, useCallback, useRef } from "react";
import apiClient from "../services/api";
import toast from "react-hot-toast";

/**
 * useQuizSubmit Hook
 *
 * Simplifies the process of making asynchronous POST requests for quiz submissions.
 */
const useQuizSubmit = () => {
  // Local state to manage the submission lifecycle
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * submitAnswer
   * Executes the asynchronous request to submit quiz answers.
   *
   * @param {string} endpoint - The target URL for the POST request.
   * @param {Object} payload  - The data to be submitted.
   * @param {Object} [options={}] - Additional configuration.
   * @param {boolean} [options.idempotent=false] - If true, generates an X-Idempotency-Key header.
   * @returns {Promise<Object>} An object indicating success or failure with data or error message.
   */
  const idempotencyKeyRef = useRef(null);
  // Track the last payload fingerprint so identical retries reuse the same key
  const lastPayloadRef = useRef(null);

  const submitAnswer = useCallback(async (endpoint, payload, options = {}) => {
    // Reset states before starting a new submission
    setSubmitting(true);
    setError(null);
    setResult(null);

    // Build request config with optional idempotency key
    const requestConfig = {
      headers: { ...options.headers },
    };
    if (options.idempotent) {
      if (options.idempotencyKey) {
        // Explicit key always wins — caller controls deduplication
        requestConfig.headers["X-Idempotency-Key"] = options.idempotencyKey;
      } else {
        // Generate a fingerprint from endpoint + payload so different
        // submissions get distinct keys, but retries of the same payload
        // reuse the cached key (until reset() is called).
        const payloadFingerprint = JSON.stringify({ endpoint, payload });
        if (
          !idempotencyKeyRef.current ||
          lastPayloadRef.current !== payloadFingerprint
        ) {
          idempotencyKeyRef.current = crypto.randomUUID();
          lastPayloadRef.current = payloadFingerprint;
        }
        requestConfig.headers["X-Idempotency-Key"] = idempotencyKeyRef.current;
      }
    }

    try {
      // Execute the POST request
      const res = await apiClient.post(endpoint, payload, requestConfig);

      // Check if the server-side response indicates success
      if (res.data.success) {
        if (options.idempotent && !options.idempotencyKey) {
          idempotencyKeyRef.current = null;
          lastPayloadRef.current = null;
        }
        const data = res.data.data;
        setResult(data);

        /**
         * Optional: Show toast for carrots/gamification if not handled by UI component.
         * data.message could contain feedback for the user.
         */
        if (data.message) {
          // toast.success(data.message);
        }
        return { success: true, data: data };
      } else {
        // Handle explicit server-side failures
        throw new Error(res.data.message || "Submission failed");
      }
    } catch (err) {
      // Catch network or validation errors
      const msg =
        err.response?.data?.message || err.message || "An error occurred";
      setError(msg);
      // Display error notification to the user
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      // Ensure submitting state is cleared
      setSubmitting(false);
    }
  }, []);

  /**
   * reset
   * Manually clears the submission-related states.
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setSubmitting(false);
    idempotencyKeyRef.current = null;
    lastPayloadRef.current = null;
  }, []);

  return {
    submitAnswer,
    submitting,
    error,
    result,
    reset,
  };
};

export default useQuizSubmit;
