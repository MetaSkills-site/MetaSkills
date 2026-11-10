/**
 * @file Idempotency.model.js
 * @description Mongoose schema for idempotency records.
 * @architecture Unique compound index on userId and key, 6-hour TTL index on createdAt.
 */
import mongoose from "mongoose";

const IdempotencySchema = new mongoose.Schema({
  /** The authenticated user (or admin) who initiated the request. */
  userId: { type: mongoose.Types.ObjectId, required: true },

  /** The UUID sent via the X-Idempotency-Key header. */
  key: { type: String, required: true },

  /**
   * Lifecycle status:
   *   - "pending"   → Controller is still processing.
   *   - "completed" → Response has been cached; subsequent hits return it.
   */
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },

  /** The HTTP status code of the original response. */
  responseCode: Number,

  /** The full JSON body returned by the original response. */
  responseData: mongoose.Schema.Types.Mixed,

  /**
   * SHA-256 hash of the request body. Detects misuse where the same
   * idempotency key is sent with a different payload ("Idempotency Spoofing").
   */
  requestHash: String,

  /**
   * TTL field — MongoDB automatically deletes documents 6 hours after creation.
   * This keeps the collection lean without requiring a cron job.
   */
  createdAt: { type: Date, default: Date.now, expires: "6h" },
});

// Compound unique index: one key per user, enforced at the database level.
IdempotencySchema.index({ userId: 1, key: 1 }, { unique: true });

/**
 * @module Idempotency
 */
export default mongoose.model("Idempotency", IdempotencySchema);
