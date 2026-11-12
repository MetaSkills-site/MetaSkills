import "../config/env.js";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

process.env.JWT_SECRET = "supersecret_for_testing";

let mongoServer;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    uri = mongoServer.getUri();
  }

  await mongoose.connect(uri);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
});

afterAll(async () => {
  // Wait briefly for any pending operations
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
