import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import errorHandler from "../../middlewares/errorHandler.js";

const userId = new mongoose.Types.ObjectId();

jest.unstable_mockModule("../../middlewares/authMiddleware.js", () => ({
  protect: (req, res, next) => {
    req.user = { _id: userId };
    next();
  },
}));

const { getUserPerformance } =
  await import("../../controllers/performance.controller.js");
const { default: User } = await import("../../models/user.model.js");
const { default: Module } = await import("../../models/Module.model.js");
const { default: Question } = await import("../../models/Questions.model.js");
const { default: Responses } = await import("../../models/Responses.model.js");

describe("Performance Controller", () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const auth = await import("../../middlewares/authMiddleware.js");
    app.get("/api/user/performance", auth.protect, getUserPerformance);

    app.use(errorHandler);
  });

  describe("Unit Tests (Mocked DB)", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    describe("GET /api/user/performance", () => {
      it("should return 404 if user not found", async () => {
        jest.spyOn(User, "findById").mockResolvedValue(null);

        const res = await request(app).get("/api/user/performance");

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/User not found/);
      });

      it("should return 400 if user grade is not set", async () => {
        jest
          .spyOn(User, "findById")
          .mockResolvedValue({ _id: userId, grade: undefined });

        const res = await request(app).get("/api/user/performance");

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/User grade is required/);
      });

      it("should handle database errors gracefully", async () => {
        jest
          .spyOn(User, "findById")
          .mockRejectedValue(new Error("Database connection failed"));

        const res = await request(app).get("/api/user/performance");

        expect(res.status).toBe(500);
        expect(res.body.message).toBeDefined();
      });
    });
  });

  describe("Integration Tests (Real DB)", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
      await User.deleteMany({});
      await Module.deleteMany({});
      await Question.deleteMany({});
      await Responses.deleteMany({});
    });

    describe("GET /api/user/performance", () => {
      it("should calculate accuracy and progress for english and maths", async () => {
        await User.create({
          _id: userId,
          fullname: "Test User",
          schoolName: "Test School",
          email: "test@example.com",
          authType: "local",
          grade: 6,
        });

        const qEngId = new mongoose.Types.ObjectId();
        const qMathId = new mongoose.Types.ObjectId();

        await Question.create({
          _id: qEngId,
          text: "Eng Q",
          question: { slate: [] },
          answerType: "SA",
          options: { sa: "A" },
          correctAnswer: "A",
          category: "grammar",
        });

        await Question.create({
          _id: qMathId,
          text: "Math Q",
          question: { slate: [] },
          answerType: "SA",
          options: { sa: "A" },
          correctAnswer: "A",
          category: "algebra",
        });

        const engModule = await Module.create({
          subject: "english",
          grades: [6],
          isComplete: true,
          name: "Eng Mod",
          questionIds: [qEngId],
        });

        const mathModule = await Module.create({
          subject: "maths",
          grades: [6],
          isComplete: true,
          name: "Math Mod",
          questionIds: [qMathId],
        });

        // User got 100% on English (Progress 100%, Accuracy 100%)
        await Responses.create({
          userId,
          questionId: qEngId,
          moduleId: engModule._id,
          response: { selectedOption: "A" },
          timeTaken: 10,
        });

        // User got 0% on Math (Progress 100%, Accuracy 0%)
        await Responses.create({
          userId,
          questionId: qMathId,
          moduleId: mathModule._id,
          response: { selectedOption: "B" },
          timeTaken: 10,
        });

        const res = await request(app).get("/api/user/performance");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const { english, maths } = res.body.data;

        expect(english.progress).toBe(100);
        expect(english.accuracy).toBeDefined();

        expect(maths.progress).toBe(100);
        expect(maths.accuracy).toBeDefined();

        expect(res.body.data.hasData).toBe(true);
      });

      it("should handle empty modules gracefully (0% progress if no modules exist)", async () => {
        await User.create({
          _id: userId,
          fullname: "Test User",
          schoolName: "Test School",
          email: "test@example.com",
          authType: "local",
          grade: 6,
        });

        const res = await request(app).get("/api/user/performance");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.english.progress).toBe(0);
        expect(res.body.data.maths.progress).toBe(0);
      });
    });
  });
});
