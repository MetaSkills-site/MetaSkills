/**
 * @file migrateVocab.js
 * @description Initializes default Elo ratings to 1200 for Users and Vocabulary documents lacking SRS rating fields.
 * @architecture Part of the database migration layer establishing baseline Elo ratings for the vocabulary spaced repetition system.
 * @agent_note Modifies both User (vocabRating) and Vocabulary (rating) collections idempotently based on field existence.
 */

import mongoose from "mongoose";
import "../config/env.js";
import User from "../models/user.model.js";
import Vocabulary from "../models/Vocabulary.model.js";

const LINE = "═".repeat(66);

/**
 * Migration: Migrate Vocab SRS Ratings
 *
 * Description:
 * This script ensures all Users and Vocabulary items have the default Elo rating for the new Spaced Repetition System.
 * - Adds `vocabRating: 1200` to all Users missing this field.
 * - Adds `rating: 1200` to all Vocabulary items missing this field.
 */

/**
 * @desc Connects to MongoDB and performs bulk updates to initialize missing vocabRating on Users and rating on Vocabulary items.
 * @returns {Promise<void>} Resolves when Elo rating backfills complete and connection closes.
 */
const migrate = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    console.log(`\n${LINE}`);
    console.log(`  Starting: Initialize Vocab SRS Ratings`);
    console.log(`  ${new Date().toISOString()}`);
    console.log(LINE);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("  ✓  Connected to MongoDB\n");

    let totalOps = 0;

    // 1. Update Users with new vocabRating field
    const userMatched = await User.countDocuments({
      vocabRating: { $exists: false },
    });
    if (userMatched === 0) {
      console.log(
        `  ✓  [Users] -> 0 documents missing vocabRating (already up to date)`,
      );
    } else {
      const userResult = await User.updateMany(
        { vocabRating: { $exists: false } },
        { $set: { vocabRating: 1200 } },
      );
      console.log(
        `  ✓  [Users] -> Matched: ${userMatched} | Modified: ${userResult.modifiedCount}`,
      );
      totalOps++;
    }

    // 2. Update Vocabulary with new rating field
    const vocabMatched = await Vocabulary.countDocuments({
      rating: { $exists: false },
    });
    if (vocabMatched === 0) {
      console.log(
        `  ✓  [Vocabulary] -> 0 documents missing rating (already up to date)`,
      );
    } else {
      const vocabResult = await Vocabulary.updateMany(
        { rating: { $exists: false } },
        { $set: { rating: 1200 } },
      );
      console.log(
        `  ✓  [Vocabulary] -> Matched: ${vocabMatched} | Modified: ${vocabResult.modifiedCount}`,
      );
      totalOps++;
    }

    console.log(`\n${LINE}`);
    console.log(`  SUMMARY`);
    console.log(LINE);
    console.log(`  Operations performed : ${totalOps}`);
    console.log(`\n  ✓  Migration complete.`);
    console.log(`${LINE}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n✗  Migration failed:", error.message || error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrate();
