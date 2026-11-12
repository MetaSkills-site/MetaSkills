/**
 * @file passagesService.js
 * @description API service for managing reading comprehension passages, context attachments, vocabulary items, and marathon question generation.
 * @architecture Content management domain service communicating with backend passage, context, and vocabulary endpoints for study modules and marathons.
 * @agent_note Supports both standard CRUD operations and bulk text parsing endpoints (bulkCreateSentences, createVocabularyBulk).
 */

/**
 * FILE PURPOSE: Service layer for managing reading passages, vocabulary, and context attachments.
 * Provides CRUD operations for educational content and utilities for Marathon quiz generation.
 *
 * DEPENDENCIES:
 * - api.js: Pre-configured axios instance and auth helpers.
 *
 * EXPORTS:
 * - Passages: getPassages, createPassage, updatePassage, deletePassage, bulkCreateSentences
 * - Context Attachments: getContextAttachments, createContextAttachment, etc.
 * - Vocabulary: getVocabulary, updateVocabulary, deleteVocabulary, createVocabularyBulk
 * - Marathon Logic: generateMarathonQuestion, verifyVocabAnswer
 *
 * INTERCONNECT:
 * - Consumed by content management views (ViewPassages, ViewContextAttachments).
 * - Core dependency for Marathon quiz modules to fetch dynamic content.
 */

import apiClient from "./api";

// ─── Passages ─────────────────────────────────────────────────────────────────

/**
 * Retrieves a list of reading passages.
 *
 * @param {Object} [params={}] - Query parameters for filtering and pagination.
 * @returns {Promise<Object>} Passages list response.
 */
export async function getPassages(params = {}) {
  const res = await apiClient.get("/api/passages", {
    params,
  });
  return res.data;
}

/**
 * Creates a new reading passage.
 *
 * @param {Object} data - Passage payload object.
 * @returns {Promise<Object>} Created passage response.
 */
export async function createPassage(data) {
  const res = await apiClient.post("/api/passages", data, {});
  return res.data;
}

/**
 * Updates an existing reading passage.
 *
 * @param {string} passageId - Unique ID of the passage.
 * @param {Object} data - Updated passage fields.
 * @returns {Promise<Object>} Updated passage response.
 */
export async function updatePassage(passageId, data) {
  const res = await apiClient.put(`/api/passages/${passageId}`, data, {});
  return res.data;
}

/**
 * Deletes a reading passage.
 *
 * @param {string} passageId - ID of passage to delete.
 * @returns {Promise<Object>} Deletion result confirmation.
 */
export async function deletePassage(passageId) {
  const res = await apiClient.delete(`/api/passages/${passageId}`, {});
  return res.data;
}

/**
 * Bulk creates sentences from pasted text.
 *
 * @param {string} text - Raw input text containing sentences.
 * @returns {Promise<Object>} Bulk creation response.
 */
export async function bulkCreateSentences(text) {
  const res = await apiClient.post("/api/passages/bulk-sentences", { text });
  return res.data;
}

// ─── Context Attachments ──────────────────────────────────────────────────────

/**
 * Retrieves a list of context attachments.
 *
 * @param {Object} [params={}] - Query parameters for filtering context items.
 * @returns {Promise<Object>} Context attachments list.
 */
export async function getContextAttachments(params = {}) {
  const res = await apiClient.get("/api/context-attachments", {
    params,
  });
  return res.data;
}

/**
 * Creates a new context attachment.
 *
 * @param {Object} data - Context attachment payload.
 * @returns {Promise<Object>} Created context attachment.
 */
export async function createContextAttachment(data) {
  const res = await apiClient.post("/api/context-attachments", data, {});
  return res.data;
}

/**
 * Updates an existing context attachment.
 *
 * @param {string} contextId - ID of context attachment to update.
 * @param {Object} data - Updated fields.
 * @returns {Promise<Object>} Updated context attachment.
 */
export async function updateContextAttachment(contextId, data) {
  const res = await apiClient.put(
    `/api/context-attachments/${contextId}`,
    data,
  );
  return res.data;
}

/**
 * Deletes a context attachment.
 *
 * @param {string} contextId - ID of context attachment to delete.
 * @returns {Promise<Object>} Deletion confirmation.
 */
export async function deleteContextAttachment(contextId) {
  const res = await apiClient.delete(
    `/api/context-attachments/${contextId}`,
    {},
  );
  return res.data;
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

/**
 * Retrieves vocabulary entries.
 *
 * @param {Object} [params={}] - Filter and pagination query parameters.
 * @returns {Promise<Object>} Vocabulary list.
 */
export async function getVocabulary(params = {}) {
  const res = await apiClient.get("/api/vocabulary", {
    params,
  });
  return res.data;
}

/**
 * Updates a vocabulary word entry.
 *
 * @param {string} vocabId - Unique ID of the vocabulary word.
 * @param {Object} data - Updated vocabulary fields.
 * @returns {Promise<Object>} Updated vocabulary item.
 */
export async function updateVocabulary(vocabId, data) {
  const res = await apiClient.put(`/api/vocabulary/${vocabId}`, data, {});
  return res.data;
}

/**
 * Deletes a vocabulary entry.
 *
 * @param {string} vocabId - ID of vocabulary word to delete.
 * @returns {Promise<Object>} Deletion confirmation.
 */
export async function deleteVocabulary(vocabId) {
  const res = await apiClient.delete(`/api/vocabulary/${vocabId}`, {});
  return res.data;
}

/**
 * Bulk creates vocabulary entries from structured data.
 *
 * @param {Object} data - Payload containing list of vocabulary words.
 * @returns {Promise<Object>} Bulk creation results.
 */
export async function createVocabularyBulk(data) {
  const res = await apiClient.post("/api/vocabulary/bulk", data, {});
  return res.data;
}

// ─── Marathon question generation ─────────────────────────────────────────────

/**
 * Generates dynamic questions for marathon quiz modes based on subcategory.
 *
 * @param {string} subCategory - Sub-category of marathon question ('grammar', 'vocabulary', or other for passage).
 * @returns {Promise<Object>} Generated question object.
 */
export async function generateMarathonQuestion(subCategory) {
  let url;
  if (subCategory === "grammar") {
    url = "/api/passages/generate/grammar";
  } else if (subCategory === "vocabulary") {
    url = "/api/vocabulary/quiz";
  } else {
    url = "/api/passages/generate/passage";
  }
  const res = await apiClient.get(url);
  return res.data;
}

/**
 * Submits and verifies a user answer for vocabulary quizzes.
 *
 * @param {Object} payload - Answer submission verification payload.
 * @returns {Promise<Object>} Grading and verification result.
 */
export async function verifyVocabAnswer(payload) {
  const res = await apiClient.post("/api/vocabulary/verify", payload, {});
  return res.data;
}
