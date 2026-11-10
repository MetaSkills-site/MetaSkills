/**
/**
 * @file SessionProvider.jsx
 * @description Manages the application's authentication lifecycle, user session state, and global routing guards.
 * It handles JWT storage, profile validation, tab synchronization, and global HTTP 401 interceptors.
 *
 * @dependencies
 * - @react-oauth/google: For managing Google logout.
 * - react: For context, state, and memoization hooks.
 * - react-router-dom: For navigation and route location tracking.
 * - jwt-decode: For parsing user data from JWT tokens.
 * - authService: API services for profile fetching and logout.
 * - axios: For handling image conversions and setting up global interceptors.
 *
 * @exports SessionContext, default SessionProvider
 * @interconnections Wraps the entire application in main.jsx. Injected with an axios interceptor for security.
 */

import { googleLogout } from "@react-oauth/google";
import {
  createContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import SplashPage from "../pages/SplashPage";
import { getProfile, logoutSession } from "../services/authService";

export const SessionContext = createContext(null);

export default function SessionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  /**
   * Helper to convert an external image URL to Base64 data.
   * Prevents CORS issues and allows for offline storage of profile pictures.
   *
   * @param {string} url - The URL of the image to fetch.
   */
  const fetchImageAsBase64 = async (url) => {
    if (!url || url.startsWith("data:")) return url;
    try {
      const response = await apiClient.get(url, {
        responseType: "blob",
        skipAuth: true,
      });
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => {
          console.error("FileReader failed");
          resolve(null); // Fallback gracefully if FileReader fails
        };
        reader.readAsDataURL(response.data);
      });
    } catch (error) {
      console.error("Error fetching profile image:", error);
      return null;
    }
  };

  /**
   * Terminates the current session.
   * Calls the backend logout API, clears local storage, and redirects to the login page.
   */
  const logoutCleanup = useCallback(() => {
    googleLogout();
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    const bc = new BroadcastChannel("auth_sync");
    bc.postMessage({ type: "LOGOUT" });
    bc.close();
    navigate("/auth");
  }, [navigate]);

  const logout = useCallback(async () => {
    if (user) {
      try {
        await toast.promise(logoutSession(null, user._id || null), {
          loading: "Logging out...",
          success: "Logged out successfully",
          error: "Logout failed",
        });
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }
    logoutCleanup();
  }, [user, logoutCleanup]);

  // Effect 1: Initial Hydration & Profile Fetching
  // Runs only once on mount to establish the session.
  useEffect(() => {
    const hydrateSession = async () => {
      try {
        // Fetch latest profile data from backend. Cookies will be sent automatically.
        const responseData = await getProfile();

        let currentUserData = responseData.user || responseData;

        if (!currentUserData) {
          throw new Error("Invalid profile response");
        }

        // Fetch image if needed
        if (
          currentUserData.profilePicture &&
          !currentUserData.profileImageData
        ) {
          const imageData = await fetchImageAsBase64(
            currentUserData.profilePicture,
          );
          currentUserData.profileImageData = imageData;
        }

        // Fetch CSRF token for subsequent POST requests
        try {
          const { fetchCsrfToken } = await import("../services/api");
          await fetchCsrfToken();
        } catch (csrfErr) {
          console.error("CSRF initialization failed:", csrfErr);
          toast.error(
            "Security initialization failed. Please refresh the page.",
          );
          throw csrfErr;
        }

        setUser(currentUserData);
      } catch (err) {
        console.error(
          "Session validation error (likely unauthenticated):",
          err,
        );
        if (user) setUser(null);

        // Only redirect if they are trying to access protected content
        if (
          !location.pathname.startsWith("/auth") &&
          location.pathname !== "/"
        ) {
          if (
            err.response?.status === 401 ||
            err.message === "Invalid profile response"
          ) {
            toast.error("Session expired. Please login again.");
          }
          navigate("/auth");
        }
      } finally {
        setLoading(false);
      }
    };

    hydrateSession();
  }, []); // Run only on mount

  // Effect 2: Route Guards
  // Enforces navigation logic based on user state and current location.
  useEffect(() => {
    if (loading) return; // Wait until hydration is complete

    const hasValidGrade =
      user?.grade &&
      typeof user.grade === "number" &&
      user.grade >= 1 &&
      user.grade <= 12;

    if (location.pathname === "/auth" || location.pathname === "/") {
      if (user && hasValidGrade) {
        navigate("/dashboard");
      } else if (user && !hasValidGrade) {
        navigate("/auth/complete-profile");
      }
    } else if (user) {
      if (!hasValidGrade && location.pathname !== "/auth/complete-profile") {
        navigate("/auth/complete-profile");
      } else if (
        hasValidGrade &&
        location.pathname === "/auth/complete-profile"
      ) {
        navigate("/dashboard");
      }
    }
  }, [location.pathname, user, loading, navigate]);

  // Listen for broadcast events to synchronize session state across multiple browser tabs
  useEffect(() => {
    const bc = new BroadcastChannel("auth_sync");
    bc.onmessage = (event) => {
      if (event.data.type === "LOGOUT") {
        console.log("Synced logout from another tab");
        setUser(null);
        navigate("/auth");
      } else if (event.data.type === "LOGIN") {
        console.log("Synced login from another tab, rehydrating session");
        window.location.reload();
      }
    };
    return () => bc.close();
  }, [navigate]);

  /**
   * Initializes a new session.
   * Decodes the JWT, fetches the profile image, and redirects the user.
   */
  const login = useCallback(
    async (response) => {
      setLoading(true);

      try {
        let userData = response.user || response;

        if (!userData) {
          throw new Error("Invalid profile response");
        }

        if (userData.profilePicture && !userData.profileImageData) {
          const imageData = await fetchImageAsBase64(userData.profilePicture);
          userData.profileImageData = imageData;
        }

        localStorage.removeItem("authToken"); // Clean up old localStorage
        localStorage.removeItem("user");
        setUser(userData);

        const bc = new BroadcastChannel("auth_sync");
        bc.postMessage({ type: "LOGIN" });
        bc.close();

        const hasValidGrade =
          userData.grade &&
          typeof userData.grade === "number" &&
          userData.grade >= 1 &&
          userData.grade <= 12;

        try {
          const { fetchCsrfToken } = await import("../services/api");
          await fetchCsrfToken();
        } catch (csrfErr) {
          console.error("CSRF initialization failed during login:", csrfErr);
          toast.error(
            "Security initialization failed. Please refresh the page.",
          );
        }

        if (hasValidGrade) {
          navigate("/dashboard");
        } else {
          navigate("/auth/complete-profile");
        }
      } catch (error) {
        console.error("Failed to process login:", error);
        toast.error("Login processing failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Set up a global axios interceptor to automatically handle 401 Unauthorized responses
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.log("Global 401 Interceptor: Session expired or invalid");
          if (userRef.current) {
            toast.error("Session expired. Please login again.", {
              id: "session-expired",
            });
            logoutCleanup();
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, [logoutCleanup]);

  /**
   * Partially updates the user state without requiring a full re-login.
   * Useful for updating real-time stats like carrot count.
   *
   * @param {Object} partialData - The fields to update in the user object.
   */
  const updateUser = useCallback((partialData) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...partialData };
      // Optional: We don't necessarily want to update localStorage with a stale token
      // but keeping the state in sync is priority.
      return newUser;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ user, loading, login, logout, updateUser }),
    [user, loading, login, logout, updateUser],
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {/* Show full-screen splash if session is still being validated on non-auth routes */}
      {loading && !location.pathname.startsWith("/auth") ? (
        <SplashPage />
      ) : (
        children
      )}
    </SessionContext.Provider>
  );
}
