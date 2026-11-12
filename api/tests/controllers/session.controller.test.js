/**
 * @file session.controller.test.js
 * @description Tests for session controller, separated into Unit (mocked DB) and
 *              Integration (real DB) suites.
 * @architecture Validates session retrieval and deletion functionalities for admins.
 */

// RESPONSE MAP (from reading controller source)
// GET  /api/sessions       -> 200 [ sessions... ]
// DELETE /api/sessions     -> 400 { message: "Session ID is required" }
// DELETE /api/sessions     -> 404 { message: "Session not found" }
// DELETE /api/sessions     -> 200 { message: "Session deleted successfully" }
// DELETE /api/sessions/all -> 200 { message: "All sessions cleared successfully" }

import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import sessionController from "../../controllers/session.controller.js";
import errorHandler from "../../middlewares/errorHandler.js";
import Session from "../../models/session.model.js";
import User from "../../models/user.model.js";

describe("Session Controller", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Route order matters: /all must be registered before the generic DELETE /
    app.delete("/api/sessions/all", sessionController.deleteAllSessions);
    app.get("/api/sessions", sessionController.getActiveSessions);
    app.delete("/api/sessions", sessionController.deleteSession);

    app.use(errorHandler);
  });

  // ---------------------------------------------------------------------------
  // UNIT TESTS — DB is mocked via jest.spyOn; no real Mongoose I/O.
  //
  // Covers: input validation, error-path branching, and how the controller
  // reacts when the DB behaves unexpectedly (throws / returns null).
  // ---------------------------------------------------------------------------
  describe("Unit Tests", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    // ── GET /api/sessions ────────────────────────────────────────────────────
    describe("GET /api/sessions", () => {
      it("should return 200 and the mocked session list", async () => {
        const mockSessions = [
          { token: "mock-token", id: { email: "test@test.com" } },
        ];
        const mockPopulate = jest.fn().mockResolvedValue(mockSessions);
        jest.spyOn(Session, "find").mockReturnValue({ populate: mockPopulate });

        const res = await request(app).get("/api/sessions");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockSessions);
        expect(Session.find).toHaveBeenCalled();
        expect(mockPopulate).toHaveBeenCalledWith(
          "id",
          "fullname email profilePicture profileImageData grade",
        );
      });

      it("should return 500 when Session.find throws synchronously", async () => {
        jest.spyOn(Session, "find").mockImplementation(() => {
          throw new Error("DB Error");
        });

        const res = await request(app).get("/api/sessions");

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/DB Error/);
      });

      it("should return 500 when Session.find().populate() rejects", async () => {
        const mockPopulate = jest
          .fn()
          .mockRejectedValue(new Error("Populate failed"));
        jest.spyOn(Session, "find").mockReturnValue({ populate: mockPopulate });

        const res = await request(app).get("/api/sessions");

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/Populate failed/);
      });
    });

    // ── DELETE /api/sessions ─────────────────────────────────────────────────
    describe("DELETE /api/sessions", () => {
      it("should return 400 when session ID is missing", async () => {
        const res = await request(app).delete("/api/sessions").send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Session ID is required/);
      });

      it("should return 404 when Session.findById returns null", async () => {
        jest.spyOn(Session, "findById").mockResolvedValue(null);

        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
          .delete("/api/sessions")
          .send({ id: fakeId });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Session not found/);
      });

      it("should return 200 and call deleteOne when a valid ID is provided", async () => {
        const mockSession = {
          deleteOne: jest.fn().mockResolvedValue({}),
        };
        jest.spyOn(Session, "findById").mockResolvedValue(mockSession);

        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
          .delete("/api/sessions")
          .send({ id: fakeId });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/Session deleted successfully/);
        expect(mockSession.deleteOne).toHaveBeenCalled();
      });

      it("should return 500 when Session.findById rejects", async () => {
        jest
          .spyOn(Session, "findById")
          .mockRejectedValue(new Error("DB Error"));

        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
          .delete("/api/sessions")
          .send({ id: fakeId });

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/DB Error/);
      });

      it("should return 500 when session.deleteOne rejects", async () => {
        const mockSession = {
          deleteOne: jest.fn().mockRejectedValue(new Error("deleteOne failed")),
        };
        jest.spyOn(Session, "findById").mockResolvedValue(mockSession);

        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
          .delete("/api/sessions")
          .send({ id: fakeId });

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/deleteOne failed/);
      });
    });

    // ── DELETE /api/sessions/all ─────────────────────────────────────────────
    describe("DELETE /api/sessions/all", () => {
      it("should return 200 and call Session.deleteMany({})", async () => {
        jest
          .spyOn(Session, "deleteMany")
          .mockResolvedValue({ deletedCount: 5 });

        const res = await request(app).delete("/api/sessions/all");

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/All sessions cleared successfully/);
        expect(Session.deleteMany).toHaveBeenCalledWith({});
      });

      it("should return 500 when Session.deleteMany rejects", async () => {
        jest
          .spyOn(Session, "deleteMany")
          .mockRejectedValue(new Error("DB Error"));

        const res = await request(app).delete("/api/sessions/all");

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/DB Error/);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // INTEGRATION TESTS — hit the real test database (MongoDB Atlas / local).
  //
  // Covers: Mongoose schema constraints (unique token index, required fields),
  // populate joins, and end-to-end DB state verification after mutations.
  // ---------------------------------------------------------------------------
  describe("Integration Tests", () => {
    beforeAll(async () => {
      await Session.init();
    });

    beforeEach(async () => {
      // Start each test with a clean slate
      await Session.deleteMany({});
      await User.deleteMany({});
    });

    // ── GET /api/sessions ────────────────────────────────────────────────────
    describe("GET /api/sessions", () => {
      it("should return 200 with populated user data for active sessions", async () => {
        const user = await User.create({
          fullname: "Test User",
          email: "test@test.com",
          profilePicture: "default.png",
        });

        await Session.create({
          id: user._id,
          onModel: "User",
          token: "mock-token",
        });

        const res = await request(app).get("/api/sessions");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);

        const session = res.body[0];
        expect(session.token).toBe("mock-token");
        expect(session.id).toBeDefined();
        expect(session.id.email).toBe("test@test.com");
        expect(session.id.fullname).toBe("Test User");
      });

      it("should return 200 with an empty array when no sessions exist", async () => {
        const res = await request(app).get("/api/sessions");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
      });

      it("should enforce the unique (id, onModel) index — reject duplicate session", async () => {
        const userId = new mongoose.Types.ObjectId();

        await Session.create({
          id: userId,
          onModel: "User",
          token: "token-first",
        });

        await expect(
          Session.create({
            id: userId,
            onModel: "User",
            token: "token-dupe",
          }),
        ).rejects.toThrow();
      });
    });

    // ── DELETE /api/sessions ─────────────────────────────────────────────────
    describe("DELETE /api/sessions", () => {
      it("should return 200 and remove the session document from the DB", async () => {
        const session = await Session.create({
          id: new mongoose.Types.ObjectId(),
          onModel: "User",
          token: "token-to-delete",
        });

        const res = await request(app)
          .delete("/api/sessions")
          .send({ id: session._id });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/Session deleted successfully/);

        // Verify the document is gone
        const check = await Session.findById(session._id);
        expect(check).toBeNull();
      });
    });

    // ── DELETE /api/sessions/all ─────────────────────────────────────────────
    describe("DELETE /api/sessions/all", () => {
      it("should return 200 and remove every session document from the DB", async () => {
        await Session.create({
          id: new mongoose.Types.ObjectId(),
          onModel: "User",
          token: "token-1",
        });
        await Session.create({
          id: new mongoose.Types.ObjectId(),
          onModel: "User",
          token: "token-2",
        });

        const res = await request(app).delete("/api/sessions/all");

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/All sessions cleared successfully/);

        // Verify all documents removed
        const count = await Session.countDocuments();
        expect(count).toBe(0);
      });
    });
  });
});
