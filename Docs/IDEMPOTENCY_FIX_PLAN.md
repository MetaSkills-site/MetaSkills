# Idempotency Fix Plan: CORS Preflight Issue

## Issue Overview
The `/api/vocabulary/verify` endpoint is failing during the CORS preflight (`OPTIONS`) request because the browser detects a custom header (`X-Idempotency-Key`) that is not explicitly allowed by the backend's CORS configuration. The error states: `"Request header field x-idempotency-key is not allowed by Access-Control-Allow-Headers in preflight response."`

## 1. Identified Files to Change
- **Backend CORS Setup**: `metaskills-backend/middlewares/clientblock.js`
  This file handles the global CORS configuration and origin validation before requests reach the body parsers or routers.
- **Frontend Interceptors**: `metaskills-frontend/src/hooks/useFetch.js` and `metaskills-frontend/src/hooks/useQuizSubmit.js` currently inject this header when `options.idempotent = true`.
- **Backend Routes**: `metaskills-backend/routes/vocabulary.routes.js` explicitly uses the `idempotencyGuard` middleware for the `/verify` POST route.
**Conclusion**: Since the backend strictly utilizes the idempotency guard for deduplication, removing it from the frontend is **not recommended**. The correct fix is to allow the header in the backend's CORS configuration.

## 2. Specific Code Changes Needed

### Update Backend CORS Configuration
Modify the `Access-Control-Allow-Headers` directive in the backend client-block middleware.

**File:** `metaskills-backend/middlewares/clientblock.js`

**Current Code (Around line 25):**
```javascript
res.setHeader(
  "Access-Control-Allow-Headers",
  "Content-Type, Authorization, X-Requested-With",
);
```

**Proposed Fix:** Add `X-Idempotency-Key` to the allowed list.
```javascript
res.setHeader(
  "Access-Control-Allow-Headers",
  "Content-Type, Authorization, X-Requested-With, X-Idempotency-Key",
);
```
*(Note: Header names in the `Access-Control-Allow-Headers` list are case-insensitive).*

## 3. Steps to Test and Verify the Fix Locally

1. **Start the Development Servers**
   - **Backend:** In `metaskills-backend/`, run `npm run start` (or `npm run dev` if configured for nodemon).
   - **Frontend:** In `metaskills-frontend/`, run `npm run dev` to start Vite on `http://localhost:5173`.

2. **Trigger the API Endpoint**
   - Open your browser and navigate to the application running locally (`http://localhost:5173`).
   - Open the **Developer Tools** and navigate to the **Network** tab. Ensure "Preserve log" is enabled.
   - Navigate to the vocabulary module and submit an answer to trigger the `/api/vocabulary/verify` endpoint.

3. **Verify the Preflight (`OPTIONS`) Request**
   - Locate the `OPTIONS /api/vocabulary/verify` request in the Network tab.
   - Check the **Response Headers**. You should see:
     ```
     Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Idempotency-Key
     ```
   - Ensure the request returns a `204 No Content` status code.

4. **Verify the Actual (`POST`) Request**
   - Verify the subsequent `POST /api/vocabulary/verify` request executes successfully (status `200` or `201`) without throwing any CORS errors in the console.
   - Ensure the `X-Idempotency-Key` was sent in the **Request Headers**.

5. **Verify Idempotency Logic (Optional but recommended)**
   - To ensure the idempotency logic wasn't compromised, intentionally double-click the submit button or simulate a quick retry to see if the second request correctly bypasses processing and returns the cached successful response from the database.