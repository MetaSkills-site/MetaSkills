/**
 * FILE PURPOSE: Service for managing user-specific metrics and data.
 * Currently focuses on fetching user achievement data (e.g., carrots).
 *
 * DEPENDENCIES:
 * - api.js: Pre-configured axios instance and auth helpers.
 *
 * EXPORTS:
 * - getCarrots: Fetches the 'carrots' count for the current user.
 *
 * INTERCONNECT:
 * - Consumed by HeaderGreeting and Dashboard components to display user stats.
 */

import apiClient from "./api";

/**
 * Fetches the current carrot count (achievement metric) for the authenticated user.
 *
 * @param {string} token - JWT authentication token.
 * @returns {Promise<Object>} Response containing carrot data.
 */
export async function getCarrots() {
  const res = await apiClient.get("/api/users/carrots", {});
  return res.data;
}
