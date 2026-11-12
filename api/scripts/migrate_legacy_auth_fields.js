/**
 * @file migrate_legacy_auth_fields.js
 * @description Removes obsolete authentication fields including password, isVerified, and otpVerified from all User documents.
 * @architecture Part of the database maintenance script layer adapting User schemas following the transition to passwordless/OAuth authentication.
 * @agent_note Executes a blanket $unset across the User collection and terminates the process upon completion.
 */

import mongoose from "mongoose";
import "../config/env.js";
import User from "../models/user.model.js";

/**
 * @desc Connects to MongoDB and performs a bulk unset of deprecated authentication fields across all User records.
 * @returns {Promise<void>} Resolves when the update query finishes and the process exits.
 */
async function migrateLegacyAuthFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    console.log("Starting database migration: Unsetting legacy auth fields...");
    const result = await User.updateMany(
      {}, // Target all users
      { $unset: { password: 1, isVerified: 1, otpVerified: 1 } },
    );

    console.log(
      `Migration Complete. Verified/Modified ${result.modifiedCount} user documents.`,
    );
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrateLegacyAuthFields();
