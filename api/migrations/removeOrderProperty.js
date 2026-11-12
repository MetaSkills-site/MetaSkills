/**
 * @file removeOrderProperty.js
 * @description Removes deprecated order properties from Module and Question collections using non-strict schema updates.
 * @architecture Part of the database migration layer cleaning up legacy sequence attributes superseded by dynamic ordering or array indexes.
 * @agent_note Exported function can be run standalone via CLI or invoked programmatically within migration suites.
 */

import mongoose from "mongoose";
import "../config/env.js";
import Module from "../models/Module.model.js";
import Question from "../models/Questions.model.js";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * @desc Connects to MongoDB if unestablished and unsets the order field from all Module and Question documents.
 * @returns {Promise<{success: boolean, modifiedModules: number, modifiedQuestions: number}>} Summary of modified document counts.
 */
export const removeOrderProperty = async () => {
  let openedConnection = false;
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
      openedConnection = true;
      console.log("Connected to MongoDB for Order cleanup");
    }

    console.log("Starting order property cleanup...");

    const moduleResult = await Module.updateMany(
      { order: { $exists: true } },
      { $unset: { order: "" } },
      { strict: false },
    );

    console.log(
      `Removed 'order' property from ${moduleResult.modifiedCount} modules.`,
    );

    const questionResult = await Question.updateMany(
      { order: { $exists: true } },
      { $unset: { order: "" } },
      { strict: false },
    );

    console.log(
      `Removed 'order' property from ${questionResult.modifiedCount} questions.`,
    );

    console.log("Order property cleanup complete!");

    return {
      success: true,
      modifiedModules: moduleResult.modifiedCount,
      modifiedQuestions: questionResult.modifiedCount,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    if (openedConnection) {
      await mongoose.disconnect();
    }
  }
};

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  removeOrderProperty()
    .then(async () => {
      await mongoose.disconnect();
      console.log("Safely disconnected from DB.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
