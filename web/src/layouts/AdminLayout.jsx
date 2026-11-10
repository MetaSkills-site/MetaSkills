/**
 * FILE PURPOSE: Centralized layout and component registry for the Administrative dashboard.
 * Aggregates all admin-related views into a single object for streamlined imports.
 *
 * DEPENDENCIES:
 * - AdminComponents: Source for all individual administrative UI modules.
 *
 * EXPORTS:
 * - Admin (default): Object containing all admin view components.
 * - All components from '../components/AdminComponents' (re-exported).
 *
 * INTERCONNECT:
 * - Consumed by the main router to render various admin panels like 'ViewUsers', 'Analytics', and 'AddQuestions'.
 */

import {
  Dashboard,
  AddQuestions,
  ViewModules,
  ViewQuestions,
  ViewUsers,
  AnalyticsPage,
  TrashQuestions,
  ManageNotifications,
  ViewModulesAndQuestions,
  ViewAllQuestions,
  ActiveSessions,
} from "../components/AdminComponents";

/**
 * Admin: Namespace object grouping administrative modules.
 */
const AdminLayout = {
  Dashboard,
  AddQuestions,
  ViewModules,
  ViewQuestions,
  ViewUsers,
  AnalyticsPage,
  TrashQuestions,
  ManageNotifications,
  ViewModulesAndQuestions,
  ViewAllQuestions,
  ActiveSessions,
};

// Re-export individual components for flexible import options
export * from "../components/admin/AdminDashboardView";
export default AdminLayout;
