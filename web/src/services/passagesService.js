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

export async function getPassages(params = {}) {
  const res = await apiClient.get("/api/passages", {
    params,
  });
  return res.data;
}

export async function createPassage(data) {
  const res = await apiClient.post("/api/passages", data, {});
  return res.data;
}

export async function updatePassage(passageId, data) {
  const res = await apiClient.put(`/api/passages/${passageId}`, data, {});
  return res.data;
}

export async function deletePassage(passageId) {
  const res = await apiClient.delete(`/api/passages/${passageId}`, {});
  return res.data;
}

/** POST /api/passages/bulk-sentences — bulk create sentences from pasted text */
export async function bulkCreateSentences(text) {
  const res = await apiClient.post("/api/passages/bulk-sentences", { text });
  return res.data;
}

// ─── Context Attachments ──────────────────────────────────────────────────────

export async function getContextAttachments(params = {}) {
  const res = await apiClient.get("/api/context-attachments", {
    params,
  });
  return res.data;
}

export async function createContextAttachment(data) {
  const res = await apiClient.post("/api/context-attachments", data, {});
  return res.data;
}

export async function updateContextAttachment(contextId, data) {
  const res = await apiClient.put(
    `/api/context-attachments/${contextId}`,
    data,
  );
  return res.data;
}

export async function deleteContextAttachment(contextId) {
  const res = await apiClient.delete(
    `/api/context-attachments/${contextId}`,
    {},
  );
  return res.data;
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export async function getVocabulary(params = {}) {
  const res = await apiClient.get("/api/vocabulary", {
    params,
  });
  return res.data;
}

export async function updateVocabulary(vocabId, data) {
  const res = await apiClient.put(`/api/vocabulary/${vocabId}`, data, {});
  return res.data;
}

export async function deleteVocabulary(vocabId) {
  const res = await apiClient.delete(`/api/vocabulary/${vocabId}`, {});
  return res.data;
}

/** POST /api/vocabulary/bulk — bulk creation from pasted vocabulary list */
export async function createVocabularyBulk(data) {
  const res = await apiClient.post("/api/vocabulary/bulk", data, {});
  return res.data;
}

// ─── Marathon question generation ─────────────────────────────────────────────

/** GET /api/passages/generate/passage|grammar or /api/vocabulary/quiz */
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

/** POST /api/vocabulary/verify — grades a vocabulary quiz answer */
export async function verifyVocabAnswer(payload) {
  const res = await apiClient.post("/api/vocabulary/verify", payload, {});
  return res.data;
}
