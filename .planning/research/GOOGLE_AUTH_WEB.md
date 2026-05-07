# Research: Google Authentication Web APIs

**Focus:** Browser Compatibility, Fallbacks, and Web-to-Backend Architecture
**Researched:** 2024
**Overall confidence:** HIGH

## 1. State of Google Sign-In APIs (2024)

The landscape for Google Identity Services (GIS) has shifted significantly due to browser privacy policies regarding third-party cookies. Google has moved away from the older `google-signin` library to the newer **Google Identity Services (GIS)** library, which now heavily utilizes the FedCM (Federated Credential Management) API.

## 2. Browser Compatibility & Privacy Issues

Historically, features like "One Tap" and Automatic Sign-In relied heavily on third-party cookies to recognize user sessions.
*   **Safari (ITP - Intelligent Tracking Prevention):** Blocks third-party cookies by default since 2020. GIS One Tap often fails or requires explicit bridging.
*   **Firefox (ETP - Enhanced Tracking Protection):** Blocks third-party cookies by default since 2019. Similar issues to Safari.
*   **Chrome:** Reverted plans to fully deprecate third-party cookies in 2024, shifting to a "user choice" model. However, to ensure functionality for users who block them, Google migrated GIS to the **FedCM API** starting in April 2024.

**FedCM (Federated Credential Management):**
A privacy-preserving browser API that allows identity providers (like Google) to communicate with websites without needing third-party cookies. It presents a browser-native UI rather than injecting cross-site iframes. It is the new standard for Chrome.

## 3. Fallbacks and Best Practices

Because FedCM is currently a Chromium-led standard and not universally functional across strict ITP/ETP browsers, fallbacks are critical.

*   **Standard Sign-in Button (Popup/Redirect):** The primary and most reliable fallback. Unlike One Tap (which requires cross-site recognition), the standard sign-in button uses a popup or full-page redirect. This creates a "first-party" interaction with `accounts.google.com`, bypassing ITP/ETP restrictions.
*   **Immediate Fallback Implementation:** If GIS fails to initialize One Tap (detectable via `prompt_parent_id` issues or `intermediate_iframe_close` events), immediately present the standard "Sign in with Google" button.
*   **Storage Access API:** Google occasionally uses this under the hood to request permission for third-party cookie access, but the standard button remains the required manual fallback for robust UX.

## 4. Web-to-Backend Architecture Internals

The authentication flow relies on JSON Web Tokens (JWT) for secure transmission and backend verification.

1.  **Frontend Generation:** 
    User clicks sign-in -> GIS library authenticates with Google -> Google returns an **ID Token (JWT)** to the frontend (provided via the `credential` property in the callback).
2.  **Transmission:** 
    Frontend sends the ID Token to the backend via an HTTPS POST request.
3.  **Backend Verification:** 
    The backend must **never trust the token blindly**. It must verify both the signature and claims using official libraries (e.g., `google-auth-library` in Node.js).
    *   **Signature Verification:** Fetches Google's public keys (`https://www.googleapis.com/oauth2/v3/certs`) and verifies the RSA signature using the `kid` in the token header.
    *   **Claim Verification:**
        *   `aud` (Audience): Must exactly match the app's Google Client ID to prevent token substitution attacks.
        *   `iss` (Issuer): Must be `https://accounts.google.com` or `accounts.google.com`.
        *   `exp` (Expiration): Token must not be expired.
4.  **Session Creation:**
    Once verified, extract the `sub` claim (Subject). This is the user's permanent, unique Google ID. **Use `sub` as the primary key**, not the email, as emails can change but `sub` remains constant.

## Security Best Practices
*   **Always transmit via HTTPS** to prevent MITM attacks.
*   **Implement CSRF protection:** If using GIS POST redirects, verify the `g_csrf_token` cookie against the body token.
*   **Use official libraries** (e.g., `client.verifyIdToken()`) rather than manual JWT parsing.
