/**
 * @file Passages.model.js
 * @description Mongoose schema for text passages and sentences.
 * @architecture Stores textual content for evaluation with an associated rating.
 */
import mongoose from "mongoose";

const PassagesSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: false, // Title optional for sentences
    },
    type: {
      type: String,
      enum: ["passage", "sentence"],
      default: "passage",
    },
    text: {
      type: String, // Simplified to plain string
      required: [true, "Text content is required"],
    },
    rating: {
      type: Number,
      default: 1200,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * @module Passages
 */
export default mongoose.model("Passages", PassagesSchema);
