/**
 * @file ProtectedRoute.jsx
 * @description Route guard enforcing user authentication, session token validity, and academic grade profile completion.
 * @architecture Client-side routing layer guard protecting private application routes and nested layouts.
 * @agent_note Displays SplashPage during session loading and redirects incomplete profiles to `/auth/complete-profile`.
 */

/**
 * FILE PURPOSE: ProtectedRoute — A structural component for enforcing authentication and profile completion.
 *
 * ROLE:
 * Wraps routes that require an active user session. It performs three levels of checks:
 * 1. Authentication: Redirects to /auth if no user object exists.
 * 2. Token Validity: Ensures the user has a valid session token.
 * 3. Profile Completion: Enforces that the user has selected a valid academic grade (1-12)
 *    before allowing access to learning modules.
 *
 * DEPENDENCIES:
 * - SessionContext: Source of truth for current user state and loading status.
 * - react-router-dom: Navigate, Outlet, and useLocation for redirection and nested routing.
 * - Splash: Full-screen loading indicator used during the initial session hydration.
 *
 * EXPORTS:
 * - ProtectedRoute (default): The functional wrapper for secure routes.
 *
 * INTERCONNECTIONS:
 * - The primary gatekeeper in App.jsx for Dashboard, Modules, and Analytics paths.
 */
import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { SessionContext } from "../context/SessionProvider";
import SplashPage from "../pages/SplashPage";

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} [props.children] - Child elements to render when authentication and profile checks pass.
 * @returns {JSX.Element} The rendered child routes/Outlet or navigation redirect element.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(SessionContext);
  const location = useLocation();

  /**
   * INITIAL LOADING STATE
   * While the SessionContext is fetching/validating the local token,
   * we show a Splash screen to prevent unauthorized "flickers" of protected UI.
   */
  if (loading) {
    return <SplashPage />;
  }

  /* ─── Level 1 & 2: Authentication Check ─── */
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  /* ─── Level 3: Profile Completion Check ─── */
  // Academic grade is mandatory for personalizing curriculum content.
  const hasValidGrade =
    user.grade &&
    typeof user.grade === "number" &&
    user.grade >= 1 &&
    user.grade <= 12;

  // REDIRECTION LOGIC:
  // If the profile is incomplete, force the user to the profile-completion page.
  // Exception: If they are already on the completion page, do not redirect (prevents infinite loops).
  if (!hasValidGrade && location.pathname !== "/auth/complete-profile") {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  // If all checks pass, render the protected children or the nested route Outlet.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
