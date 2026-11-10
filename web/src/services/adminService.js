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

export async function checkAdminSession() {
  const res = await adminApiClient.get("/api/admin/check", {});
  return res.data;
}

// ─── Backup / Drive files ────────────────────────────────────────────────────

export async function getBackupFiles() {
  const res = await adminApiClient.get("/api/backup/list", {});
  return res.data;
}

export async function triggerBackup() {
  const res = await adminApiClient.post("/api/backup/drive", {});
  return res.data;
}

export async function deleteBackupFile(fileId) {
  const res = await adminApiClient.delete(`/api/backup/${fileId}`, {});
  return res.data;
}

export async function getBackupFileContent(fileId) {
  const res = await adminApiClient.get(`/api/backup/${fileId}/content`, {});
  return res.data;
}

export async function clearAllBackups() {
  const res = await adminApiClient.delete("/api/backup/", {});
  return res.data;
}

// ─── Error Reports ────────────────────────────────────────────────────────────

export async function getErrorPendingStatus() {
  const res = await adminApiClient.get("/api/errors/pending-status", {});
  return res.data;
}

export async function getErrorReports() {
  const res = await adminApiClient.get("/api/errors", {});
  return res.data;
}

export async function getErrorReportById(reportId) {
  const res = await adminApiClient.get(`/api/errors/${reportId}`, {});
  return res.data;
}

export async function deleteErrorReport(reportId) {
  const res = await adminApiClient.delete(`/api/errors/${reportId}`, {});
  return res.data;
}

export async function deleteAllErrorReports() {
  const res = await adminApiClient.delete("/api/errors", {
    params: { confirm: true },
  });
  return res.data;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function getSessions(params) {
  const res = await adminApiClient.get("/api/admin/sessions", {
    params,
  });
  return res.data;
}

export async function deleteSession(sessionId) {
  const res = await adminApiClient.delete("/api/admin/sessions", {
    data: { sessionId },
  });
  return res.data;
}

export async function deleteAllSessions() {
  const res = await adminApiClient.delete("/api/admin/sessions/all", {});
  return res.data;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(params) {
  const res = await adminApiClient.get("/api/admin/notifications", {
    params,
  });
  return res.data;
}

export async function createNotification(body) {
  const res = await adminApiClient.post("/api/admin/notifications", body, {});
  return res.data;
}

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

export async function getUsers(params) {
  const res = await adminApiClient.get("/api/users", {
    params,
  });
  return res.data;
}

export async function getUserById(userId) {
  const res = await adminApiClient.get(`/api/users/${userId}`, {});
  return res.data;
}

export async function updateUser(userId, data) {
  const res = await adminApiClient.put(`/api/users/${userId}`, data, {});
  return res.data;
}

export async function deleteUser(userId) {
  const res = await adminApiClient.delete(`/api/users/${userId}`, {});
  return res.data;
}

// ─── User History (admin view) ────────────────────────────────────────────────
// Fetches both user info and quiz history in **parallel** — fixes the sequential
// waterfall bug found in UserHistory.jsx (audit bug #7).

export async function getUserHistoryAndInfo(userId) {
  const [userRes, historyRes] = await Promise.all([
    adminApiClient.get(`/api/users/${userId}`),
    adminApiClient.get(`/api/quiz/admin/users/${userId}/history`, {}),
  ]);
  return { userInfo: userRes.data, history: historyRes.data };
}

// ─── Admin Scripts ────────────────────────────────────────────────────────────

export async function getScripts() {
  const res = await adminApiClient.get("/api/admin/scripts", {});
  return res.data;
}

export async function runScript(scriptKey) {
  const res = await adminApiClient.post("/api/admin/scripts/run", {
    scriptKey,
  });
  return res.data;
}

export async function deleteQuizResponse(responseId) {
  const res = await adminApiClient.delete(
    `/api/quiz/admin/responses/${responseId}`,
  );
  return res.data;
}
