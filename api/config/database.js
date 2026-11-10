/**
 * @file database.js
 * @description Framework-agnostic robust MongoDB/Mongoose connection manager.
 * @architecture Initializes and manages the Mongoose connection lifecycle across serverless and stateful environments.
 *
 * Features:
 *   - Global connection caching via globalThis (survives serverless warm starts)
 *   - Single-flight coalescing (concurrent calls share one in-flight connect)
 *   - 3-retry exponential backoff with Full Jitter
 *   - Credential masking in all logs and error objects
 *   - Fail-fast URI validation (no retries wasted on invalid config)
 *   - Dual URI resolution (MONGODB_URI or MONGO_URI)
 *   - Automatic IPv4 fallback on ETIMEDOUT / ENETUNREACH
 *   - Connection lifecycle event listeners with cache invalidation
 *   - Dual-tier health probes support and graceful teardown
 *   - Test helper to reset cache between test runs
 */

import mongoose from "mongoose";

// ─── Global Cache ────────────────────────────────────────────────────
// Scoped to __metaSkillsMongooseCache to prevent collisions across processes
const getCache = () => {
  if (!globalThis.__metaSkillsMongooseCache) {
    globalThis.__metaSkillsMongooseCache = { conn: null, promise: null };
  }
  return globalThis.__metaSkillsMongooseCache;
};

// ─── Custom Error ────────────────────────────────────────────────────

export class DatabaseConnectionError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: unknown, attempts?: number, uri?: string }} [options]
   */
  constructor(message, options) {
    super(message);
    this.name = "DatabaseConnectionError";
    this.attempts = options?.attempts ?? 0;
    this.sanitizedUri = options?.uri;
    if (options?.cause) this.cause = options.cause;
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }
}

// ─── Credential Masking ──────────────────────────────────────────────

export function maskMongoUri(uri) {
  if (!uri || typeof uri !== "string") return "";
  try {
    return uri.replace(/\/\/(.*?)@/, (_match, creds) => {
      const parts = creds.split(":");
      return parts.length >= 2 ? `//${parts[0]}:****@` : `//****@`;
    });
  } catch {
    return "mongodb://[masked]";
  }
}

// ─── State & Flags ───────────────────────────────────────────────────

let listenersAttached = false;
let activeLogger = console;
let isShuttingDown = false;
let forceIPv4 = false;

export function setShuttingDown(val = true) {
  isShuttingDown = val;
}

export function isServerShuttingDown() {
  return isShuttingDown;
}

// ─── Connection Lifecycle Listeners ──────────────────────────────────

function setupConnectionListeners(logger) {
  activeLogger = logger || console;
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    activeLogger.info?.("[MongoDB] Connection established successfully.");
  });
  mongoose.connection.on("error", (err) => {
    activeLogger.error?.("[MongoDB] Runtime connection error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    activeLogger.warn?.("[MongoDB] Connection lost. Invalidating cache.");
    const cache = getCache();
    cache.conn = null;
    cache.promise = null;
  });
}

// ─── Connect (with retry, caching, coalescing) ──────────────────────

/**
 * Connect to MongoDB with connection pooling, caching, coalescing, and exponential backoff retry.
 * @param {string} [uri] - MongoDB connection string (defaults to MONGODB_URI or MONGO_URI env)
 * @param {Object|number} [optionsOrRetries=3] - Options object or number of retries
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB(uri, optionsOrRetries = 3) {
  const options =
    typeof optionsOrRetries === "number" ? { retries: optionsOrRetries } : optionsOrRetries || {};

  const targetUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI;

  // Fail-fast: validate URI before any retry attempts
  if (!targetUri || typeof targetUri !== "string" || targetUri.trim() === "") {
    throw new DatabaseConnectionError(
      "MongoDB URI is required. Provide a valid connection string or set MONGODB_URI.",
      { attempts: 0, uri: "" }
    );
  }

  const cache = getCache();
  const logger = options.logger ?? console;

  // 1. Reuse existing connection if active
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;
  if (mongoose.connection.readyState === 1) {
    cache.conn = mongoose;
    return mongoose;
  }

  // 2. Coalesce concurrent connection attempts (single-flight pattern)
  if (cache.promise) return cache.promise;

  // 3. Initiate retry mechanism with Full Jitter backoff
  const retries = options.retries ?? 3;
  const initialBackoffMs = options.initialBackoffMs ?? 1000;
  const maxBackoffMs = options.maxBackoffMs ?? 5000;
  const useJitter = options.jitter ?? true;

  setupConnectionListeners(logger);

  cache.promise = (async () => {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const isServerless = Boolean(process.env.VERCEL);
        const defaultOptions = {
          maxPoolSize: isServerless ? 2 : 10,
          minPoolSize: isServerless ? 0 : 2,
          serverSelectionTimeoutMS: isServerless ? 3000 : 5000,
          socketTimeoutMS: isServerless ? 30000 : 45000,
          bufferCommands: false,
          ...(forceIPv4 ? { family: 4 } : {}),
          ...options.mongooseOptions,
        };

        await mongoose.connect(targetUri, defaultOptions);
        cache.conn = mongoose;
        return mongoose;
      } catch (err) {
        lastError = err;
        cache.conn = null;

        // Auto IPv4 fallback detection
        if (
          !forceIPv4 &&
          (err?.message?.includes("ETIMEDOUT") || err?.message?.includes("ENETUNREACH"))
        ) {
          logger.warn?.("[MongoDB] IPv6 connection failure detected. Switching to IPv4 fallback...");
          forceIPv4 = true;
        }

        if (attempt < retries) {
          const expDelay = Math.min(initialBackoffMs * 2 ** (attempt - 1), maxBackoffMs);
          const delay = useJitter ? Math.floor(Math.random() * expDelay) + 50 : expDelay;
          logger.warn?.(
            `[MongoDB] Attempt ${attempt}/${retries} failed: ${err?.message || String(err)}. Retrying in ${delay}ms...`
          );
          await new Promise((r) => setTimeout(r, delay));
        } else {
          logger.error?.(
            `[MongoDB] Connection failed after ${retries} attempts: ${err?.message || String(err)}`
          );
        }
      }
    }

    cache.promise = null;
    throw new DatabaseConnectionError(
      `Failed to connect to MongoDB after ${retries} attempts. Cause: ${lastError?.message || String(lastError)}`,
      { cause: lastError, attempts: retries, uri: maskMongoUri(targetUri) }
    );
  })();

  try {
    return await cache.promise;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    throw error;
  }
}

// ─── Disconnect ──────────────────────────────────────────────────────

export async function disconnectDB() {
  const cache = getCache();
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } finally {
    cache.conn = null;
    cache.promise = null;
  }
}

// ─── Health Check ────────────────────────────────────────────────────

export async function checkDatabaseHealth() {
  const state = mongoose.connection.readyState;
  const statusNames = ["disconnected", "connected", "connecting", "disconnecting"];
  const status = statusNames[state] || "unknown";

  if (state !== 1 || !mongoose.connection.db) {
    return { ok: false, readyState: state, status };
  }

  try {
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    return { ok: true, readyState: state, status, pingLatencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, readyState: state, status, error: err.message };
  }
}

// ─── Test Helper ─────────────────────────────────────────────────────

export function _resetConnectionCacheForTesting() {
  const cache = getCache();
  cache.conn = null;
  cache.promise = null;
}

export default connectDB;
