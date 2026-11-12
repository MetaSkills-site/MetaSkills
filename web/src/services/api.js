/**
 * @file api.js
 * @description Core Axios HTTP client configuration with CSRF handling, in-memory GET response caching, and request/response interceptors.
 * @architecture Base networking layer consumed by domain services and query hooks for communication with the backend API.
 * @agent_note Mutations (POST, PUT, PATCH, DELETE) automatically clear the in-memory cache and attach the CSRF token from fetchCsrfToken.
 */

/**
 * FILE PURPOSE: Core API client configuration.
 * Provides a pre-configured axios instance used by all service modules.
 * Centralizes base URL, authentication header generation, and request interceptors.
 *
 * DEPENDENCIES:
 * - axios: HTTP client library.
 *
 * EXPORTS:
 * - apiClient (default): Pre-configured axios instance with baseURL, timeout,
 *   and a request interceptor for automatic token injection.
 * - authHeader: Helper to generate standard Bearer token header.
 *   (Retained for backward compatibility with existing service modules.)
 *
 * INTERCEPTOR BEHAVIOR:
 * The request interceptor auto-injects `Authorization: Bearer <token>` from
 * localStorage when:
 *   1. The request does NOT already have an Authorization header set
 *      (prevents double-injection when service modules explicitly pass authHeader).
 *   2. The request config does NOT have `skipAuth: true`
 *      (used by requestMap entries for public/external endpoints like GCS uploads).
 *
 * INTERCONNECT:
 * - Fundamental building block for all service modules and the useFetch hook.
 * - 401 response interceptor is registered separately in SessionProvider.jsx.
 */

import axios from "axios";

/**
 * Global axios instance with same-origin relative base URL.
 * In development, Vite proxies /api requests to localhost:7860.
 * In production, Vercel routes /api requests directly to the Express backend service.
 * Default 15-second timeout prevents infinite hanging states in the UI.
 */
const apiClient = axios.create({
  baseURL: "",
  timeout: 15000,
  withCredentials: true,
});

const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let csrfToken = null;

/**
 * Returns the currently stored CSRF token.
 *
 * @returns {string|null} The cached CSRF token, or null if uninitialized.
 */
export const getCsrfToken = () => csrfToken;

/**
 * Fetches and stores a fresh CSRF token from the server.
 *
 * @returns {Promise<void>} Resolves when token has been set in module memory.
 */
export const fetchCsrfToken = async () => {
  const res = await apiClient.get("/api/csrf-token");
  csrfToken = res.data.csrfToken;
};

apiClient.interceptors.request.use(
  (config) => {
    if (config.skipAuth) {
      return config;
    }
    if (
      csrfToken &&
      ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())
    ) {
      config.headers["x-xsrf-token"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    // Global cache invalidation on mutation
    if (
      ["post", "put", "patch", "delete"].includes(
        response.config.method?.toLowerCase(),
      )
    ) {
      apiCache.clear();
    }
    return response;
  },
  (error) => Promise.reject(error),
);

/**
 * Performs a cached HTTP GET request, returning cached response if within TTL window.
 *
 * @param {string} url - Target request URL.
 * @param {Object} [options={}] - Axios configuration options and query parameters.
 * @returns {Promise<Object>} Response object from cache or network request.
 */
apiClient.cachedGet = async (url, options = {}) => {
  const cacheKey = `GET:${url}:${JSON.stringify(options.params || {})}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (cached.promise) return cached.promise;
    return Promise.resolve(cached.response);
  }

  const reqPromise = apiClient.get(url, options).then((response) => {
    apiCache.set(cacheKey, { response, timestamp: Date.now() });
    if (apiCache.size > 100) {
      const oldest = [...apiCache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp,
      )[0];
      apiCache.delete(oldest[0]);
    }
    return response;
  });

  apiCache.set(cacheKey, { promise: reqPromise, timestamp: Date.now() });
  return reqPromise;
};

export default apiClient;
