import mongoose from "mongoose";
import "../config/env.js";
import User from "../models/user.model.js";

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
