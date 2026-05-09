## [2024-05-30] - CORS Idempotency Fix
- **Changed:** `metaskills-backend/middlewares/clientblock.js`
- **Why:** The quiz submission endpoint `/api/vocabulary/verify` was being blocked by CORS preflight because the frontend uses an `X-Idempotency-Key` header for duplicate request protection, but this custom header wasn't listed in the backend's allowed CORS headers (`Access-Control-Allow-Headers`).
- **Risk:** Low
- **Verification:** Verified via manual analysis of the frontend/backend request flow and CORS requirements.