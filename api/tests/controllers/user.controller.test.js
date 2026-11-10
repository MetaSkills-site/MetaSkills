/**
 * @file user.controller.test.js
 * @description Unit and Integration tests for user controller.
 * @architecture Validates user authentication, profile management, and admin operations.
 */

import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import userController from "../../controllers/user.controller.js";
import errorHandler from "../../middlewares/errorHandler.js";
import User from "../../models/user.model.js";
import Session from "../../models/session.model.js";

describe("User Controller", () => {
  let app;
  let mockUser;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Setup routes
    app.post("/api/users/logout", (req, res, next) => {
      req.user = mockUser;
      req.headers.authorization = "Bearer mock-token";
      next();
    }, userController.deleteSession);

    app.post("/api/users/google-auth", userController.googleAuth);
    app.post("/api/users/dev-login", userController.devLogin);
    
    app.post("/api/users/complete-profile", (req, res, next) => {
      req.user = mockUser;
      next();
    }, userController.completeProfile);
    
    app.get("/api/users", userController.getAllUsers);

    app.put("/api/users/profile", (req, res, next) => {
      req.user = mockUser;
      next();
    }, userController.updateUser);

    app.get("/api/users/me", (req, res, next) => {
      req.user = mockUser;
      req.headers.authorization = "Bearer mock-token";
      next();
    }, userController.read);

    app.delete("/api/users/:id", userController.deleteUser);
    app.put("/api/users/:id", userController.updateUserById);
    app.get("/api/users/:id", userController.getUser);
    
    app.get("/api/users/carrots/me", (req, res, next) => {
      req.user = mockUser;
      next();
    }, userController.getCarrots);

    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    let verifySpy;
    
    beforeEach(() => {
      jest.clearAllMocks();
      verifySpy = jest.spyOn(OAuth2Client.prototype, "verifyIdToken");
      process.env.VITE_GOOGLE_CLIENT_ID = "test-client-id";
      process.env.JWT_SECRET = "testsecret";
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("POST /api/users/google-auth", () => {
      it("should return 400 if credential is missing", async () => {
        const res = await request(app).post("/api/users/google-auth").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Google credential is required/);
      });

      it("should return 401 if DB throws an error during findOne", async () => {
        verifySpy.mockResolvedValue({
          getPayload: () => ({ email: "test@test.com", name: "Test User" }),
        });
        jest.spyOn(User, "findOne").mockRejectedValue(new Error("Database failure"));
        
        const res = await request(app)
          .post("/api/users/google-auth")
          .send({ credential: "mock-token" });
        
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Google authentication failed/);
      });
    });

    describe("POST /api/users/complete-profile", () => {
      it("should return 400 if grade is missing", async () => {
        const res = await request(app).post("/api/users/complete-profile").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Grade is required/);
      });
      
      it("should return 500 if save throws error", async () => {
        mockUser = { _id: new mongoose.Types.ObjectId(), save: jest.fn().mockRejectedValue(new Error("Save failed")) };
        const res = await request(app).post("/api/users/complete-profile").send({ grade: 5 });
        expect(res.status).toBe(500); // errorHandler should catch this
      });
    });

    describe("GET /api/users", () => {
      it("should return 400 if DB fails to count documents", async () => {
        jest.spyOn(User, "countDocuments").mockRejectedValue(new Error("DB count error"));
        const res = await request(app).get("/api/users");
        expect(res.status).toBe(400);
      });
    });
    
    describe("DELETE /api/users/:id", () => {
      it("should return 500 if DB fails during findById", async () => {
        jest.spyOn(User, "findById").mockRejectedValue(new Error("Find failed"));
        const res = await request(app).delete(`/api/users/${new mongoose.Types.ObjectId()}`);
        expect(res.status).toBe(500);
      });
    });
  });

  describe("Integration Tests", () => {
    let verifySpy;
    
    beforeEach(async () => {
      await User.deleteMany({});
      await Session.deleteMany({});
      jest.clearAllMocks();
      
      verifySpy = jest.spyOn(OAuth2Client.prototype, "verifyIdToken");
      process.env.VITE_GOOGLE_CLIENT_ID = "test-client-id";
      process.env.JWT_SECRET = "testsecret";
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("POST /api/users/google-auth", () => {
      it("should return 401 if token payload is missing email or name", async () => {
        verifySpy.mockResolvedValue({
          getPayload: () => ({ email: null, name: "Test" }),
        });
        const res = await request(app)
          .post("/api/users/google-auth")
          .send({ credential: "mock-token" });
        
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/missing required fields/);
      });

      it("should create a new user and return 201 if user does not exist", async () => {
        verifySpy.mockResolvedValue({
          getPayload: () => ({ email: "new@test.com", name: "New User", picture: "pic.jpg" }),
        });
        const res = await request(app)
          .post("/api/users/google-auth")
          .send({ credential: "mock-token" });
        
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Account created successfully");

        const user = await User.findOne({ email: "new@test.com" });
        expect(user).toBeTruthy();
        expect(user.fullname).toBe("New User");
        expect(user.grade).toBeUndefined();
      });

      it("should login existing user and return 200", async () => {
        const existingUser = await User.create({
          fullname: "Old Name",
          email: "exist@test.com",
          profilePicture: "",
        });

        verifySpy.mockResolvedValue({
          getPayload: () => ({ email: "exist@test.com", name: "New Name", picture: "pic.jpg" }),
        });

        const res = await request(app)
          .post("/api/users/google-auth")
          .send({ credential: "mock-token" });
        
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Logged in successfully");

        const user = await User.findById(existingUser._id);
        expect(user.fullname).toBe("Old Name");
        expect(user.profilePicture).toBe("pic.jpg");
      });
    });

    describe("POST /api/users/dev-login", () => {
      let originalEnv;

      beforeEach(() => {
        originalEnv = process.env.NODE_ENV;
      });

      afterEach(() => {
        process.env.NODE_ENV = originalEnv;
      });

      it("should return 403 if NODE_ENV is production", async () => {
        process.env.NODE_ENV = "production";
        const res = await request(app).post("/api/users/dev-login");
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Forbidden/);
      });

      it("should return 200 and set authToken cookie if NODE_ENV is test", async () => {
        process.env.NODE_ENV = "test";
        const res = await request(app).post("/api/users/dev-login");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Dev login successful");
        expect(res.body.user.email).toBe("e2e-test-user@metaskills.dev");

        // Verify the user was created in the DB
        const user = await User.findOne({ email: "e2e-test-user@metaskills.dev" });
        expect(user).toBeTruthy();
        expect(user.grade).toBe(5);

        // Verify the cookie is set
        expect(res.headers["set-cookie"]).toBeDefined();
        const cookieStr = res.headers["set-cookie"].join(";");
        expect(cookieStr).toMatch(/authToken=/);
      });
    });

    describe("POST /api/users/complete-profile", () => {
      it("should update grade, return 200, and issue a new authToken cookie", async () => {
        const user = await User.create({ fullname: "Test", email: "test@test.com" });
        mockUser = user;
        
        const res = await request(app).post("/api/users/complete-profile").send({ grade: 5 });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Profile completed successfully");
        
        const updatedUser = await User.findById(user._id);
        expect(updatedUser.grade).toBe(5);

        // Verify the cookie is set with the new token
        expect(res.headers["set-cookie"]).toBeDefined();
        const cookieStr = res.headers["set-cookie"].join(";");
        expect(cookieStr).toMatch(/authToken=/);
      });
    });

    describe("GET /api/users", () => {
      it("should list users with pagination", async () => {
        await User.create([
          { fullname: "User One", email: "one@test.com", grade: 5 },
          { fullname: "User Two", email: "two@test.com", grade: 5 },
        ]);
        const res = await request(app).get("/api/users?page=1&limit=1");
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(res.body.meta.total).toBe(2);
      });
    });

    describe("PUT /api/users/profile", () => {
      it("should return 403 if trying to update restricted fields", async () => {
        const res = await request(app).put("/api/users/profile").send({ carrots: { count: 100 } });
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/can't alter these values/);
      });

      it("should update profile successfully", async () => {
        const user = await User.create({ fullname: "Old", email: "old@test.com" });
        mockUser = user;
        
        const res = await request(app).put("/api/users/profile").send({ fullname: "New" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Profile updated successfully");
      });
    });

    describe("DELETE /api/users/:id", () => {
      it("should return 404 if user not found", async () => {
        const res = await request(app).delete(`/api/users/${new mongoose.Types.ObjectId()}`);
        expect(res.status).toBe(404);
      });

      it("should delete user and related data", async () => {
        const user = await User.create({ fullname: "Delete Me", email: "del@test.com" });
        const res = await request(app).delete(`/api/users/${user._id}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("User removed");
        
        const checkUser = await User.findById(user._id);
        expect(checkUser).toBeNull();
      });
    });
  });
});
