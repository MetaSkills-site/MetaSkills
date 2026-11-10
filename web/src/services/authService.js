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
 * @param {string} token - JWT authentication token.
 * @returns {Promise<Object>} User profile data object.
 */
export async function getProfile() {
  const res = await apiClient.get("/api/users/getProfile", {});
  return res.data;
}

/**
 * Terminates the server-side session for a given user.
 *
 * @param {string} token - JWT authentication token.
 * @param {string} userId - The unique identifier of the user to logout.
 * @returns {Promise<Object>} Response confirmation of session deletion.
 */
export async function logoutSession(userId) {
  const res = await apiClient.post("/api/users/deleteSession", { id: userId });
  return res.data;
}
