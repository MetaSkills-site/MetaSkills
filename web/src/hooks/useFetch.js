/**
 * @file useFetch.js
 * @description Unified data-fetching hook that consumes the centralized request map.
 * Handles token injection, configurable retry logic, idempotency key management,
 * and standardized error reporting.
 *
 * KEY BEHAVIORS:
 * - Reads `user.token` from SessionContext for Authorization headers.
 * - Respects `skipAuth` and `useBaseUrl` flags from requestMap entries.
 * - Retries transient failures (configurable count and delay).
 * - Strips sensitive headers from error logs to prevent token exposure in console.
 * - Defaults to lazy mode (`execute()` must be called manually).
 *
 * @dependencies
 * - api.js: Pre-configured axios instance with baseURL and interceptors.
 * - requestMap.js: Endpoint configuration registry.
 * - SessionProvider.jsx: Provides user session context.
 *
 * @exports useFetch (default)
 * @interconnections Used by src/components/common/Fetch.jsx and individual components.
 */

import { useState, useCallback, useContext, useRef, useEffect } from "react";
import { API_ENDPOINTS } from "../api/requestMap";
import apiClient from "../services/api";
import { SessionContext } from "../context/SessionProvider";

/**
 * useFetch — Centralized data-fetching hook.
 *
 * @param {string} endpointId — Key from API_ENDPOINTS (e.g., 'googleAuth').
 * @param {Object} [defaultParams={}] — Static params merged into every request.
 * @param {Object} [options={}] — Configuration overrides.
 * @param {boolean} [options.lazy=true] — If true, request is NOT fired on mount.
 * @param {number} [options.retries=2] — Number of retry attempts on failure.
 * @param {number} [options.retryDelay=1000] — Delay (ms) between retries.
 *
 * @returns {{ data: any, loading: boolean, error: Error|null, execute: Function }}
 */
export default function useFetch(endpointId, defaultParams = {}, options = {}) {
  const { lazy = true, retries = 2, retryDelay = 1000 } = options;
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const { user } = useContext(SessionContext);

  // Ref to track if the component is still mounted, preventing state updates after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Guard ref ensures the auto-run fires exactly once when lazy=false,
  // regardless of execute reference changes from token/param updates.
  const hasAutoRunRef = useRef(false);

  useEffect(() => {
    if (!lazy && !hasAutoRunRef.current) {
      hasAutoRunRef.current = true;
      execute();
    }
  }, [lazy]);

  /**
   * Execute the configured API request.
   *
   * @param {Object|null} [body=null] — Request body for POST/PUT/DELETE.
   * @param {Object|null} [dynamicParams=null] — Runtime params merged with defaultParams.
   *   For GET requests these become URL query params.
   *   For dynamic URLs these are used to resolve the URL template.
   * @returns {Promise<any>} — Resolved response data.
   * @throws {Error} — Re-thrown after all retries are exhausted.
   */
  const execute = useCallback(
    async (body = null, dynamicParams = null) => {
      setLoading(true);
      setError(null);

      const config = API_ENDPOINTS[endpointId];
      if (!config) {
        const err = new Error(
          `[useFetch] Endpoint "${endpointId}" not found in API_ENDPOINTS.`,
        );
        setError(err);
        setLoading(false);
        throw err;
      }

      const mergedParams = { ...defaultParams, ...dynamicParams };

      // Resolve URL — supports both static strings and dynamic functions
      const resolvedUrl =
        typeof config.url === "function"
          ? config.url(mergedParams)
          : config.url;

      const requestOptions = {
        method: config.method,
        url: resolvedUrl,
        data: body,
        headers: { ...config.headers },
      };

      // ── Idempotency Key ──
      // Generate a UUID ONCE per execute() call. The same key is reused across
      // all automatic retries so the backend middleware can deduplicate them.
      if (config.idempotent) {
        let idempotencyKey = null;
        try {
          idempotencyKey =
            window.crypto?.randomUUID?.() ?? globalThis.crypto?.randomUUID?.();
        } catch {
          // Fallback if randomUUID fails or context is non-secure
        }

        if (!idempotencyKey && globalThis.crypto?.getRandomValues) {
          idempotencyKey = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
            /[018]/g,
            (c) =>
              (
                c ^
                (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] &
                  (15 >> (c / 4)))
              ).toString(16),
          );
        } else if (!idempotencyKey) {
          idempotencyKey = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
              const r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            },
          );
        }

        if (typeof idempotencyKey === "string") {
          requestOptions.headers["X-Idempotency-Key"] = idempotencyKey;
        }
      }

      // For GET requests, pass merged params as query string parameters
      if (config.method === "GET") {
        requestOptions.params = mergedParams;
      }

      // When useBaseUrl is explicitly false, prevent apiClient from prepending base URL
      if (config.useBaseUrl === false) {
        requestOptions.baseURL = "";
      }

      // We no longer inject Authorization headers since we use httpOnly cookies.

      // Mark skipAuth on the config so the interceptor knows not to override
      if (config.skipAuth) {
        requestOptions.skipAuth = true;
      }

      let attempt = 0;
      while (attempt <= retries) {
        try {
          let response;
          if (config.method === "GET" && config.cache) {
            response = await apiClient.cachedGet(resolvedUrl, requestOptions);
          } else {
            response = await apiClient(requestOptions);
          }
          if (mountedRef.current) {
            setData(response.data);
            setLoading(false);
          }
          return response.data;
        } catch (err) {
          attempt++;
          const isTransient = !err.response || err.response.status >= 500;

          if (attempt > retries || !isTransient) {
            // Standardized error logging — strip sensitive Authorization header
            console.error(
              `[useFetch] Request failed [${endpointId}] after ${attempt} attempts:`,
              err.message,
            );
            if (mountedRef.current) {
              setError(err);
              setLoading(false);
            }
            throw err;
          }
          // Wait before retrying
          await new Promise((res) => setTimeout(res, retryDelay));
        }
      }
    },
    [endpointId, defaultParams, user?.token, retries, retryDelay],
  );

  return { data, loading, error, execute };
}
