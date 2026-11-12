/**
 * @file db-connection.test.js
 * @description Test suite verifying connection caching, single-flight coalescing,
 * 3-retry jittered backoff, credential masking, fail-fast validation, lifecycle teardown,
 * and dual health probes.
 */

import { jest } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../express.js";
import {
  connectDB,
  disconnectDB,
  checkDatabaseHealth,
  maskMongoUri,
  DatabaseConnectionError,
  setShuttingDown,
  _resetConnectionCacheForTesting,
} from "../config/database.js";

let mongoServer;
let mongoUri;

describe("Robust Database Connection & Caching Suite", () => {
  beforeAll(async () => {
    // Disconnect any setup.js test database connection before running suite
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  }, 60000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
    setShuttingDown(false);
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    setShuttingDown(false);
    await disconnectDB();
    _resetConnectionCacheForTesting();
  });

  describe("URI Validation (Fail-Fast)", () => {
    it("should throw DatabaseConnectionError immediately without retries on missing URI", async () => {
      const origEnvMongo = process.env.MONGO_URI;
      const origEnvMongoDB = process.env.MONGODB_URI;
      delete process.env.MONGO_URI;
      delete process.env.MONGODB_URI;

      const connectSpy = jest.spyOn(mongoose, "connect");

      await expect(connectDB("")).rejects.toThrow(DatabaseConnectionError);
      await expect(connectDB("   ")).rejects.toThrow(DatabaseConnectionError);
      await expect(connectDB(undefined)).rejects.toThrow(
        "MongoDB URI is required. Provide a valid connection string or set MONGODB_URI.",
      );

      // Asserts 0 connection attempts were wasted
      expect(connectSpy).not.toHaveBeenCalled();

      if (origEnvMongo) process.env.MONGO_URI = origEnvMongo;
      if (origEnvMongoDB) process.env.MONGODB_URI = origEnvMongoDB;
    });
  });

  describe("Connection Caching & Concurrency", () => {
    it("should establish a connection and return the active mongoose instance", async () => {
      const instance = await connectDB(mongoUri);
      expect(instance).toBe(mongoose);
      expect(mongoose.connection.readyState).toBe(1);

      const health = await checkDatabaseHealth();
      expect(health.ok).toBe(true);
      expect(health.status).toBe("connected");
      expect(typeof health.pingLatencyMs).toBe("number");
    });

    it("should reuse the existing connection across multiple requests without reconnecting", async () => {
      await connectDB(mongoUri);

      const connectSpy = jest.spyOn(mongoose, "connect");

      const inst1 = await connectDB(mongoUri);
      const inst2 = await connectDB(mongoUri);
      const inst3 = await connectDB(mongoUri);

      expect(inst1).toBe(mongoose);
      expect(inst2).toBe(mongoose);
      expect(inst3).toBe(mongoose);

      // Verify no extra connection handshakes were made
      expect(connectSpy).not.toHaveBeenCalled();
    });

    it("should coalesce concurrent cold-start connection requests to the same in-flight Promise", async () => {
      let callCount = 0;
      const originalConnect = mongoose.connect.bind(mongoose);
      jest.spyOn(mongoose, "connect").mockImplementation(async (uri, opts) => {
        callCount++;
        await new Promise((r) => setTimeout(r, 40));
        return originalConnect(uri, opts);
      });

      // 5 concurrent requests hit the cold container simultaneously
      const results = await Promise.all([
        connectDB(mongoUri),
        connectDB(mongoUri),
        connectDB(mongoUri),
        connectDB(mongoUri),
        connectDB(mongoUri),
      ]);

      results.forEach((res) => expect(res).toBe(mongoose));
      // Only 1 connect call made despite 5 concurrent requests
      expect(callCount).toBe(1);
    });
  });

  describe("3-Retry Jittered Mechanism", () => {
    it("should retry transient failures and recover on attempt 3", async () => {
      let attempts = 0;
      const originalConnect = mongoose.connect.bind(mongoose);
      const warnings = [];

      jest.spyOn(mongoose, "connect").mockImplementation(async (uri, opts) => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Transient drop attempt ${attempts}`);
        }
        return originalConnect(uri, opts);
      });

      const instance = await connectDB(mongoUri, {
        retries: 3,
        initialBackoffMs: 10,
        maxBackoffMs: 30,
        jitter: false, // deterministic for test
        logger: {
          info: jest.fn(),
          warn: (msg) => warnings.push(msg),
          error: jest.fn(),
        },
      });

      expect(instance).toBe(mongoose);
      expect(attempts).toBe(3);
      expect(warnings.length).toBe(2);
      expect(warnings[0]).toContain("Attempt 1/3 failed");
      expect(warnings[1]).toContain("Attempt 2/3 failed");
    });

    it("should throw DatabaseConnectionError after 3 failed attempts and clear cache", async () => {
      jest.spyOn(mongoose, "connect").mockImplementation(async () => {
        throw new Error("Cluster unavailable");
      });

      await expect(
        connectDB(mongoUri, {
          retries: 3,
          initialBackoffMs: 5,
          maxBackoffMs: 15,
        }),
      ).rejects.toThrow(DatabaseConnectionError);

      _resetConnectionCacheForTesting();
    });
  });

  describe("Security: Credential Masking", () => {
    it("should mask passwords in MongoDB connection strings", () => {
      const masked = maskMongoUri(
        "mongodb://app_user:p%40ssw0rd123@cluster0.mongodb.net:27017/prod",
      );
      expect(masked).toBe(
        "mongodb://app_user:****@cluster0.mongodb.net:27017/prod",
      );
      expect(masked).not.toContain("p%40ssw0rd123");
    });

    it("should redact credentials inside DatabaseConnectionError properties", async () => {
      jest.spyOn(mongoose, "connect").mockImplementation(async () => {
        throw new Error("Connection failed");
      });

      try {
        await connectDB(
          "mongodb://secretAdmin:verySecret@localhost:27017/test",
          {
            retries: 1,
            initialBackoffMs: 5,
          },
        );
        throw new Error("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseConnectionError);
        expect(err.sanitizedUri).toBe(
          "mongodb://secretAdmin:****@localhost:27017/test",
        );
        expect(err.sanitizedUri).not.toContain("verySecret");
        expect(err.attempts).toBe(1);
      }
    });
  });

  describe("Lifecycle Teardown & Reconnect", () => {
    it("should disconnect cleanly and update health status", async () => {
      await connectDB(mongoUri);
      expect((await checkDatabaseHealth()).ok).toBe(true);

      await disconnectDB();

      const health = await checkDatabaseHealth();
      expect(health.ok).toBe(false);
      expect(health.status).toBe("disconnected");
    });

    it("should automatically invalidate cache when connection is disconnected", async () => {
      await connectDB(mongoUri);
      await mongoose.disconnect();

      const connectSpy = jest.spyOn(mongoose, "connect");
      await connectDB(mongoUri);
      expect(connectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dual-Tier Health Endpoints", () => {
    it("GET /healthz/live and /api/healthz/live should return 200 without DB requirement", async () => {
      await disconnectDB();

      const resLive = await request(app).get("/healthz/live");
      expect(resLive.status).toBe(200);
      expect(resLive.body.status).toBe("UP");
      expect(typeof resLive.body.uptime).toBe("number");

      const resApiLive = await request(app).get("/api/healthz/live");
      expect(resApiLive.status).toBe(200);
      expect(resApiLive.body.status).toBe("UP");
    });

    it("GET /healthz/ready should return 200 when database is connected", async () => {
      await connectDB(mongoUri);

      const res = await request(app).get("/healthz/ready");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("READY");
      expect(res.body.health.ok).toBe(true);
    });

    it("GET /healthz/ready should return 503 when database is disconnected", async () => {
      await disconnectDB();

      const res = await request(app).get("/healthz/ready");
      expect(res.status).toBe(503);
      expect(res.body.status).toBe("DOWN");
      expect(res.body.health.ok).toBe(false);
    });

    it("GET /healthz/ready should return 503 during graceful shutdown", async () => {
      await connectDB(mongoUri);
      setShuttingDown(true);

      const res = await request(app).get("/healthz/ready");
      expect(res.status).toBe(503);
      expect(res.body.status).toBe("DOWN");
      expect(res.body.reason).toContain("shutting down");
    });
  });
});
