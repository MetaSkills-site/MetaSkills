/**
 * @file ProtectedAdminRoute.jsx
 * @description Provides a route guard for administrator access, ensuring users are authenticated and have the 'admin' role.
 *
 * Dependencies:
 * - react-router-dom: Used for Navigation and Outlet (routing).
 * - ./AdminAuthProvider: Context provider and hook for admin authentication state.
 * - ../Splash: Loading indicator component.
 *
 * Exports:
 * - ProtectedAdminRoute (default): The main wrapper component for admin-protected routes.
 *
 * Interconnections:
 * - This component is used in the main application routing to wrap any page that requires admin privileges.
 */

import { Navigate, Outlet } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuthProvider";
import SplashPage from "../../pages/SplashPage";

/**
 * AdminAuthGuard Component
 * @description Handles the logic of checking authentication status and role-based access.
 * @param {Object} props - React props containing children elements.
 * @returns {JSX.Element} The requested component or a redirect to the login page.
 */
const AdminAuthGuard = ({ children }) => {
  const { adminUser, isLoading } = useAdminAuth();

  // Show a loading splash screen while the authentication state is being determined.
  if (isLoading) {
    return <SplashPage />;
  }

  // Redirect to the admin login page if no user is found, no token is present, or the role is not 'admin'.
  if (!adminUser || adminUser.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  // Render children (if provided) or the matched nested route via <Outlet />.
  return children ? children : <Outlet />;
};

/**
 * ProtectedAdminRoute Component
 * @description Wraps the guard component within the AdminAuthProvider to provide access to auth context.
 * @param {Object} props - React props containing children elements.
 */
export default function ProtectedAdminRoute({ children }) {
  // Wrap the functionality in the provider so it has access to the authentication context.
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </AdminAuthProvider>
  );
}
