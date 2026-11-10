/**
 * @file Errors.model.js
 * @description Mongoose schema for system and user errors.
 * @architecture Stores error reports with references to the User model and metadata.
 */
import mongoose from "mongoose";

const ErrorsSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    screenshotFilename: {
      type: String,
      default: null,
    },
    reportType: {
      type: String,
      enum: ["automatic", "manual"],
      default: "manual",
    },
    category: {
      type: String,
      enum: [
        "ui_bug",
        "content_error",
        "feature_request",
        "technical_issue",
        "other",
      ],
      default: "other",
    },
    environment: {
      type: String,
      required: true,
    },
    userDescription: {
      type: String,
      required: true,
    },
    systemMetadata: {
      type: new mongoose.Schema(
        {
          source: { type: String, maxlength: 100, trim: true },
          version: { type: String, maxlength: 50, trim: true },
          runtime: { type: String, maxlength: 100, trim: true },
          userAgent: { type: String, maxlength: 500, trim: true },
          language: { type: String, maxlength: 50, trim: true },
          windowSize: { type: String, maxlength: 50, trim: true },
          screenSize: { type: String, maxlength: 50, trim: true },
          timeZone: { type: String, maxlength: 100, trim: true },
          pixelRatio: { type: Number },
        },
        { _id: false },
      ),
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
  },
  {
    timestamps: true,
  },
);

/**
 * @module ErrorModel
 */
export default mongoose.model("ErrorModel", ErrorsSchema);
