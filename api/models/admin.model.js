/**
 * @file admin.model.js
 * @description Mongoose schema for the admin entity.
 * @architecture Defines the Admin model used for Google OAuth-based admin authentication and role management.
 */
import mongoose from "mongoose";

const AdminSchema = mongoose.Schema(
  {
    fullname: {
      type: String,
      trim: true,
      required: [true, "Full name is required"],
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "is invalid"],
    },
    role: {
      type: String,
      default: "admin",
      enum: {
        values: ["admin", "superadmin"],
        message: "{VALUE} is not a supported role",
      },
    },
    // We can add permissions here later if needed
  },
  { timestamps: true },
);

// Admin model is now used with Google OAuth.
// Admins must be manually added to the database with their Google email.

/**
 * @module Admin
 */
export default mongoose.model("Admin", AdminSchema);
