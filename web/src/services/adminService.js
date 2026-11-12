/**
 * @file adminService.js
 * @description Administrative API service client handling backups, error telemetry, active sessions, notifications, analytics, scripts, and user moderation.
 * @architecture Encapsulates admin endpoint calls via adminApiClient, managing multi-endpoint telemetry aggregation and admin privileged operations.
 * @agent_note Requires administrative JWT bearer tokens configured in adminApiClient; handle Promise.allSettled error shapes when modifying analytics methods.
 */

/**
 * FILE PURPOSE: Centralized service for all administrative API interactions.
 * Handles high-level management tasks including backups, error reporting, session tracking,
 * notifications, and global analytics.
 *
 * DEPENDENCIES:
 * - api.js: Pre-configured axios instance (apiClient) and auth helpers.
 *
 * EXPORTS:
 * - Admin Auth: checkAdminSession
 * - Backup Management: getBackupFiles, triggerBackup, deleteBackupFile, etc.
 * - Error Tracking: getErrorReports, deleteErrorReport, etc.
 * - Session Management: getSessions, deleteSession, deleteAllSessions
 * - Notification Engine: getNotifications, createNotification, deleteNotification
 * - Admin Analytics: getAdminAnalytics, getDashboardAnalytics
 * - User Management: getUsers, getUserById, updateUser, deleteUser
 * - Maintenance: getScripts, runScript
 *
 * INTERCONNECT:
 * - Consumed by Admin layouts and Dashboard components.
 * - Requires a valid admin-scoped JWT token for all requests.
 */

import adminApiClient from "./adminApi";

// ─── Admin Auth ──────────────────────────────────────────────────────────────

/**
 * Checks if the current admin session is valid.
 *
 * @returns {Promise<Object>} Admin session status and user data.
 */
export async function checkAdminSession() {
  const res = await adminApiClient.get("/api/admin/check", {});
  return res.data;
}

// ─── Backup / Drive files ────────────────────────────────────────────────────

/**
 * Fetches the list of database backup files.
 *
 * @returns {Promise<Object>} List of backup files.
 */
export async function getBackupFiles() {
  const res = await adminApiClient.get("/api/backup/list", {});
  return res.data;
}

/**
 * Triggers a manual cloud drive backup.
 *
 * @returns {Promise<Object>} Result of the backup operation.
 */
export async function triggerBackup() {
  const res = await adminApiClient.post("/api/backup/drive", {});
  return res.data;
}

/**
 * Deletes a specific backup file by its ID.
 *
 * @param {string} fileId - ID of the backup file to delete.
 * @returns {Promise<Object>} Deletion result confirmation.
 */
export async function deleteBackupFile(fileId) {
  const res = await adminApiClient.delete(`/api/backup/${fileId}`, {});
  return res.data;
}

/**
 * Retrieves the raw content of a specific backup file.
 *
 * @param {string} fileId - ID of the backup file.
 * @returns {Promise<Object>} File content and metadata.
 */
export async function getBackupFileContent(fileId) {
  const res = await adminApiClient.get(`/api/backup/${fileId}/content`, {});
  return res.data;
}

/**
 * Clears all existing backup files.
 *
 * @returns {Promise<Object>} Confirmation of backup clearance.
 */
export async function clearAllBackups() {
  const res = await adminApiClient.delete("/api/backup/", {});
  return res.data;
}

// ─── Error Reports ────────────────────────────────────────────────────────────

/**
 * Fetches the status and count of unresolved/pending error reports.
 *
 * @returns {Promise<Object>} Pending error report status.
 */
export async function getErrorPendingStatus() {
  const res = await adminApiClient.get("/api/errors/pending-status", {});
  return res.data;
}

/**
 * Retrieves all submitted error reports.
 *
 * @returns {Promise<Object>} List of error reports.
 */
export async function getErrorReports() {
  const res = await adminApiClient.get("/api/errors", {});
  return res.data;
}

/**
 * Fetches a single error report by its ID.
 *
 * @param {string} reportId - Unique identifier of the error report.
 * @returns {Promise<Object>} Detailed error report data.
 */
export async function getErrorReportById(reportId) {
  const res = await adminApiClient.get(`/api/errors/${reportId}`, {});
  return res.data;
}

/**
 * Deletes a single error report.
 *
 * @param {string} reportId - ID of the report to delete.
 * @returns {Promise<Object>} Result of report deletion.
 */
export async function deleteErrorReport(reportId) {
  const res = await adminApiClient.delete(`/api/errors/${reportId}`, {});
  return res.data;
}

/**
 * Permanently deletes all error reports.
 *
 * @returns {Promise<Object>} Result of bulk deletion.
 */
export async function deleteAllErrorReports() {
  const res = await adminApiClient.delete("/api/errors", {
    params: { confirm: true },
  });
  return res.data;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

/**
 * Fetches active sessions with optional filtering parameters.
 *
 * @param {Object} [params] - Query parameters for pagination or user filtering.
 * @returns {Promise<Object>} List of active user sessions.
 */
export async function getSessions(params) {
  const res = await adminApiClient.get("/api/admin/sessions", {
    params,
  });
  return res.data;
}

/**
 * Terminates an active session by its ID.
 *
 * @param {string} sessionId - ID of the session to terminate.
 * @returns {Promise<Object>} Confirmation of termination.
 */
export async function deleteSession(sessionId) {
  const res = await adminApiClient.delete("/api/admin/sessions", {
    data: { sessionId },
  });
  return res.data;
}

/**
 * Terminates all active sessions across all users.
 *
 * @returns {Promise<Object>} Confirmation of global session termination.
 */
export async function deleteAllSessions() {
  const res = await adminApiClient.delete("/api/admin/sessions/all", {});
  return res.data;
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Retrieves system notifications.
 *
 * @param {Object} [params] - Query parameters for notification retrieval.
 * @returns {Promise<Object>} List of notifications.
 */
export async function getNotifications(params) {
  const res = await adminApiClient.get("/api/admin/notifications", {
    params,
  });
  return res.data;
}

/**
 * Creates and broadcasts a new system notification.
 *
 * @param {Object} body - Notification payload data.
 * @returns {Promise<Object>} The created notification object.
 */
export async function createNotification(body) {
  const res = await adminApiClient.post("/api/admin/notifications", body, {});
  return res.data;
}

/**
 * Deletes a system notification by ID.
 *
 * @param {string} notificationId - ID of the notification to remove.
 * @returns {Promise<Object>} Result of notification deletion.
 */
export async function deleteNotification(notificationId) {
  const res = await adminApiClient.delete("/api/admin/notifications", {
    data: { notificationId, clearSeen: false },
  });
  return res.data;
}

// ─── Admin Analytics ─────────────────────────────────────────────────────────
// These functions utilize Promise.allSettled to ensure that the failure of one
// specialized metric doesn't block the entire dashboard from loading.

/**
 * Fetches all available admin metrics in parallel.
 * Maps individual endpoint results back into a structured array.
 *
 * @returns {Promise<Array<Object|null>>} Aggregated analytics array with null fallbacks for failed metrics.
 */
export async function getAdminAnalytics() {
  const base = "/api/admin/analytics";
  const endpoints = [
    `${base}/global-stats`,
    `${base}/engagement-trends`,
    // TODO: The following endpoints are not implemented in the backend yet.
    // See Docs/missing_analytics_endpoints_TODO.md for implementation details.
    // `${base}/subject-breakdown`,
    // `${base}/top-modules`,
    // `${base}/grade-distribution`,
    // `${base}/daily-activity`,
    // `${base}/marathon-stats`,
    // `${base}/score-distribution`,
  ];

  // Fire all requests concurrently
  const results = await Promise.allSettled(
    endpoints.map((url) => adminApiClient.get(url).then((r) => r.data)),
  );

  // Return an array where failed requests are represented as null to prevent runtime crashes.
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
}

/**
 * getDashboardAnalytics — fetches specifically targeted endpoints for the Admin Analytics page.
 * Uses Promise.allSettled to provide a robust experience where partial data is better than none.
 *
 * @returns {Promise<{globalStats: Object|null, engagementTrends: Array, misfitQuestions: Array, challengingModules: Array, formatStats: Array, gradeStats: Array, speedStats: Array, vocabStats: Object|null, hasErrors: boolean}>} Dashboard analytics metrics and error flag.
 */
export async function getDashboardAnalytics() {
  const base = "/api/admin/analytics";
  const [
    globalRes,
    trendsRes,
    misfitRes,
    challengingRes,
    formatRes,
    gradeRes,
    speedRes,
    vocabRes,
  ] = await Promise.allSettled([
    adminApiClient.get(`${base}/global-stats`),
    adminApiClient.get(`${base}/engagement-trends`),
    adminApiClient.get(`${base}/misfit-questions`),
    adminApiClient.get(`${base}/challenging-modules`, {}),
    adminApiClient.get(`${base}/format-effectiveness`, {}),
    adminApiClient.get(`${base}/grade-competency`),
    adminApiClient.get(`${base}/speed-vs-comprehension`, {}),
    adminApiClient.get(`${base}/vocabulary-difficulty`, {}),
  ]);

  // Helper to safely extract nested data from a settled promise result
  const get = (res) =>
    res.status === "fulfilled" && res.value.data.success
      ? res.value.data.data
      : null;

  return {
    globalStats: get(globalRes),
    engagementTrends: get(trendsRes) ?? [],
    misfitQuestions: get(misfitRes) ?? [],
    challengingModules: get(challengingRes) ?? [],
    formatStats: get(formatRes) ?? [],
    gradeStats: get(gradeRes) ?? [],
    speedStats: get(speedRes) ?? [],
    vocabStats: get(vocabRes),
    // Flag indicating if any of the critical requests failed
    hasErrors: [
      globalRes,
      trendsRes,
      misfitRes,
      challengingRes,
      formatRes,
      gradeRes,
      speedRes,
      vocabRes,
    ].some((r) => r.status !== "fulfilled" || !r.value?.data?.success),
  };
}

// ─── Users / User management ──────────────────────────────────────────────────

/**
 * Fetches users with pagination and filter parameters.
 *
 * @param {Object} [params] - Query parameters for pagination or filtering.
 * @returns {Promise<Object>} Paginated users list response.
 */
export async function getUsers(params) {
  const res = await adminApiClient.get("/api/users", {
    params,
  });
  return res.data;
}

/**
 * Fetches a single user by ID.
 *
 * @param {string} userId - User identifier.
 * @returns {Promise<Object>} User details.
 */
export async function getUserById(userId) {
  const res = await adminApiClient.get(`/api/users/${userId}`, {});
  return res.data;
}

/**
 * Updates a user profile or settings.
 *
 * @param {string} userId - User identifier.
 * @param {Object} data - Update payload.
 * @returns {Promise<Object>} Updated user record.
 */
export async function updateUser(userId, data) {
  const res = await adminApiClient.put(`/api/users/${userId}`, data, {});
  return res.data;
}

/**
 * Deletes a user by ID.
 *
 * @param {string} userId - User identifier to delete.
 * @returns {Promise<Object>} Deletion result confirmation.
 */
export async function deleteUser(userId) {
  const res = await adminApiClient.delete(`/api/users/${userId}`, {});
  return res.data;
}

// ─── User History (admin view) ────────────────────────────────────────────────
// Fetches both user info and quiz history in **parallel** — fixes the sequential
// waterfall bug found in UserHistory.jsx (audit bug #7).

/**
 * Fetches user profile information and quiz attempt history concurrently.
 *
 * @param {string} userId - User identifier.
 * @returns {Promise<{userInfo: Object, history: Object}>} Combined user profile and history.
 */
export async function getUserHistoryAndInfo(userId) {
  const [userRes, historyRes] = await Promise.all([
    adminApiClient.get(`/api/users/${userId}`),
    adminApiClient.get(`/api/quiz/admin/users/${userId}/history`, {}),
  ]);
  return { userInfo: userRes.data, history: historyRes.data };
}

// ─── Admin Scripts ────────────────────────────────────────────────────────────

/**
 * Retrieves the catalog of available admin maintenance scripts.
 *
 * @returns {Promise<Object>} Available scripts metadata.
 */
export async function getScripts() {
  const res = await adminApiClient.get("/api/admin/scripts", {});
  return res.data;
}

/**
 * Executes a specific administrative maintenance script by key.
 *
 * @param {string} scriptKey - Identifier of the script to execute.
 * @returns {Promise<Object>} Script execution output and status.
 */
export async function runScript(scriptKey) {
  const res = await adminApiClient.post("/api/admin/scripts/run", {
    scriptKey,
  });
  return res.data;
}

/**
 * Deletes an individual quiz attempt response record.
 *
 * @param {string} responseId - Identifier of the response record to delete.
 * @returns {Promise<Object>} Deletion result confirmation.
 */
export async function deleteQuizResponse(responseId) {
  const res = await adminApiClient.delete(
    `/api/quiz/admin/responses/${responseId}`,
  );
  return res.data;
}
