/**
 * @file migrateCandiesToCarrots.js
 * @description Migrates legacy user rewards from the deprecated 'candies' integer attribute to the 'carrots' field.
 * @architecture Part of the database maintenance script layer reconciling gamification terminology across historical user documents.
 * @agent_note Uses native MongoDB collection operations to bypass Mongoose schema filtering when reading and updating undeclared fields.
 */

import mongoose from "mongoose";
import "../config/env.js";

/**
 * @desc Queries the raw users collection for documents containing the candies field and copies the values to carrots.
 * @returns {Promise<void>} Resolves when all matching user records are migrated and process terminates.
 */
const migrateCandiesToCarrots = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for migration...");

    const db = mongoose.connection.db;
    const collection = db.collection("users");

    // Use raw collection access to handle schema-less/undeclared fields
    const usersWithCandies = await collection
      .find({ candies: { $exists: true } })
      .toArray();
    console.log(`Found ${usersWithCandies.length} users with 'candies' field.`);

    if (usersWithCandies.length === 0) {
      console.log("No users to migrate.");
      process.exit(0);
    }

    let updatedCount = 0;
    for (const user of usersWithCandies) {
      const candiesValue = user.candies || 0;

      // Set carrots = candies, and unset candies
      await collection.updateOne(
        { _id: user._id },
        {
          $set: { carrots: candiesValue },
          $unset: { candies: "" },
        },
      );
      updatedCount++;
    }

    console.log(
      `Successfully migrated ${updatedCount} users from 'candies' to 'carrots'.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Migration Failed:", error);
    process.exit(1);
  }
};

migrateCandiesToCarrots();
