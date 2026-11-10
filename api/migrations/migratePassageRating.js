import mongoose from "mongoose";
import "../config/env.js";
import Passages from "../models/Passages.model.js";

const LINE = "═".repeat(66);

/**
 * Migration: Migrate Passage Ratings
 *
 * Description:
 * This script ensures all older Passages have the default Elo rating (1200).
 * - Adds `rating: 1200` to all Passages missing this field.
 */

const migrate = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    console.log(`\n${LINE}`);
    console.log(`  Starting: Initialize Passage Elo Ratings`);
    console.log(`  ${new Date().toISOString()}`);
    console.log(LINE);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("  ✓  Connected to MongoDB\n");

    let totalOps = 0;

    // 1. Update Passages with new rating field
    const passagesMatched = await Passages.countDocuments({
      rating: { $exists: false },
    });

    if (passagesMatched === 0) {
      console.log(
        `  ✓  [Passages] -> 0 documents missing rating (already up to date)`,
      );
    } else {
      const passagesResult = await Passages.updateMany(
        { rating: { $exists: false } },
        { $set: { rating: 1200 } },
      );
      console.log(
        `  ✓  [Passages] -> Matched: ${passagesMatched} | Modified: ${passagesResult.modifiedCount}`,
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
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

migrate();
