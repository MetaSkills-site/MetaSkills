/**
 * @file index.js
 * @description Vercel serverless entry point.
 * @architecture Wraps the Express application with database connection logic for serverless invocations.
 */
import app from "../express.js";
import connectDB from "../config/database.js";

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
