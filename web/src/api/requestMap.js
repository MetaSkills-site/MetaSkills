/**
 * @file requestMap.js
 * @description Single source of truth for all API endpoint configurations.
 * Each entry defines the HTTP method, URL (static or dynamic), and security flags
 * to control auth header injection and base URL usage.
 *
 * FLAGS:
 * - useBaseUrl {boolean} — When false, the request URL is used as-is (no baseURL prefix).
 *   Defaults to true if omitted.
 * - skipAuth {boolean} — When true, the Authorization header is NOT injected.
 *   Use for public endpoints (e.g., Google Auth) and external services (e.g., GCS uploads).
 *   Defaults to false if omitted.
 * - headers {Object} — Additional static headers to merge into the request.
 *
 * URL PATTERNS:
 * - Static: `url: '/api/some/endpoint'`
 * - Dynamic: `url: (params) => `/api/items/${params.id}``
 *   Dynamic URLs receive merged params from defaultParams + dynamicParams.
 *
 * @exports API_ENDPOINTS
 * @interconnections Consumed by src/hooks/useFetch.js and src/components/common/Fetch.jsx.
 */

export const API_ENDPOINTS = {
  // ─── Auth ────────────────────────────────────────────────────────────────────
  // Google Auth doesn't carry a JWT — the user is authenticating for the first time.
  googleAuth: {
    method: "POST",
    url: "/api/users/google-auth",
    skipAuth: true,
  },

  // ─── Admin ───────────────────────────────────────────────────────────────────
  adminGoogleAuth: {
    method: "POST",
    url: "/api/admin/google-auth",
    skipAuth: true,
  },

  checkAdminSession: {
    method: "GET",
    url: "/api/admin/check",
  },

  // ─── Error Reporting ─────────────────────────────────────────────────────────
  submitErrorReport: {
    method: "POST",
    url: "/api/errors/report",
    idempotent: true,
  },

  getScreenshotUrl: {
    method: "POST",
    url: "/api/errors/screenshot-url",
  },

  // GCS signed URL upload — MUST NOT send our app's JWT to Google Cloud Storage.
  uploadToGCS: {
    method: "PUT",
    url: (params) => params.uploadUrl,
    useBaseUrl: false,
    skipAuth: true,
  },

  // ─── Quiz Analytics ──────────────────────────────────────────────────────────
  getAnalyticsDaily: {
    method: "GET",
    url: "/api/quiz/analytics/daily",
    cache: true,
  },

  getAnalyticsSpeedAccuracy: {
    method: "GET",
    url: "/api/quiz/analytics/speed-accuracy",
    cache: true,
  },

  getAnalyticsFormats: {
    method: "GET",
    url: "/api/quiz/analytics/formats",
    cache: true,
  },

  getAnalyticsDifficulty: {
    method: "GET",
    url: "/api/quiz/analytics/difficulty",
    cache: true,
  },

  getAnalyticsSkills: {
    method: "GET",
    url: "/api/quiz/analytics/skills",
    cache: true,
  },

  // ─── Quiz History ────────────────────────────────────────────────────────────
  getQuizHistory: {
    method: "GET",
    url: "/api/quiz/history",
  },

  getMarathonHistory: {
    method: "GET",
    url: "/api/quiz/analytics/marathons",
    cache: true,
  },

  // ─── Modules ─────────────────────────────────────────────────────────────────
  getModuleQuestions: {
    method: "GET",
    url: (params) => `/api/quiz/questions/bymodule/${params.moduleId}`,
  },

  // ─── Offline Verification ────────────────────────────────────────────────────
  // Raw connectivity check — no auth, no backend base URL.
  checkConnection: {
    method: "HEAD",
    url: "/favicon.ico",
    useBaseUrl: false,
    skipAuth: true,
  },

  // ─── Core / User ─────────────────────────────────────────────────────────────
  getUserPerformance: { method: "GET", url: "/api/users/performance" },
  completeProfile: { method: "PUT", url: "/api/users/complete-profile" },
  reportUserError: { method: "POST", url: "/api/users/report-error" },
  updateUserGrade: { method: "PUT", url: "/api/users/grade" },
  editUser: { method: "PUT", url: "/api/users/edit" },

  // ─── Quiz / Module Engine ────────────────────────────────────────────────────
  getModulesProgress: { method: "POST", url: "/api/quiz/modules/progress" },
  startModule: { method: "POST", url: "/api/quiz/modules/start" },
  submitQuizAnswer: {
    method: "POST",
    url: "/api/quiz/submit",
    idempotent: true,
  },
  getQuestionById: { method: "POST", url: "/api/quiz/questions/getById" },
  getModuleById: {
    method: "GET",
    url: (p) => `/api/quiz/modules/${p.moduleId}`,
  },
  getModulesList: { method: "POST", url: "/api/quiz/modules/get" },
  getSequence: {
    method: "GET",
    url: (p) => `/api/quiz/sequence/${p.subject}/${p.grade}`,
  },
  saveSequence: {
    method: "PUT",
    url: (p) => `/api/quiz/sequence/${p.subject}/${p.grade}`,
  },
  submitQuizResponse: {
    method: "POST",
    url: "/api/quiz/response",
    idempotent: true,
  },

  // ─── Marathons ───────────────────────────────────────────────────────────────
  getPassagesGenerate: {
    method: "GET",
    url: (p) => `/api/passages/generate/${p.type}`,
  },
  getVocabularyQuiz: { method: "GET", url: "/api/vocabulary/quiz" },
  getVocabularyRandom: { method: "GET", url: "/api/vocabulary/random" },
  verifyVocabulary: {
    method: "POST",
    url: "/api/vocabulary/verify",
    idempotent: true,
  },
  getMathTopics: { method: "GET", url: "/api/math/topics", cache: true },
  getMathQuestion: { method: "GET", url: "/api/math/question" },
  checkMathAnswer: {
    method: "POST",
    url: "/api/math/answer",
    idempotent: true,
  },

  // ─── Admin Dashboard ─────────────────────────────────────────────────────────
  getContextAttachment: {
    method: "GET",
    url: (p) => `/api/context-attachments/${p.id}`,
  },
  listContextAttachments: { method: "GET", url: "/api/context-attachments" },
  createContextAttachment: { method: "POST", url: "/api/context-attachments" },
  updateContextAttachment: {
    method: "PUT",
    url: (p) => `/api/context-attachments/${p.id}`,
  },
  deleteContextAttachment: {
    method: "DELETE",
    url: (p) => `/api/context-attachments/${p.id}`,
  },
  getQuestions: { method: "POST", url: "/api/quiz/questions/get" },
  getQuestionByIdAdmin: {
    method: "POST",
    url: "/api/quiz/questions/getByIdAdmin",
  },
  getSkills: { method: "GET", url: "/api/quiz/questions/skills", cache: true },
  detachQuestion: { method: "PUT", url: "/api/quiz/questions/update" },
  updateQuestion: { method: "PUT", url: (p) => `/api/quiz/questions/${p.id}` },
  getAdminNotifications: { method: "GET", url: "/api/admin/notifications" },
  createAdminNotification: {
    method: "POST",
    url: "/api/admin/notifications",
    idempotent: true,
  },
  deleteAdminNotification: {
    method: "DELETE",
    url: "/api/admin/notifications",
  },

  // ─── Notifications ───────────────────────────────────────────────────────────
  getUserNotifications: { method: "GET", url: "/api/users/notifications" },
  getUserNotificationsUnread: {
    method: "GET",
    url: "/api/users/notifications/unread",
  },
  markNotificationRead: {
    method: "PUT",
    url: (p) => `/api/users/notifications/${p.notifId}/read`,
  },
  markAllNotificationsRead: {
    method: "POST",
    url: "/api/users/notifications/read",
  },

  // ─── Uploads & Gen AI ────────────────────────────────────────────────────────
  getSignedUploadUrl: { method: "POST", url: "/api/upload/signed-url" },
  genaiStream: { method: "POST", url: "/api/genai/stream" },
  // Note: AudioWord.jsx intentionally bypasses useFetch for /tts since it sits deep within UI nodes.
  // The genaiTTS entry is maintained here for strict route documentation and future-proofing.
  genaiTTS: { method: "POST", url: "/api/genai/tts" },
  genaiExplanation: { method: "POST", url: "/api/genai/explanation" },
  genaiSentenceEvaluate: {
    method: "POST",
    url: "/api/genai/sentences/evaluate",
    idempotent: true,
  },

  // ─── Bulk Import ──────────────────────────────────────────────────────────────
  genaiParseQuestions: { method: "POST", url: "/api/genai/parse-questions" },
  bulkImportQuestions: { method: "POST", url: "/api/quiz/bulk-import" },
};
