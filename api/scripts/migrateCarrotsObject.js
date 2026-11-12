/**
 * @file migrateCarrotsObject.js
 * @description Transforms scalar numeric carrots fields on User documents into rich subdocuments containing count, lastdate, and weekly history.
 * @architecture Part of the database maintenance script layer upgrading gamification reward data structures to support activity streaks.
 * @agent_note Uses User.collection.updateOne directly to bypass Mongoose schema type validation during the type transition.
 */

import mongoose from "mongoose";
import "../config/env.js";
import User from "../models/user.model.js";

/**
 * @desc Scans all users and converts scalar carrot counts into structured objects with history arrays and timestamp tracking.
 * @returns {Promise<void>} Resolves when all scalar carrot values are transformed into subdocuments.
 */
const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users to check...`);

    let modified = 0;

    for (let user of users) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // We access the raw BSON document to bypass mongoose schemas if needed
      // Or just check if carrots is a number
      if (typeof user.carrots === "number") {
        const oldCarrots = user.carrots || 0;

        // Mongoose might complain if we set an object to a Number field unless we update the schema first.
        // Wait, the schema will be updated, but for this raw update we should use updateOne directly.
        await User.collection.updateOne(
          { _id: user._id },
          {
            $set: {
              carrots: {
                count: oldCarrots,
                lastdate: now,
                history: [0, 0, 0, 0, 0, 0, 0],
              },
            },
          },
        );
        modified++;
      }
    }

    console.log(`Migration Complete. Modified ${modified} users.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
