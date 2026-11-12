/**
 * @file quizService.js
 * @description API service managing educational modules, question bank CRUD, trash recycling, student quiz progress, and analytics telemetry.
 * @architecture Central educational domain service facilitating learner quiz flows and administrator curriculum authoring via apiClient.
 * @agent_note Notice subtle parameter conventions (e.g. backend expecting { module: moduleId } instead of { moduleId } in getQuestionsByModule).
 */

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

/**
 * Fetches modules matching query params and body filters.
 *
 * @param {Object} [params={}] - Query parameters.
 * @param {Object} [body={}] - Request body filter options.
 * @returns {Promise<Object>} Modules list response.
 */
export async function getModules(params = {}, body = {}) {
  const res = await apiClient.post("/api/quiz/modules/get", body, {
    params,
  });
  return res.data;
}

/**
 * Retrieves a single module by ID.
 *
 * @param {string} moduleId - ID of the module.
 * @returns {Promise<Object>} Module details response.
 */
export async function getModuleById(moduleId) {
  const res = await apiClient.post(`/api/quiz/modules/getById`, {
    id: moduleId,
  });
  return res.data;
}

/**
 * Updates module metadata.
 *
 * @param {Object} data - Updated module properties.
 * @returns {Promise<Object>} Updated module response.
 */
export async function updateModule(data) {
  const res = await apiClient.put("/api/quiz/modules/update", data, {});
  return res.data;
}

/**
 * Deletes a module.
 *
 * @param {string} moduleId - ID of the module to delete.
 * @returns {Promise<Object>} Deletion result.
 */
export async function deleteModule(moduleId) {
  const res = await apiClient.delete("/api/quiz/modules/delete", {
    data: { id: moduleId },
  });
  return res.data;
}

/**
 * Deletes a module and cascades deletion to linked associations.
 *
 * @param {string} moduleId - ID of the module to cascade delete.
 * @returns {Promise<Object>} Cascade deletion result.
 */
export async function deleteModuleCascade(moduleId) {
  const res = await apiClient.delete("/api/quiz/modules/deleteCascade", {
    data: { id: moduleId },
  });
  return res.data;
}

/**
 * Links a question to one or more modules.
 *
 * @param {Array<string>} moduleIds - Target module IDs.
 * @param {string} questionId - ID of question to add.
 * @returns {Promise<Object>} Assignment confirmation.
 */
export async function addQuestionToModule(moduleIds, questionId) {
  const res = await apiClient.post("/api/quiz/modules/addQuestion", {
    moduleIds,
    questionId,
  });
  return res.data;
}

/**
 * Unlinks a question from a module.
 *
 * @param {string} moduleId - Source module ID.
 * @param {string} questionId - ID of question to remove.
 * @returns {Promise<Object>} Removal confirmation.
 */
export async function removeQuestionFromModule(moduleId, questionId) {
  const res = await apiClient.delete("/api/quiz/modules/removeQuestion", {
    data: { moduleId, questionId },
  });
  return res.data;
}

// ─── Questions ────────────────────────────────────────────────────────────────

/**
 * Retrieves questions associated with a given module.
 *
 * @param {string} moduleId - Module identifier.
 * @param {Object} [filters={}] - Additional question filters.
 * @returns {Promise<Object>} Questions in the specified module.
 */
export async function getQuestionsByModule(moduleId, filters = {}) {
  const res = await apiClient.post(
    "/api/quiz/questionsByModule/",
    // The backend expects the field named `module`, not `moduleId`
    { module: moduleId, ...filters },
  );
  return res.data;
}

/**
 * Fetches all questions across the system with pagination and filters.
 *
 * @param {Object} [params={}] - Query string parameters.
 * @param {Object} [body={}] - Body filter criteria.
 * @returns {Promise<Object>} Filtered list of all questions.
 */
export async function getAllQuestions(params = {}, body = {}) {
  const res = await apiClient.post("/api/quiz/questions/get", body, {
    params,
  });
  return res.data;
}

/**
 * Fetches a single question by ID for learner attempts.
 *
 * @param {string} id - Question ID.
 * @returns {Promise<Object>} Question data for learner attempt.
 */
export async function getQuestionById(id) {
  const res = await apiClient.post("/api/quiz/questions/getById", { id });
  return res.data;
}

/**
 * Fetches question details with administrative context.
 *
 * @param {string} id - Question ID.
 * @returns {Promise<Object>} Detailed question data for admin view.
 */
export async function getQuestionByIdAdmin(id) {
  const res = await apiClient.post("/api/quiz/questions/getByIdAdmin", { id });
  return res.data;
}

/**
 * Updates question fields.
 *
 * @param {Object} data - Updated question data.
 * @returns {Promise<Object>} Updated question response.
 */
export async function updateQuestion(data) {
  const res = await apiClient.put("/api/quiz/questions/update", data, {});
  return res.data;
}

/**
 * Soft-deletes a question by moving it to the trash bin.
 *
 * @param {string} id - Question ID to soft-delete.
 * @returns {Promise<Object>} Deletion confirmation.
 */
export async function deleteQuestion(id) {
  const res = await apiClient({
    method: "delete",
    url: "/api/quiz/questions/delete",

    data: { id },
  });
  return res.data;
}

/**
 * Restores a soft-deleted question from the trash bin.
 *
 * @param {string} id - Question ID to restore.
 * @returns {Promise<Object>} Restoration confirmation.
 */
export async function restoreQuestion(id) {
  const res = await apiClient.put("/api/quiz/questions/restore", { id });
  return res.data;
}

/**
 * Permanently deletes a question from the database.
 *
 * @param {string} id - Question ID to permanently purge.
 * @returns {Promise<Object>} Purge confirmation.
 */
export async function deletePermanent(id) {
  const res = await apiClient.delete("/api/quiz/questions/deletePermanent", {
    data: { id },
  });
  return res.data;
}

/**
 * Fetches the taxonomy list of question skills.
 *
 * @returns {Promise<Object>} Available skill taxonomy categories.
 */
export async function getQuestionSkills() {
  const res = await apiClient.get("/api/quiz/questions/skills", {});
  return res.data;
}

// ─── Trash ────────────────────────────────────────────────────────────────────

/**
 * Retrieves all questions currently in the trash bin.
 *
 * @returns {Promise<Object>} Questions currently in the trash bin.
 */
export async function getTrashQuestions() {
  const res = await apiClient.post("/api/quiz/trash/questions", {});
  return res.data;
}

/**
 * Permanently empties all questions in the trash bin.
 *
 * @returns {Promise<Object>} Result of emptying trash.
 */
export async function emptyTrash() {
  const res = await apiClient.delete("/api/quiz/trash/questions", {});
  return res.data;
}

// ─── User-facing quiz flow ────────────────────────────────────────────────────

/**
 * Retrieves per-user completion status across modules.
 *
 * @param {string|Object} user - User identifier or payload.
 * @returns {Promise<Object>} Module progress records.
 */
export async function getModuleProgress(user) {
  const res = await apiClient.post("/api/quiz/modules/progress", { user });
  return res.data;
}

/**
 * Starts a quiz session or fetches the active question for a module.
 *
 * @param {string} moduleId - ID of the module to start.
 * @returns {Promise<Object>} Quiz session starting question and progress data.
 */
export async function startQuiz(moduleId) {
  const res = await apiClient.post("/api/quiz/modules/start", { moduleId });
  return res.data;
}

/**
 * Submits an answer to be evaluated against the question solution.
 *
 * @param {Object} payload - User submission payload with answer, time, and module ID.
 * @returns {Promise<Object>} Grading outcome, carrots awarded, and next question details.
 */
export async function submitAnswer(payload) {
  const res = await apiClient.post("/api/quiz/submit", payload, {});
  return res.data;
}

// ─── Module history / admin ───────────────────────────────────────────────────

/**
 * Concurrently fetches module metadata and its assigned questions.
 *
 * @param {string} moduleId - Module identifier.
 * @returns {Promise<{module: Object, questions: Array}>} Module details and list of questions.
 */
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

/**
 * Retrieves the module progression sequence and available modules for a subject and grade.
 *
 * @param {string} subject - Subject identifier.
 * @param {string|number} grade - Target grade level.
 * @returns {Promise<{sequence: Object, modules: Object}>} Sequence and module catalog.
 */
export async function getSequenceAndModules(subject, grade) {
  const [seqRes, modulesRes] = await Promise.all([
    apiClient.get(`/api/quiz/sequence/${subject}/${grade}`, {}),
    apiClient.post("/api/quiz/modules/get", {}, { params: { subject, grade } }),
  ]);
  return { sequence: seqRes.data, modules: modulesRes.data };
}

/**
 * Persists an ordered curriculum module sequence.
 *
 * @param {string} subject - Subject identifier.
 * @param {string|number} grade - Grade level.
 * @param {Object} data - Updated module sequence data.
 * @returns {Promise<Object>} Saved sequence response.
 */
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

/**
 * Concurrently fetches all five user analytics chart endpoints.
 *
 * @param {string} [type="all"] - Timeframe or subject filter type.
 * @returns {Promise<{daily: Object, speedAcc: Object, formats: Object, difficulty: Object, skills: Object}>} Aggregated analytics dataset.
 */
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

/**
 * Retrieves historic quiz attempt records for the logged-in user.
 *
 * @returns {Promise<Object>} User's quiz attempt history.
 */
export async function getQuizHistory() {
  const res = await apiClient.get("/api/quiz/history", {});
  return res.data;
}

/**
 * Retrieves historical performance data for marathon quiz attempts.
 *
 * @returns {Promise<Object>} Marathon analytics and history records.
 */
export async function getMarathonHistory() {
  const res = await apiClient.get("/api/quiz/analytics/marathons", {});
  return res.data;
}
