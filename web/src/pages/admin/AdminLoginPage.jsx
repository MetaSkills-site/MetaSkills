/**
 * @file AdminLoginPage.jsx
 * @description Specialized entry point for administrator authentication using Google OAuth.
 * Verifies administrative privileges and manages secure session persistence.
 *
 * @dependencies
 * - GoogleAuth: Shared OAuth component configured to target administrative backend endpoints.
 * - jwt-decode: Used to extract admin profile information from the issued JWT.
 * - react-router-dom: For navigation to the admin dashboard after successful login.
 * - react-hot-toast: For providing immediate feedback on authentication status.
 *
 * @exports
 * - AdminLogin (default): The functional component for the admin login portal.
 *
 * @interconnections
 * - Communicates with the '/api/admin/google-auth' backend endpoint.
 * - Populates 'adminUser' in localStorage, which is consumed by the Dashboard and other admin views.
 */

import { useNavigate } from "react-router-dom";
import GoogleAuth from "../../components/GoogleAuth";
import toast from "react-hot-toast";
import { API_ENDPOINTS } from "../../api/requestMap";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  /**
   * Callback executed after successful Google OAuth verification by the backend.
   */
  const handleAdminAuthSuccess = () => {
    try {
      // The backend sets an httpOnly cookie with the JWT upon successful login.
      // We no longer need to decode or store it in localStorage manually.

      toast.success("Admin access granted");

      // Redirect to the main administrative dashboard
      navigate("/admin");
    } catch (e) {
      console.error("Admin login token decode failed", e);
      toast.error("Invalid admin credentials received");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        width: "fit-content",
      }}
    >
      {/* 
          Renders the Google Login button configured specifically 
          for administrative privilege verification. 
      */}
      <GoogleAuth
        endpoint={API_ENDPOINTS.adminGoogleAuth.url}
        onSuccess={handleAdminAuthSuccess}
      />

      <p
        style={{
          marginTop: "10px",
          color: "#666",
          fontSize: "14px",
          textAlign: "center",
        }}
      >
        Only authorized administrators can log in here.
      </p>
    </div>
  );
}
