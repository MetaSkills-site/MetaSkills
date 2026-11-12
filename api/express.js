/**
 * @file express.js
 * @description Express application configuration, setting up middleware, routes, and error handling.
 * @architecture Serves as the main HTTP pipeline router for the backend system.
 */
import express from "express";
import connectDB, {
  checkDatabaseHealth,
  isServerShuttingDown,
} from "./config/database.js";
import userRoute from "./routes/user.routes.js";
import quizRoute from "./routes/quiz.routes.js";
import adminRoute from "./routes/admin.routes.js";
import uploadRoute from "./routes/upload.routes.js";
import backupRoute from "./routes/backup.routes.js";
import contextAttachmentsRoute from "./routes/contextAttachments.routes.js";
import passagesRoute from "./routes/passages.routes.js";
import vocabularyRoute from "./routes/vocabulary.routes.js";
import mathRoute from "./routes/math.routes.js";
import adminAnalyticsRoute from "./routes/adminAnalytics.route.js";
import genaiRoute from "./routes/genai.routes.js";
import errorRoute from "./routes/error.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
import clientblock, { setCorsHeaders } from "./middlewares/clientblock.js";
import cookieParser from "cookie-parser";

const app = express();

app.set("trust proxy", 1);

export const stage = process.env.NODE_ENV || "development";

// Dual-tier health probes — registered BEFORE clientblock & CSRF so orchestrators and load balancers can probe without restriction
const livenessHandler = (_req, res) => {
  res.status(200).json({ status: "UP", uptime: process.uptime() });
};

const readinessHandler = async (_req, res) => {
  if (isServerShuttingDown()) {
    return res
      .status(503)
      .json({ status: "DOWN", reason: "Server is shutting down" });
  }
  const health = await checkDatabaseHealth();
  if (!health.ok) {
    return res.status(503).json({ status: "DOWN", health });
  }
  return res.status(200).json({ status: "READY", health });
};

app.get("/healthz/live", livenessHandler);
app.get("/api/healthz/live", livenessHandler);
app.get("/healthz/ready", readinessHandler);
app.get("/api/healthz/ready", readinessHandler);

// CORS & origin validation — MUST be first to ensure all responses carry CORS headers,
// including error responses from body parsers and the centralized error handler.
import {
  csrfProtection,
  generateCsrfToken,
} from "./middlewares/csrfMiddleware.js";
app.use(clientblock);
app.use(cookieParser());

app.get("/api/csrf-token", generateCsrfToken);
app.use(csrfProtection);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure MongoDB connection is established for serverless invocations and cold starts
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
app.use("/api/users", userRoute);
app.use("/api/quiz", quizRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/backup", backupRoute);
app.use("/api/admin/analytics", adminAnalyticsRoute);
app.use("/api/admin", adminRoute);
app.use("/api/context-attachments", contextAttachmentsRoute);
app.use("/api/passages", passagesRoute);
app.use("/api/vocabulary", vocabularyRoute);
app.use("/api/math", mathRoute);
app.use("/api/genai", genaiRoute);
app.use("/api/errors", errorRoute);

// Error handlers
app.use((req, res) => {
  setCorsHeaders(req, res);
  res.status(404).send("404 NOT FOUND");
});

app.use(errorHandler);

/**
 * @module expressApp
 * @description Serves as the configured Express application instance.
 */
export default app;
