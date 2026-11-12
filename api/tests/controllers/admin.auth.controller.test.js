/**
 * @file admin.auth.controller.test.js
 * @description Unit and Integration tests for admin authentication controller.
 * @architecture Validates Google OAuth login flow and checkAuth for admins.
 */

// RESPONSE MAP (from reading controller source)
// POST /api/admin/auth/google -> 500 { message } (missing client ID)
// POST /api/admin/auth/google -> 400 { message } (missing credential)
// POST /api/admin/auth/google -> 400 { message } (missing email/name in payload)
// POST /api/admin/auth/google -> 401 { message } (admin not found in DB)
// POST /api/admin/auth/google -> 200 { token, message } (success)
// POST /api/admin/auth/google -> 401 { message } (auth failed / exception)
// GET /api/admin/auth/check -> 200 { token } (success)
// GET /api/admin/auth/check -> 401 { message } (admin validation failed)

import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import adminAuthController from "../../controllers/admin.auth.controller.js";
import errorHandler from "../../middlewares/errorHandler.js";
import Admin from "../../models/admin.model.js";
import Session from "../../models/session.model.js";

describe("Admin Auth Controller", () => {
  let app;
  let verifySpy;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Setup routes
    app.post("/api/admin/auth/google", adminAuthController.googleAuth);
    app.get(
      "/api/admin/auth/check",
      (req, res, next) => {
        // Mock protectAdmin middleware behavior
        req.admin = { _id: new mongoose.Types.ObjectId() };
        next();
      },
      adminAuthController.checkAuth,
    );

    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();

      verifySpy = jest.spyOn(OAuth2Client.prototype, "verifyIdToken");
      process.env.VITE_GOOGLE_CLIENT_ID = "test-client-id";
      process.env.JWT_SECRET = "testsecret";
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("POST /api/admin/auth/google", () => {
      it("should return 500 if Google Client ID is missing", async () => {
        delete process.env.VITE_GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_ID;

        const res = await request(app)
          .post("/api/admin/auth/google")
          .send({ credential: "mock-token" });

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/Server configuration error/);
      });

      it("should return 400 if credential is missing", async () => {
        const res = await request(app).post("/api/admin/auth/google").send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Google credential is required/);
      });

      it("should return 400 if token payload is missing email or name", async () => {
        verifySpy.mockResolvedValue({
          getPayload: () => ({ email: null, name: "Test" }),
        });

        const res = await request(app)
          .post("/api/admin/auth/google")
          .send({ credential: "mock-token" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/missing required fields/);
      });

      it("should return 401 if admin does not exist in DB", async () => {
        verifySpy.mockResolvedValue({
          getPayload: () => ({ email: "notadmin@test.com", name: "Test" }),
        });
        jest.spyOn(Admin, "findOne").mockResolvedValue(null);

        const res = await request(app)
          .post("/api/admin/auth/google")
          .send({ credential: "mock-token" });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/not authorized/);
      });

      it("should return 401 and handle DB error during findOne", async () => {
        verifySpy.mockResolvedValue({
          getPayload: () => ({ email: "error@test.com", name: "Test" }),
        });
        jest.spyOn(Admin, "findOne").mockRejectedValue(new Error("DB Error"));

        const res = await request(app)
          .post("/api/admin/auth/google")
          .send({ credential: "mock-token" });

        expect(res.status).toBe(401);
      });

      it("should return 401 and handle DB error during admin update", async () => {
        verifySpy.mockResolvedValue({
          getPayload: () => ({ email: "admin@test.com", name: "Test" }),
        });
        const mockAdmin = {
          _id: new mongoose.Types.ObjectId(),
          save: jest.fn().mockRejectedValue(new Error("Update Error")),
        };
        jest.spyOn(Admin, "findOne").mockResolvedValue(mockAdmin);

        const res = await request(app)
          .post("/api/admin/auth/google")
          .send({ credential: "mock-token" });

        expect(res.status).toBe(401);
      });
    });

    describe("GET /api/admin/auth/check", () => {
      it("should return 401 if fresh admin is not found in DB", async () => {
        jest.spyOn(Admin, "findById").mockResolvedValue(null);

        const res = await request(app).get("/api/admin/auth/check");

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Admin validation failed");
      });

      it("should handle DB error during findById", async () => {
        jest.spyOn(Admin, "findById").mockRejectedValue(new Error("DB Error"));

        const res = await request(app).get("/api/admin/auth/check");

        expect(res.status).not.toBe(200);
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      await Admin.deleteMany({});
      await Session.deleteMany({});
      jest.clearAllMocks();

      verifySpy = jest.spyOn(OAuth2Client.prototype, "verifyIdToken");
      process.env.VITE_GOOGLE_CLIENT_ID = "test-client-id";
      process.env.JWT_SECRET = "testsecret";
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("POST /api/admin/auth/google", () => {
      it("should return 200 and a token if admin exists", async () => {
        const admin = await Admin.create({
          fullname: "Old Name",
          email: "admin@test.com",
          role: "admin",
        });

        verifySpy.mockResolvedValue({
          getPayload: () => ({
            email: "admin@test.com",
            name: "New Google Name",
          }),
        });

        const res = await request(app)
          .post("/api/admin/auth/google")
          .send({ credential: "mock-token" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Admin logged in successfully");

        // Verify DB was updated
        const updatedAdmin = await Admin.findById(admin._id);
        expect(updatedAdmin.fullname).toBe("New Google Name");

        const session = await Session.findOne({ id: admin._id });
        expect(session).toBeTruthy();
        expect(session.onModel).toBe("Admin");
        expect(session.token).toBeTruthy();
      });
    });

    describe("GET /api/admin/auth/check", () => {
      it("should return 200 and a fresh token if admin exists", async () => {
        const admin = await Admin.create({
          fullname: "Admin User",
          email: "admin@test.com",
          role: "admin",
        });

        const testApp = express();
        testApp.use(express.json());
        testApp.get(
          "/api/admin/auth/check",
          (req, res, next) => {
            req.admin = { _id: admin._id };
            next();
          },
          adminAuthController.checkAuth,
        );
        testApp.use(errorHandler);

        const res = await request(testApp).get("/api/admin/auth/check");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const session = await Session.findOne({ id: admin._id });
        expect(session.token).toBeTruthy();
      });
    });
  });
});
