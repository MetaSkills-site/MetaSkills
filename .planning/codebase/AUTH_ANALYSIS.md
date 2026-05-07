# Authentication Analysis: Google Auth Flow

**Analysis Date:** 2024-05-30

## Overview

The Metaskills application utilizes a hybrid authentication approach. The frontend leverages Google's OAuth2 service for identity federation, obtaining a Google ID Token. This token is sent to the backend, which verifies the token via Google's servers, creates or updates the user/admin record, and then issues its own custom JWT for subsequent API authorization. The backend also maintains active sessions in the database to allow for session revocation.

## 1. Libraries Used

### Frontend
- **`@react-oauth/google` (^0.12.1):** Provides React components and providers for Google Identity Services. Specifically, `GoogleOAuthProvider` wraps the application, and `GoogleLogin` renders the One Tap / standard sign-in button.

### Backend
- **`google-auth-library` (^10.5.0):** The official Node.js client for Google Authentication. Used specifically for the `OAuth2Client` class to securely verify the integrity and audience of the Google ID Token sent by the frontend.
- **`jsonwebtoken`:** Used to sign custom application-specific JWTs (`generateToken`, `generateAdminToken`) and verify them in middleware.

## 2. APIs and Endpoints

### External APIs
- **Google Identity Services (OAuth 2.0):** The frontend interacts with Google directly to authenticate the user and obtain an `idToken` (credential). The backend calls Google's public keys via `OAuth2Client.verifyIdToken` to validate this credential.

### Internal API Endpoints
- **User Auth (`POST /api/users/googleAuth` inferred):** Handled by `googleAuth` in `user.controller.js`. Expects a Google `credential` in the body. Returns a custom JWT and success message.
- **Admin Auth (`POST /api/admin/googleAuth` inferred):** Handled by `googleAuth` in `admin.auth.controller.js`. Expects a Google `credential`. Validates if the email corresponds to an existing admin.
- **Session Management:**
  - `POST /api/users/deleteSession`: Terminates a user session.
  - `GET /api/users/read`: Validates/refreshes user sessions.
  - `GET /api/admin/checkAuth`: Validates/refreshes admin sessions.

## 3. Architecture & Logic Locations

### Frontend Structure

- **`metaskills-frontend/src/main.jsx`**:
  - Acts as the root configuration. Wraps the application in `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>` to enable Google Auth application-wide.
  - Wraps the app in `<SessionProvider>` to hold local session state.

- **`metaskills-frontend/src/components/GoogleAuth.jsx`**:
  - Core component for rendering the login button using `<GoogleLogin>` from `@react-oauth/google`.
  - Handles the `onSuccess` callback (`handleGoogleSuccess`), taking the `credentialResponse` and submitting it directly to the backend (`apiClient.post(endpoint, { credential })`).
  - Calls `login()` from `SessionContext` upon backend validation success.

- **`metaskills-frontend/src/context/SessionProvider.jsx`** *(Inferred logic)*:
  - Manages the application's concept of an active session, storing the backend-provided custom JWT in local storage/memory and providing `login` / `logout` actions to components.

- **`metaskills-frontend/src/services/authService.js`**:
  - Handles secondary auth actions like `getProfile(token)` and `logoutSession(token, userId)`.

### Backend Structure

- **`metaskills-backend/controllers/user.controller.js`**:
  - **`googleAuth`**: Instantiates `OAuth2Client`. Calls `verifyIdToken`. Extracts `email`, `name`, `picture`. Looks up `User` by email. If existing, it syncs name/picture. If new, it creates a new `User` record with default values. Generates a custom JWT. Registers the token in the `Session` model (replaces existing session for that user).

- **`metaskills-backend/controllers/admin.auth.controller.js`**:
  - **`googleAuth`**: Very similar to user auth but verifies against the `Admin` model. Rejects the login if the email isn't pre-authorized as an Admin in the database. Generates an Admin-specific JWT.

- **`metaskills-backend/middlewares/authMiddleware.js`**:
  - **`protect` / `protectAdmin` / `protectUserOrAdmin`**: Validates the `Authorization: Bearer <token>` header using `jwt.verify()`.
  - Critically, it checks the database `Session` model (`await Session.findOne({ token: token })`) for every protected request to ensure the token hasn't been revoked/overwritten by a newer login (Stateful JWT architecture).

- **Database Models (`metaskills-backend/models/`)**:
  - **`session.model.js`**: Tracks valid JWTs linked to User/Admin IDs.
  - **`user.model.js`**: Stores Google user data alongside application-specific state (carrots, grade).
  - **`admin.model.js`**: Stores admin authorizations.

## Data Flow Summary
1. User clicks Google Login on Frontend (`GoogleAuth.jsx`).
2. Frontend receives `credential` (Google ID Token).
3. Frontend POSTs `credential` to Backend.
4. Backend verifies token authenticity using `google-auth-library`.
5. Backend identifies User/Admin by email.
6. Backend signs a local JWT containing the user's `_id`.
7. Backend saves the local JWT to the `Session` DB.
8. Backend returns local JWT to Frontend.
9. Frontend stores local JWT and includes it in `Authorization` headers.
10. Backend `authMiddleware.js` verifies local JWT signature *and* its existence in the `Session` DB for subsequent requests.