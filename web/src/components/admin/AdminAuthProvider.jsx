/**
 * @file AdminAuthProvider.jsx
 * @description Context provider and hook for managing administrative authentication state, session validation, and JWT token persistence.
 * @architecture Security and auth state layer wrapping administrative routes, integrating TanStack Query for session caching.
 * @agent_note Modifying session validation or cookie-based check queries impacts route access control across the entire /admin subtree.
 */

/**
 * FILE: AdminAuthProvider.jsx
 * PURPOSE: Context provider for managing administrative authentication state, session validation, and JWT token persistence.
 * DEPENDENCIES:
 *   - useQuery: TanStack Query hook for efficient session validation.
 *   - jwt-decode: For decoding JWT tokens to extract admin user metadata.
 *   - adminService: API service for session checking.
 * EXPORTS:
 *   - AdminAuthProvider: Context provider component.
 *   - useAdminAuth: Custom hook to consume admin auth context.
 * INTERCONNECTIONS: Wraps the administrative routes to ensure only authenticated admins can access protected resources.
 */

import { createContext, useContext, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { checkAdminSession } from "../../services/adminService";

// Create context for administrative authentication
const AdminAuthContext = createContext(null);

/**
 * Context provider component for admin authentication state and actions.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements requiring admin context.
 * @returns {JSX.Element} Provider wrapping child elements with AdminAuthContext.
 */
export const AdminAuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Cleanup old legacy localStorage if present
    localStorage.removeItem("adminUser");
  }, []);

  /**
   * TanStack Query for validating the admin session with the backend via cookies.
   * Caches results and manages re-validation logic.
   */
  const {
    data: adminUser,
    isLoading,
    error,
    status,
  } = useQuery({
    queryKey: ["adminCheck"],
    queryFn: async () => {
      // Verify session with backend using cookies (withCredentials)
      const data = await checkAdminSession();
      // Fetch CSRF token for subsequent POST requests
      try {
        const { fetchCsrfToken } = await import("../../services/api");
        await fetchCsrfToken();
      } catch (csrfError) {
        console.error("Admin CSRF initialization failed:", csrfError);
      }
      return data.user || data;
    },
    staleTime: 5 * 60_000, // Session considered fresh for 5 minutes
    retry: false, // Do not retry on auth failure
  });

  const authenticated = !!adminUser && status !== "error";

  /**
   * Global side-effect for handling authentication errors (401/403).
   * Automatically logs out the admin if the session is invalid.
   */
  useEffect(() => {
    if (!error || status !== "error") return;
    console.error("Admin auth check failed:", error);
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.warn("Token invalid or expired. Logging out admin.");
      // The query will cache the error state, so adminUser will be undefined
      localStorage.removeItem("adminUser");
    } else {
      // Handle non-auth errors (e.g., network issues) as transient
      console.warn(
        "Auth check failed due to network/server error. Keeping session.",
      );
    }
  }, [error, status]);

  /**
   * Manually trigger a re-validation of the admin session.
   */
  const checkAuth = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminCheck"] });
  }, [queryClient]);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isLoading,
        loading: isLoading,
        authenticated,
        checkAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

/**
 * Hook for consuming administrative authentication state and actions.
 *
 * @function useAdminAuth
 * @returns {Object} Context value containing adminUser, loading state, authenticated flag, and checkAuth callback.
 */
export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};
