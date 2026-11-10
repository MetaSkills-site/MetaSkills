/**
 * FILE PURPOSE: Comprehensive service for quiz, module, and question lifecycle management.
 * Handles content organization (modules), question CRUD, trash management, and user-facing quiz progress.
 *
 * DEPENDENCIES:
 * - api.js: Pre-configured axios instance and auth helpers.
 *
 * EXPORTS:
 * - Modules: getModules, getModuleById, updateModule, deleteModuleCascade, add/removeQuestionFromModule
 * - Questions: getQuestionsByModule, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion, etc.
 * - Trash Management: getTrashQuestions, emptyTrash
 * - Quiz Progress: getModuleProgress, startQuiz, submitAnswer
 * - Analytics: getUserAnalytics, getQuizHistory, getMarathonHistory
 * - Sequences: getSequenceAndModules, saveSequence
 *
 * INTERCONNECT:
 * - Consumed by Admin components for content authoring and organization.
 * - Core dependency for the user-facing Quiz and Analytics pages.
 * - Integrates with useQuestionFetch and useSequenceManager hooks.
 */

import apiClient from "./api";

// ─── Modules ──────────────────────────────────────────────────────────────────

/** POST /api/quiz/modules/get — primary list endpoint used by admin + sequences */
export async function getModules(params = {}, body = {}) {
  const res = await apiClient.post("/api/quiz/modules/get", body, {
    params,
  });
  return res.data;
}

export async function getModuleById(moduleId) {
  const res = await apiClient.post(`/api/quiz/modules/getById`, {
    id: moduleId,
  });
  return res.data;
}

export async function updateModule(data) {
  const res = await apiClient.put("/api/quiz/modules/update", data, {});
  return res.data;
}

export async function deleteModule(moduleId) {
  const res = await apiClient.delete("/api/quiz/modules/delete", {
    data: { id: moduleId },
  });
  return res.data;
}

export async function deleteModuleCascade(moduleId) {
  const res = await apiClient.delete("/api/quiz/modules/deleteCascade", {
    data: { id: moduleId },
  });
  return res.data;
}

export async function addQuestionToModule(moduleIds, questionId) {
  const res = await apiClient.post("/api/quiz/modules/addQuestion", {
    moduleIds,
    questionId,
  });
  return res.data;
}

export async function removeQuestionFromModule(moduleId, questionId) {
  const res = await apiClient.delete("/api/quiz/modules/removeQuestion", {
    data: { moduleId, questionId },
  });
  return res.data;
}

// ─── Questions ────────────────────────────────────────────────────────────────

/** POST /api/quiz/questionsByModule/ — used by ViewQuestions.jsx */
export async function getQuestionsByModule(moduleId, filters = {}) {
  const res = await apiClient.post(
    "/api/quiz/questionsByModule/",
    // The backend expects the field named `module`, not `moduleId`
    { module: moduleId, ...filters },
  );
  return res.data;
}

/** POST /api/quiz/questions/get — used by ViewAllQuestions.jsx + ViewContextAttachments.jsx */
export async function getAllQuestions(params = {}, body = {}) {
  const res = await apiClient.post("/api/quiz/questions/get", body, {
    params,
  });
  return res.data;
}

/** POST /api/quiz/questions/getById — user-facing next-question fetch in QuizPanel */
export async function getQuestionById(id) {
  const res = await apiClient.post("/api/quiz/questions/getById", { id });
  return res.data;
}

/** POST /api/quiz/questions/getByIdAdmin — admin detail view */
export async function getQuestionByIdAdmin(id) {
  const res = await apiClient.post("/api/quiz/questions/getByIdAdmin", { id });
  return res.data;
}

export async function updateQuestion(data) {
  const res = await apiClient.put("/api/quiz/questions/update", data, {});
  return res.data;
}

/** DELETE /api/quiz/questions/delete — soft delete (moves to trash) */
export async function deleteQuestion(id) {
  const res = await apiClient({
    method: "delete",
    url: "/api/quiz/questions/delete",

    data: { id },
  });
  return res.data;
}

export async function restoreQuestion(id) {
  const res = await apiClient.put("/api/quiz/questions/restore", { id });
  return res.data;
}

export async function deletePermanent(id) {
  const res = await apiClient.delete("/api/quiz/questions/deletePermanent", {
    data: { id },
  });
  return res.data;
}

export async function getQuestionSkills() {
  const res = await apiClient.get("/api/quiz/questions/skills", {});
  return res.data;
}

// ─── Trash ────────────────────────────────────────────────────────────────────

export async function getTrashQuestions() {
  const res = await apiClient.post("/api/quiz/trash/questions", {});
  return res.data;
}

export async function emptyTrash() {
  const res = await apiClient.delete("/api/quiz/trash/questions", {});
  return res.data;
}

// ─── User-facing quiz flow ────────────────────────────────────────────────────

/** POST /api/quiz/modules/progress — returns list with per-user completion status */
export async function getModuleProgress(user) {
  const res = await apiClient.post("/api/quiz/modules/progress", { user });
  return res.data;
}

/** POST /api/quiz/modules/start — fetches first (or current) question for a module */
export async function startQuiz(moduleId) {
  const res = await apiClient.post("/api/quiz/modules/start", { moduleId });
  return res.data;
}

/** POST /api/quiz/submit — grade an answer and advance progress */
export async function submitAnswer(payload) {
  const res = await apiClient.post("/api/quiz/submit", payload, {});
  return res.data;
}

// ─── Module history / admin ───────────────────────────────────────────────────

export async function getModuleAndQuestions(moduleId) {
  const [moduleRes, questionsRes] = await Promise.all([
    apiClient.post(`/api/quiz/modules/getById`, {
      id: moduleId,
    }),
    apiClient.post(`/api/quiz/questionsByModule`, {
      module: moduleId,
    }),
  ]);
  return { module: moduleRes.data.data, questions: questionsRes.data.data };
}

// ─── Sequences ────────────────────────────────────────────────────────────────

export async function getSequenceAndModules(subject, grade) {
  const [seqRes, modulesRes] = await Promise.all([
    apiClient.get(`/api/quiz/sequence/${subject}/${grade}`, {}),
    apiClient.post("/api/quiz/modules/get", {}, { params: { subject, grade } }),
  ]);
  return { sequence: seqRes.data, modules: modulesRes.data };
}

export async function saveSequence(subject, grade, data) {
  const res = await apiClient.put(
    `/api/quiz/sequence/${subject}/${grade}`,
    data,
  );
  return res.data;
}

// ─── User analytics ───────────────────────────────────────────────────────────
// Fixes the sequential waterfall bug in pages/AnalyticsPage.jsx (audit bug #8):
// all five chart endpoints now fire in parallel.

export async function getUserAnalytics(type = "all") {
  const base = "/api/quiz/analytics";
  const [daily, speedAcc, formats, difficulty, skills] = await Promise.all([
    apiClient.get(`${base}/daily`, {
      params: { type },
    }),
    apiClient.get(`${base}/speed-accuracy`, {
      params: { type },
    }),
    apiClient.get(`${base}/formats`, {
      params: { type },
    }),
    apiClient.get(`${base}/difficulty`, {
      params: { type },
    }),
    apiClient.get(`${base}/skills`, {
      params: { type },
    }),
  ]);
  return {
    daily: daily.data.data,
    speedAcc: speedAcc.data.data,
    formats: formats.data.data,
    difficulty: difficulty.data.data,
    skills: skills.data.data,
  };
}

export async function getQuizHistory() {
  const res = await apiClient.get("/api/quiz/history", {});
  return res.data;
}

export async function getMarathonHistory() {
  const res = await apiClient.get("/api/quiz/analytics/marathons", {});
  return res.data;
}
