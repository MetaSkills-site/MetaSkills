/**
 * @file userService.js
 * @description User-specific account and gamification data service managing achievement metrics such as carrots.
 * @architecture Client-side user domain service coordinating with user endpoints via apiClient for gamification and progress displays.
 * @agent_note Token header injection is managed automatically by apiClient; ensure return schema matches backend carrots field.
 */

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
 * @returns {Promise<Object>} Response containing carrot data.
 */
export async function getCarrots() {
  const res = await apiClient.get("/api/users/carrots", {});
  return res.data;
}
