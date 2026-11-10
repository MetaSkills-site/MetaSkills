/**
 * @file migration.controller.js
 * @description Provides endpoints to run database schema migrations and backfills.
 * @architecture Controller layer used by administrators to update legacy MongoDB documents safely.
 */
import expressAsyncHandler from "express-async-handler";
import Question from "../models/Questions.model.js";
import Notification from "../models/Notification.model.js";
import Session from "../models/session.model.js";

/**
 * @desc    Run database migration to backfill missing fields in collections
 * @route   GET /api/admin/migrate
 * @access  Private (Admin)
 */
const runMigration = expressAsyncHandler(async (req, res) => {
  try {
    console.log("Starting Migration via API...");
    const results = {};

    // 1. Fix Questions: active
    const qActive = await Question.updateMany(
      { active: { $exists: false } },
      { $set: { active: true } },
    );
    results.questionsActive = qActive.modifiedCount;

    // 2. Fix Questions: rating (default 1200)
    const qRating = await Question.updateMany(
      { rating: { $exists: false } },
      { $set: { rating: 1200 }, $unset: { difficulty: "" } },
    );
    results.questionsRating = qRating.modifiedCount;

    // 3. Fix Notifications: type (default info)
    try {
      const nType = await Notification.updateMany(
        { type: { $exists: false } },
        { $set: { type: "info" } },
      );
      results.notificationsType = nType.modifiedCount;
    } catch (err) {
      results.notificationsError = err.message;
      console.error(err);
    }

    // 4. Fix Sessions: createdAt (default now)
    try {
      const sCreated = await Session.updateMany(
        { createdAt: { $exists: false } },
        { $set: { createdAt: new Date() } },
      );
      results.sessionsCreatedAt = sCreated.modifiedCount;
    } catch (err) {
      results.sessionsError = err.message;
      console.error(err);
    }

    res.json({
      success: true,
      message: "Migration completed successfully",
      results,
    });
  } catch (error) {
    console.error("Migration API Failed:", error);
    res.status(500);
    throw new Error("Migration failed: " + error.message, { cause: error });
  }
});

export default { runMigration };
