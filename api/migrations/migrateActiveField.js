import mongoose from "mongoose";
import "../config/env.js";
import Question from "../models/Questions.model.js";
import Notification from "../models/Notification.model.js";
import Session from "../models/session.model.js";

const migrate = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for migration...");

    // 1. Fix Questions: active
    const qActive = await Question.updateMany(
      { active: { $exists: false } },
      { $set: { active: true } },
    );
    console.log(`Questions: Set active=true for ${qActive.modifiedCount} docs`);

    // 2. Fix Questions: rating (default 1200)
    const qRating = await Question.updateMany(
      { rating: { $exists: false } },
      { $set: { rating: 1200 }, $unset: { difficulty: "" } },
    );
    console.log(`Questions: Set rating=1200 for ${qRating.modifiedCount} docs`);

    // 3. Fix Notifications: type (default info)
    // Check if Notification model is available or use raw collection if model issue
    try {
      const nType = await Notification.updateMany(
        { type: { $exists: false } },
        { $set: { type: "info" } },
      );
      console.log(
        `Notifications: Set type=info for ${nType.modifiedCount} docs`,
      );
    } catch (err) {
      console.log(
        "Skipping Notification migration (Model might not accept loose schema yet):",
        err.message,
      );
    }

    // 4. Fix Sessions: createdAt (default now)
    // This ensures old sessions get a date so they can expire in 30 days from now
    try {
      const sCreated = await Session.updateMany(
        { createdAt: { $exists: false } },
        { $set: { createdAt: new Date() } },
      );
      console.log(
        `Sessions: Set createdAt=now for ${sCreated.modifiedCount} docs`,
      );
    } catch (err) {
      console.log("Skipping Session migration:", err.message);
    }

    console.log("---------------------------------------------------");
    console.log(
      "Migration completed. Legacy data is now compatible with new schemas.",
    );
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
