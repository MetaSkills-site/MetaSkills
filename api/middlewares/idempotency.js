/**
 * @file idempotency.js
 * @description Express middleware that enforces at-most-once semantics for
 * mutating endpoints. When a request carries an `X-Idempotency-Key` header,
 * the middleware checks a MongoDB collection for a prior execution:
 *
 *   1. If the key+user combo is "completed" → return the cached response.
 *   2. If the key+user combo is "pending"   → return 425 Too Early.
 *   3. If the key+user combo is missing      → create a "pending" record,
 *      let the controller run, then intercept `res.json()` to cache the result.
 *
 * Body hash comparison prevents "Idempotency Spoofing" — reusing a key with
 * a different request payload returns 400 Bad Request.
 *
 * The middleware is backward-compatible: requests without the header pass
 * through unmodified.
 *
 * @dependencies
 *   - models/Idempotency.model.js
 *   - Node.js crypto (built-in)
 *
 * @exports idempotencyGuard (default)
 */
import crypto from "crypto";
import Idempotency from "../models/Idempotency.model.js";

/**
 * Express middleware — attach to routes AFTER auth middleware so that
 * `req.user._id` or `req.admin._id` is available.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const idempotencyGuard = async (req, res, next) => {
  const key = req.headers["x-idempotency-key"];

  // No header → standard (non-idempotent) flow. Fully backward-compatible.
  if (!key) return next();

  // Extract userId from auth middleware output (supports both user and admin flows)
  const userId = req.user?._id || req.admin?._id;
  if (!userId) return next();

  // Hash the request body to detect key reuse with different payloads
  const bodyHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(req.body || {}))
    .digest("hex");

  try {
    const existing = await Idempotency.findOne({ userId, key });

    if (existing) {
      // ── Cache hit: request was already processed ──
      if (existing.status === "completed") {
        return res
          .status(existing.responseCode || 200)
          .json(existing.responseData);
      }

      // ── In-flight duplicate: same key but different body → spoofing ──
      if (existing.requestHash !== bodyHash) {
        return res.status(400).json({
          success: false,
          message: "Idempotency key reused with different request body",
        });
      }

      // ── Concurrent duplicate: same key+body still processing ──
      return res.status(425).json({
        success: false,
        message: "Request already in progress. Please wait.",
      });
    }

    // ── First time seeing this key → create a "pending" record ──
    await Idempotency.create({ userId, key, requestHash: bodyHash });

    // ── Intercept res.json() to capture the final response ──
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      // Cache the response asynchronously — errors here must not break the user flow
      try {
        await Idempotency.findOneAndUpdate(
          { userId, key },
          {
            status: "completed",
            responseCode: res.statusCode,
            responseData: data,
          },
        );
      } catch (cacheErr) {
        console.error(
          "[Idempotency] Failed to cache response:",
          cacheErr.message,
        );
      }
      return originalJson(data);
    };

    next();
  } catch (err) {
    // ── Race condition: two requests hit the unique index simultaneously ──
    if (err.code === 11000) {
      return res.status(425).json({
        success: false,
        message: "Request already in progress. Please wait.",
      });
    }

    // Fail open — log the error but don't block the request.
    // Why: a transient DB blip should not prevent the user from completing
    // their action; they just won't get idempotency protection this once.
    console.error("[Idempotency] Middleware error:", err.message);
    next();
  }
};

export default idempotencyGuard;
