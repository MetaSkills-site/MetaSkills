import mongoose from "mongoose";
import "../config/env.js";
import Module from "../models/Module.model.js";

const migrate = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for migration...");

    // Update Modules: isComplete (default false)
    const mComplete = await Module.updateMany(
      { isComplete: { $exists: false } },
      { $set: { isComplete: false } },
    );
    console.log(
      `Modules: Set isComplete=false for ${mComplete.modifiedCount} docs`,
    );

    console.log("---------------------------------------------------");
    console.log("Migration completed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
