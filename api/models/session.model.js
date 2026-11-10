/**
 * @file session.model.js
 * @description Mongoose schema for user and admin sessions.
 * @architecture Supports session management with a TTL index for automatic expiration and polymorphic references.
 */
import mongoose from "mongoose";

const SessionSchema = mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "id is required"],
    refPath: "onModel",
  },
  onModel: {
    type: String,
    required: true,
    enum: ["User", "Admin"],
    default: "User",
  },
  token: {
    type: String,
    required: [true, "token is required"],
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60, // 30 days
  },
});

// Ensure unique session per user/admin regardless of model
SessionSchema.index({ id: 1, onModel: 1 }, { unique: true });

/**
 * @module session
 */
export default mongoose.model("session", SessionSchema);
