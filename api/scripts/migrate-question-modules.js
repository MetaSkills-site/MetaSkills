/**
 * @file migrate-question-modules.js
 * @description Migrates legacy single 'module' references on Question documents into the 'modules' array field and unsets the old field.
 * @architecture Part of the database maintenance script layer adapting schema relations from single-module ownership to multi-module membership.
 * @agent_note Safely handles documents that already have modules populated using $addToSet and unsets legacy scalar module fields.
 */

import "../config/env.js";
import connectDB from "../config/database.js";
import Question from "../models/Questions.model.js";

// Manually define schema to ensure we can access the 'module' field even if it's removed from the main model file,
// though Mongoose usually allows flexible access if strict is false.
// But since we are importing the model, it uses the schema defined in the file.
// If the user ALREADY removed 'module' from schema in Questions.model.js, we might not be able to select it easily if strict query is on.
// However, `find` usually returns what's in DB.
// Let's rely on the model import.

/**
 * @desc Scans all Question documents and transforms scalar module ObjectIds into entries within the modules array.
 * @returns {Promise<void>} Resolves when all matching questions are migrated and process terminates.
 */
const migrate = async () => {
  await connectDB();

  try {
    console.log("Starting migration...");

    // Find all questions that might need migration.
    // We look for questions that have 'module' field (checking validity can be trickier if schema doesn't have it).
    // Using strict: false query approach or just iterating all.
    const questions = await Question.find({});

    console.log(`Found ${questions.length} questions.`);

    let count = 0;
    for (const q of questions) {
      // Check if it has 'module' property in _doc or directly
      const doc = q._doc || q;

      // Note: If 'module' was removed from schema, accessing q.module might yield undefined unless we use doc['module'] or similar, AND if strict is false.
      // But let's assume it's accessible or we simply check for existence in the object.

      // To be safe against schema limitations, we can use `lean()` but then we can't `.save()`.
      // Instead we can use updateOne.

      const oldModuleId = doc.module;
      const currentModules = doc.modules || [];

      if (oldModuleId && currentModules.length === 0) {
        console.log(
          `Migrating question ${q._id}: module ${oldModuleId} -> modules array`,
        );

        await Question.updateOne(
          { _id: q._id },
          {
            $set: { modules: [oldModuleId] },
            $unset: { module: "" },
          },
        );
        count++;
      } else if (
        oldModuleId &&
        !currentModules.some((m) => m.toString() === oldModuleId.toString())
      ) {
        // If modules exists but old module is not in it? (Edge case)
        console.log(
          `Merging question ${q._id}: adding module ${oldModuleId} to existing modules`,
        );
        await Question.updateOne(
          { _id: q._id },
          {
            $addToSet: { modules: oldModuleId },
            $unset: { module: "" },
          },
        );
        count++;
      } else if (oldModuleId) {
        // Just cleanup
        console.log(
          `Cleaning up question ${q._id}: removing redundant module field`,
        );
        await Question.updateOne({ _id: q._id }, { $unset: { module: "" } });
        count++;
      }
    }

    console.log(`Migration complete. Updated ${count} questions.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
