import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import errorHandler from "../../middlewares/errorHandler.js";

const userId = new mongoose.Types.ObjectId();

jest.unstable_mockModule("../../middlewares/authMiddleware.js", () => ({
  protectAdmin: (req, res, next) => {
    req.user = { _id: userId, role: "admin" };
    next();
  }
}));

const migrationController = (await import("../../controllers/migration.controller.js")).default;
const { default: Question } = await import("../../models/Questions.model.js");
const { default: Notification } = await import("../../models/Notification.model.js");
const { default: Session } = await import("../../models/session.model.js");

describe("Migration Controller", () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const auth = await import("../../middlewares/authMiddleware.js");
    app.get("/api/admin/migrate", auth.protectAdmin, migrationController.runMigration);
    
    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("GET /api/admin/migrate", () => {
      it("should handle collection update errors gracefully", async () => {
        // Mock one updateMany to fail
        const QuestionSpy = jest.spyOn(Question, "updateMany").mockResolvedValue({ modifiedCount: 1 });
        const NotificationSpy = jest.spyOn(Notification, "updateMany").mockRejectedValue(new Error("DB Error"));
        const SessionSpy = jest.spyOn(Session, "updateMany").mockResolvedValue({ modifiedCount: 1 });

        const res = await request(app).get("/api/admin/migrate");
        expect(res.status).toBe(200); // Route itself doesn't fail, it catches collection errors
        expect(res.body.success).toBe(true);
        expect(res.body.results.notificationsError).toMatch(/DB Error/);
        
        QuestionSpy.mockRestore();
        NotificationSpy.mockRestore();
        SessionSpy.mockRestore();
      });

      it("should return 500 if migration fails entirely", async () => {
        // If Question fails, it throws to the route handler
        const QuestionSpy = jest.spyOn(Question, "updateMany").mockRejectedValue(new Error("Fatal DB Error"));

        const res = await request(app).get("/api/admin/migrate");
        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/Fatal DB Error/);
        
        QuestionSpy.mockRestore();
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      await Question.deleteMany({});
      await Notification.deleteMany({});
      await Session.deleteMany({});
    });

    describe("GET /api/admin/migrate", () => {
      it("should backfill active, rating, type and createdAt", async () => {
        // Use raw collection insertion to avoid validation logic setting defaults
        await mongoose.connection.collection("questions").insertOne({
          text: "Q1",
          answerType: "SA",
          options: { sa: "A" },
          correctAnswer: "A",
          category: "misc",
          createdBy: userId,
          // intentionally missing active and rating
        });

        await mongoose.connection.collection("notifications").insertOne({
          userId,
          title: "Test",
          message: "Test",
          // intentionally missing type
        });

        await mongoose.connection.collection("sessions").insertOne({
          userId,
          deviceId: "dev1",
          // intentionally missing createdAt
        });

        const res = await request(app).get("/api/admin/migrate");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.results.questionsActive).toBe(1);
        expect(res.body.results.questionsRating).toBe(1);
        
        const q = await mongoose.connection.collection("questions").findOne({ text: "Q1" });
        expect(q.active).toBe(true);
        expect(q.rating).toBe(1200);

        const s = await mongoose.connection.collection("sessions").findOne({ deviceId: "dev1" });
        expect(s.createdAt).toBeDefined();
      });
    });
  });
});
