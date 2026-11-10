/**
 * @file VocabProgress.model.js
 * @description Mongoose schema for tracking a user's progress on specific vocabulary words.
 * @architecture Implements spaced repetition attributes (box, nextReviewDate) with compound indexes for efficient querying and uniqueness constraints linking User and Vocabulary.
 */
import mongoose from "mongoose";

const vocabProgressSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    word: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vocabulary",
      required: true,
    },
    box: {
      type: Number,
      default: 0,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
    },
    lastSentenceTestedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient querying of review words for a specific user
vocabProgressSchema.index({ user: 1, nextReviewDate: 1 });

// Ensure a user only has one progress record per word
vocabProgressSchema.index({ user: 1, word: 1 }, { unique: true });

const VocabProgress = mongoose.model("VocabProgress", vocabProgressSchema);

/**
 * @module VocabProgress
 */
export default VocabProgress;
