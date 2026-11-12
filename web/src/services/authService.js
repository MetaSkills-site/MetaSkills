/**
 * @file authService.js
 * @description Authentication and user profile service handling current profile retrieval and server-side session termination.
 * @architecture Client authentication interface coordinating with backend user endpoints and consumed by SessionProvider.
 * @agent_note Token header injection is handled automatically by apiClient interceptors and cookies.
 */

/**
 * FILE PURPOSE: Interface for user authentication and profile management services.
 * Handles user profile retrieval and session termination.
 *
 * DEPENDENCIES:
 * - api.js: Pre-configured axios instance and auth helpers.
 *
 * EXPORTS:
 * - getProfile: Fetches user profile data (e.g., name, email, roles).
 * - logoutSession: Terminates a specific user session on the backend.
 *
 * INTERCONNECT:
 * - Core dependency for SessionProvider to manage user login state.
 * - Used by Logout components and profile dashboards.
 */

import apiClient from "./api";

/**
 * Fetches the complete profile information for the currently authenticated user.
 *
 * @returns {Promise<Object>} User profile data object.
 */
export async function getProfile() {
  const res = await apiClient.get("/api/users/getProfile", {});
  return res.data;
}

/**
 * Terminates the server-side session for a given user.
 *
 * @param {string} userId - The unique identifier of the user to logout.
 * @returns {Promise<Object>} Response confirmation of session deletion.
 */
export async function logoutSession(userId) {
  const res = await apiClient.post("/api/users/deleteSession", { id: userId });
  return res.data;
}
