# CORS `x-idempotency-key` Debug Report

## 1. Issue Analysis
The frontend application at `https://www.metaskills.site` is attempting to make a `POST` request to the backend endpoint `https://metaskills-backend-88920866439.asia-south1.run.app/api/vocabulary/verify`. This request is blocked by the browser's CORS policy because the custom header `x-idempotency-key` (sent by the frontend) is not explicitly allowed in the backend's `Access-Control-Allow-Headers` response for the preflight (`OPTIONS`) request.

## 2. Flow of Quiz Questions and Submission
- **Frontend Submission Flow:**
  - In `metaskills-frontend/src/components/MarathonQuiz.jsx`, the `handleSubmit` function maps the submission URL to `/api/vocabulary/verify` when the `subCategory` is "vocabulary".
  - It uses the `submitAnswer` function from the `useQuizSubmit` hook (`metaskills-frontend/src/hooks/useQuizSubmit.js`).
  - When calling `submitAnswer`, it passes `{ idempotent: true }` in the options.
  - The `useQuizSubmit` hook checks `options.idempotent`. If true, it automatically generates a UUID or fingerprint and appends the `X-Idempotency-Key` header to the `requestConfig.headers` before invoking the Axios `apiClient.post()`.
- **Backend Flow:**
  - The request hits the backend API Gateway. The very first middleware executed is `clientblock` (`metaskills-backend/middlewares/clientblock.js`).
  - `clientblock` handles the preflight `OPTIONS` request and returns CORS headers.
  - The browser checks the preflight response and blocks the actual request if `x-idempotency-key` is not in the allowed headers list.
  - Assuming the request went through, the backend has an `idempotencyGuard` middleware (`metaskills-backend/middlewares/idempotency.js`) that intercepts the request. It looks for `req.headers["x-idempotency-key"]`. If found, it ensures the action (like updating "carrots", Elo ratings, etc.) is processed exactly once by checking a MongoDB collection (`models/Idempotency.model.js`).

## 3. Why the CORS Error is Happening
The backend's centralized CORS configuration is handled manually inside `metaskills-backend/middlewares/clientblock.js` instead of using a library like `cors`.

At lines 29-32 of `clientblock.js`, the headers are hardcoded as follows:
```javascript
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
```
Because `x-idempotency-key` is missing from this list, any frontend request including this header gets blocked by the browser during the preflight phase.

## 4. Importance of the Idempotency Key
The `x-idempotency-key` is **highly critical** for this endpoint. 
As stated in the project conventions (`metaskills-frontend/GEMINI.md` under "API Reliability"):
> "Use the idempotencyGuard middleware for any POST/PUT actions that modify user state (carrots, Elo, progress) to prevent duplicate actions."

The `/api/vocabulary/verify` endpoint evaluates the user's answer and asynchronously updates their Elo ratings (`updateVocabEloRatings`) and grants "carrots" (gamification currency). If the frontend encounters a transient network error and retries the submission without an idempotency key, the user could be awarded duplicate carrots or have their Elo artificially inflated. Therefore, the key should definitely *not* be removed from the frontend.

## 5. Proposed Solution
To fix the CORS issue while retaining the idempotency protections, the `x-idempotency-key` header must be added to the allowed headers list in the backend CORS configuration.

**File to modify:** `/media/jimfleax/fedora/home/reetabratabhandari/Projects/Metaskills/metaskills-backend/middlewares/clientblock.js`

**Change:**
Find the `Access-Control-Allow-Headers` configuration:
```javascript
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
```
Update it to include `X-Idempotency-Key` (header names are case-insensitive in HTTP, but matching the frontend's casing is good practice):
```javascript
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-Idempotency-Key",
  );
```
Once deployed to the backend, the preflight response will allow the custom header, and the browser will permit the actual `POST` request to proceed to the backend's `idempotencyGuard` middleware.