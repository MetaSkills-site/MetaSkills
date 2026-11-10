/**
 * @file GoogleAuth.jsx
 * @description Provides Google Authentication functionality using the @react-oauth/google library.
 * It handles the Google sign-in process, communicates with the backend for verification,
 * and manages the user session upon successful authentication.
 *
 * @dependencies
 * - @react-oauth/google: For the GoogleLogin component.
 * - react: For useContext and useState hooks.
 * - react-hot-toast: For displaying authentication status notifications.
 * - SessionContext: To manage the global user session.
 * - api.js: Centralized axios instance with baseURL and interceptors.
 *
 * @exports GoogleAuth (default)
 * @interconnections Used in LoginOrSignup (Form.jsx) and other authentication-related views.
 */

import { GoogleLogin } from "@react-oauth/google";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { SessionContext } from "../context/SessionProvider";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";

export default function GoogleAuth({
  endpoint = API_ENDPOINTS.googleAuth.url,
  onSuccess: customOnSuccess,
}) {
  const { login } = useContext(SessionContext);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the successful credential response from Google.
   * Sends the credential to the backend for verification and session creation.
   *
   * @param {Object} credentialResponse - The response object from Google containing the JWT.
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    const toastId = toast.loading("Authenticating with Google...");

    try {
      // Send the Google JWT to the backend for verification.
      // skipAuth: true — user has no JWT at this point (pre-authentication request).
      // Use application/x-www-form-urlencoded to bypass OPTIONS preflight,
      // as the Hugging Face Spaces ingress strips credentials from OPTIONS responses.
      const response = await apiClient.post(
        endpoint,
        new URLSearchParams({ credential: credentialResponse.credential }),
        {
          skipAuth: true,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      toast.success(response.data.message || "Logged in successfully", {
        id: toastId,
      });

      // If custom success handler is provided, use it, otherwise use default session login
      // This allows the component to be reused for different auth flows (e.g., linking accounts)
      if (customOnSuccess) {
        customOnSuccess(response.data);
      } else {
        await login(response.data);
      }
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error(
        error.response?.data?.message ||
          "Google authentication failed. Please try again.",
        { id: toastId },
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => {
        toast.error("Google authentication failed. Please try again.");
        setIsLoading(false);
      }}
      auto_select={false}
      useOneTap={true}
      text="continue_with"
      shape="pill"
      size="large"
      logo_size="large"
      theme="outline"
      width="320"
      disabled={isLoading}
    />
  );
}
