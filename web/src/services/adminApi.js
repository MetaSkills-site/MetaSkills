/**
 * @file adminApi.js
 * @description Admin API client configuration.
 * Mirrors api.js but automatically injects the admin token from `localStorage['adminUser']`.
 *
 * DEPENDENCIES:
 * - axios: HTTP client library.
 *
 * INTERCEPTOR BEHAVIOR:
 * Auto-injects `Authorization: Bearer <token>` from the `adminUser` object in localStorage.
 * Skips injection if `skipAuth: true` or if an Authorization header is explicitly passed.
 */

import axios from "axios";

/**
 * Admin axios instance with same-origin relative base URL.
 * In development, Vite proxies /api requests to localhost:7860.
 * In production, Vercel routes /api requests directly to the Express backend service.
 */
const adminApiClient = axios.create({
  baseURL: "",
  timeout: 15000,
  withCredentials: true,
});

const adminApiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

adminApiClient.interceptors.request.use(
  async (config) => {
    // Respect skipAuth flag from requestMap / external endpoints
    if (config.skipAuth) {
      return config;
    }

    const { getCsrfToken } = await import("./api.js");
    const csrfToken = getCsrfToken();
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

adminApiClient.interceptors.response.use(
  (response) => {
    // Global cache invalidation on mutation
    if (
      ["post", "put", "patch", "delete"].includes(
        response.config.method?.toLowerCase(),
      )
    ) {
      adminApiCache.clear();
    }
    return response;
  },
  (error) => Promise.reject(error),
);

adminApiClient.cachedGet = async (url, options = {}) => {
  const cacheKey = `GET:${url}:${JSON.stringify(options.params || {})}`;
  const cached = adminApiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (cached.promise) return cached.promise;
    return Promise.resolve(cached.response);
  }

  const reqPromise = adminApiClient.get(url, options).then((response) => {
    adminApiCache.set(cacheKey, { response, timestamp: Date.now() });
    if (adminApiCache.size > 100) {
      const oldest = [...adminApiCache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp,
      )[0];
      adminApiCache.delete(oldest[0]);
    }
    return response;
  });

  adminApiCache.set(cacheKey, { promise: reqPromise, timestamp: Date.now() });
  return reqPromise;
};

export default adminApiClient;
