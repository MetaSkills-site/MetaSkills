import "../config/env.js";
import mongoose from "mongoose";


process.env.JWT_SECRET = "supersecret_for_testing";

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Use the custom URI provided by user
  let uri = process.env.MONGODB_URI || "mongodb+srv://jimfleax:jimfleax@local.f18dsim.mongodb.net/?appName=Local";

  if (uri.includes("mongodb+srv")) {
    // Atlas URI: replace db name before query params
    uri = uri.replace(/\/?(\?|$)/, "/Local_test$1");
  } else if (!uri.includes("test")) {
    const parts = uri.split("/");
    const dbName = parts.pop() || "";
    uri = [...parts, dbName + "_test"].join("/");
  }

  await mongoose.connect(uri);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
});

afterAll(async () => {
  // Wait briefly for any pending operations
  await new Promise(resolve => setTimeout(resolve, 500));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
