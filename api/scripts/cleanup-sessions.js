/**
 * @file cleanup-sessions.js
 * @description Cleans up orphaned session documents and normalizes polymorphic onModel references for Users and Admins.
 * @architecture Part of the database maintenance and session management subsystem ensuring referential integrity of active authentication tokens.
 * @agent_note Deletes sessions whose associated User or Admin record no longer exists, directly invoking process.exit on finish.
 */

import "../config/env.js";
import connectDB from "../config/database.js";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";

/**
 * @desc Scans all session documents, purges orphaned sessions, and updates onModel discriminators for valid sessions.
 * @returns {Promise<void>} Resolves when session cleanup and reference verification finishes.
 */
const cleanup = async () => {
  try {
    await connectDB();
    console.log("Connected to database...");

    const sessions = await Session.find({});
    console.log(
      `Found ${sessions.length} total sessions. Checking for orphans...`,
    );

    let deletedCount = 0;
    let fixedAdminCount = 0;
    let userCount = 0;

    for (const session of sessions) {
      if (!session.id) {
        console.log(`Deleting session ${session._id} with no ID.`);
        await Session.deleteOne({ _id: session._id });
        deletedCount++;
        continue;
      }

      // Check if it's a User
      const user = await User.findById(session.id);
      if (user) {
        // If it was marked as something else, fix it, but by default sessions were User
        if (session.onModel !== "User") {
          session.onModel = "User";
          await session.save();
        }
        userCount++;
        continue;
      }

      // Check if it's an Admin
      const admin = await Admin.findById(session.id);
      if (admin) {
        console.log(`Fixing session ${session._id} - marking as Admin.`);
        session.onModel = "Admin";
        await session.save();
        fixedAdminCount++;
        continue;
      }

      // Neither User nor Admin exists - orphan
      console.log(
        `Deleting orphaned session ${session._id} (Owner ${session.id} not found).`,
      );
      await Session.deleteOne({ _id: session._id });
      deletedCount++;
    }

    console.log("\nCleanup Summary:");
    console.log(`- Deleted orphaned/invalid sessions: ${deletedCount}`);
    console.log(`- Fixed admin sessions: ${fixedAdminCount}`);
    console.log(`- Active user sessions: ${userCount}`);
    console.log("\nCleanup complete.");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

cleanup();
