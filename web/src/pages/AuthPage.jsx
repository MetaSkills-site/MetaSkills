/**
 * @file AuthPage.jsx
 * @description A container component for authentication, currently providing a wrapper for the Google Authentication button.
 * It's structured to house different login/signup methods.
 *
 * @dependencies
 * - GoogleAuth: The component that handles Google sign-in.
 *
 * @exports AuthPage (default)
 * @interconnections Used on landing pages or authentication modals to provide sign-in options.
 */

import GoogleAuth from "../components/GoogleAuth";

export default function AuthPage() {
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
      {/* Google Authentication component is the primary sign-in method */}
      <GoogleAuth />
    </div>
  );
}
