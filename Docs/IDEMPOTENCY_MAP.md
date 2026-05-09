# Idempotency Implementation Map

## 1. Overview of Handling

The Metaskills backend implements idempotency to ensure that duplicate requests (like double-clicks on submit buttons or network retries) do not result in duplicate state mutations (e.g., duplicate database entries). It employs a layered defense mechanism:

1.  **Network/Middleware Level:** A generic Express middleware (`middlewares/idempotency.js`) that caches responses based on an `X-Idempotency-Key` header.
2.  **Domain/Service Level:** Specific checks in critical services (like `services/quiz.service.js`) to ensure data uniqueness based on domain logic, even if the middleware is bypassed or fails.

### Components Involved

*   **Middleware:** `middlewares/idempotency.js`
*   **Database Model:** `models/Idempotency.model.js`
*   **Routes:** `routes/*.routes.js`
*   **Services:** `services/quiz.service.js`
*   **Test Script:** `_test_idempotency.js`

---

## 2. Map of Files and Functions

### Core Implementation
*   **`models/Idempotency.model.js`**
    *   **Mongoose Model:** `Idempotency`
    *   **Fields:** `userId`, `key`, `status` ("pending" or "completed"), `responseCode`, `responseData`, `requestHash`, `createdAt` (with 6h TTL).
    *   **Indexes:** Compound unique index on `{ userId: 1, key: 1 }`.

*   **`middlewares/idempotency.js`**
    *   **Function:** `idempotencyGuard(req, res, next)`
    *   **Logic:** Validates `X-Idempotency-Key`, hashes `req.body`, checks DB for existing request, caches response.

### Applied Routes (Usage)
The `idempotencyGuard` middleware is applied to several mutating (POST) endpoints to protect them:
*   **`routes/admin.routes.js`** (various admin operations)
*   **`routes/error.routes.js`** (`/report`)
*   **`routes/genai.routes.js`** (`/sentences/evaluate`)
*   **`routes/math.routes.js`** (`/answer`)
*   **`routes/quiz.routes.js`** (`/submit`, `/response`)
*   **`routes/vocabulary.routes.js`** (`/verify`)

### Domain-Level Idempotency
*   **`services/quiz.service.js`**
    *   **Function:** `submitAnswer(userId, moduleId, questionId, answer, timeTaken)`
    *   **Logic:** Contains a "Domain-level idempotency guard" that queries the `Responses` collection for an existing `userId`, `questionId`, and `moduleId`.

### Testing
*   **`_test_idempotency.js`**
    *   Standalone script testing the middleware logic (concurrent requests, spoofing, backward compatibility).

---

## 3. Logical Workflow

The typical lifecycle of a request protected by idempotency follows this sequence:

1.  **Request Arrival:** A client sends a POST request with an `X-Idempotency-Key` header (usually a UUID) to a protected route (e.g., `/api/quiz/submit`).
2.  **Auth Extraction:** The authentication middleware runs first, attaching `req.user` or `req.admin`.
3.  **Middleware Execution (`idempotencyGuard`):**
    *   **Passthrough Check:** If the `X-Idempotency-Key` header is missing, the request proceeds normally (`next()`).
    *   **Hash Generation:** The request body is hashed using SHA-256 (`crypto.createHash`).
    *   **Database Query:** The middleware queries the `Idempotency` collection for `{ userId, key }`.
4.  **Handling Existing Records:**
    *   **Cache Hit:** If `status === "completed"`, the middleware returns the cached HTTP `responseCode` and `responseData`.
    *   **Spoofing Detection:** If `status === "completed"` or `"pending"`, but the stored `requestHash` does not match the newly computed `bodyHash`, a `400 Bad Request` is returned (preventing reuse of the same key for different operations).
    *   **Concurrent Duplicate:** If `status === "pending"`, it means another request with the same key is currently being processed. The middleware returns `425 Too Early` ("Request already in progress. Please wait.").
5.  **Handling New Requests:**
    *   **Record Creation:** If no record exists, a new document is created with `status: "pending"` and the `requestHash`.
    *   **Race Condition Mitigation:** If two requests arrive at the exact same millisecond and attempt to create a record, MongoDB's unique compound index on `(userId, key)` throws an `E11000` Duplicate Key Error for the loser. The middleware catches this and returns `425 Too Early`.
    *   **Response Interception:** The middleware intercepts Express's `res.json()` function. It calls `next()` to let the controller execute.
6.  **Controller & Service Execution:**
    *   The route controller executes. In `services/quiz.service.js` -> `submitAnswer`, an additional domain-level check queries the `Responses` collection. If the user already answered the exact question in the module, the transaction aborts, and a derived deduplicated result is returned instead of crashing or inserting a duplicate row.
7.  **Response Caching:**
    *   Once the controller calls `res.json(data)`, the intercepted function in the middleware runs.
    *   It updates the `Idempotency` document in MongoDB, setting `status: "completed"`, `responseCode: res.statusCode`, and `responseData: data`.
    *   Finally, the original `res.json(data)` is sent back to the client.
8.  **Cleanup:** MongoDB automatically drops records older than 6 hours via the TTL index on `createdAt`.