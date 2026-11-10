/**
 * @file server.js
 * @description Application entry point. Initializes the database connection and starts the Express server.
 * @architecture Boots up the node process, orchestrating the database connection and HTTP listener.
 */
import "./config/env.js";
import { fileURLToPath } from "node:url";

import app from "./express.js";
import connectDB, { disconnectDB, setShuttingDown } from "./config/database.js";

const port = process.env.PORT || 7860;

export const start = async () => {
  await connectDB();
  const server = app.listen(port, (error) => {
    if (error) console.log(error);
    console.info("Server started on port %s.", port);
  });

  // Graceful shutdown handling (drain connections, disconnect DB, fallback timeout)
  let isShuttingDown = false;
  const gracefulShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    setShuttingDown(true);
    console.log(`Received ${signal}. Draining connections...`);

    server.close(async () => {
      console.log("HTTP server closed. Disconnecting database...");
      try {
        await disconnectDB();
      } catch (err) {
        console.error("Error during database disconnect:", err);
      }
      process.exit(0);
    });

    // Forced exit fallback after 10s
    setTimeout(() => {
      console.error("Forced exit: Graceful shutdown timed out.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  return server;
};

if (!process.env.VERCEL && process.argv[1] === fileURLToPath(import.meta.url)) {
  start();
}

export const handler = app;
export default app;
