/**
 * @file AuthGuard.jsx
 * @description Protects client routes by redirecting unauthenticated users to the authentication page based on active session context.
 * @architecture Routing layer wrapper component that secures private page hierarchies within the React Router tree.
 * @agent_note Guard evaluates user session and loading state; do not render UI while session initialization is in progress.
 */

/**
 * FILE PURPOSE: Top-level authentication guard and route redirection logic.
 * Ensures that protected routes are only accessible with a valid session token.
 *
 * DEPENDENCIES:
 * - react-router-dom: Outlet for child routes, Navigate for redirection.
 *
 * EXPORTS:
 * - AuthGuard (default): Functional component acting as an Auth provider wrapper.
 *
 * INTERCONNECT:
 * - Consumed by the router to wrap private user pages like Dashboard and Analytics.
 * - Redirects unauthenticated users to the "/auth" path.
 */

import { useContext } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { SessionContext } from "../context/SessionProvider";

/**
 * @component
 * @returns {JSX.Element|null} Outlet for nested authenticated routes, Navigate redirect to /auth, or null while loading.
 */
export default function AuthGuard() {
  const session = useContext(SessionContext);

  if (!session) return <Navigate to="/auth" />;

  const { user, loading } = session;

  if (loading) return null; // SessionProvider handles the splash screen

  // Guard clause: redirect to Auth layout if session is missing
  if (!user) return <Navigate to="/auth" />;

  // Render child routes if authentication is confirmed
  return <Outlet />;
}
