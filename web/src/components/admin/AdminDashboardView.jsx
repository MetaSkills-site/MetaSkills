/**
 * @file AdminDashboardView.jsx
 * @description Centralized barrel export aggregating admin views, context providers, shared styles, and utility helpers.
 * @architecture Serves as an aggregation barrel for the administrative subsystem, organizing admin routing dependencies.
 * @agent_note When modifying admin route exports or adding new admin modules, update the corresponding re-exports here.
 */

/**
 * FILE PURPOSE: AdminComponents — A centralized barrel export for administrative UI components.
 *
 * ROLE:
 * Consolidates all admin-related views, contexts, and styles into a single entry point.
 * This simplifies imports in the main App router and helps maintain a clean architecture
 * for the administrative section of the platform.
 *
 * DEPENDENCIES:
 * - admin/*: Specific administrative views (Dashboard, Users, Questions, etc.).
 * - ModuleContext: For shared module-specific state management in the admin flow.
 * - SkeletonLoader: Shared loading primitives.
 *
 * EXPORTS:
 * - All primary admin pages (ViewModules, AddQuestions, Analytics, etc.).
 * - ModuleProvider/useModule: Context hooks for admin module management.
 * - AdminStyles/AdminUtils: Utility and styling shared across admin pages.
 *
 * INTERCONNECTIONS:
 * - The primary source for all components rendered within the /admin route hierarchy.
 */

/* ─── Page Components ─── */
export { default as Dashboard } from "../../pages/admin/AdminDashboardPage";
export { default as ViewModules } from "../../pages/admin/ModulesViewPage";
export { default as ViewQuestions } from "../../pages/admin/QuestionsViewPage";
export { default as ViewUsers } from "../../pages/admin/UsersViewPage";
export { default as AddQuestions } from "../../pages/admin/QuestionEntryPage";
export { default as AnalyticsPage } from "../../pages/admin/AdminAnalyticsPage";
export { default as TrashQuestions } from "../../pages/admin/TrashQuestionsPage";
export { default as ManageNotifications } from "../../pages/admin/NotificationsManagementPage";
export { default as ViewModulesAndQuestions } from "../../pages/admin/ModulesQuestionsViewPage";
export { default as ViewAllQuestions } from "../../pages/admin/AllQuestionsViewPage";
export { default as ActiveSessions } from "../../pages/admin/ActiveSessionsPage";

/* ─── State Management ─── */
export { ModuleProvider, useModule } from "../../context/ModuleContext";

/* ─── Styles & Utilities ─── */
export * from "./AdminStyles";
export * from "../../utils/adminUtils";

/* ─── Shared Components ─── */
export * from "../SkeletonLoader";
