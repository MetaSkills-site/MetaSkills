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
  },
}));

const {
  getGlobalStats,
  getEngagementTrends,
  getMisfitQuestions,
  getChallengingModules,
  getFormatEffectiveness,
  getGradeCompetency,
  getSpeedVsComprehension,
  getVocabularyDifficultyStats,
} = await import("../../controllers/adminAnalytics.controller.js");

const { default: User } = await import("../../models/user.model.js");
const { default: Module } = await import("../../models/Module.model.js");
const { default: Question } = await import("../../models/Questions.model.js");
const { default: Responses } = await import("../../models/Responses.model.js");
const { default: Vocabulary } =
  await import("../../models/Vocabulary.model.js");
const { default: Passages } = await import("../../models/Passages.model.js");
const { default: ContextAttachment } =
  await import("../../models/ContextAttachments.model.js");

describe("Admin Analytics Controller", () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const auth = await import("../../middlewares/authMiddleware.js");

    app.get("/api/admin/analytics/stats", auth.protectAdmin, getGlobalStats);
    app.get(
      "/api/admin/analytics/trends",
      auth.protectAdmin,
      getEngagementTrends,
    );
    app.get(
      "/api/admin/analytics/misfits",
      auth.protectAdmin,
      getMisfitQuestions,
    );
    app.get(
      "/api/admin/analytics/challenging-modules",
      auth.protectAdmin,
      getChallengingModules,
    );
    app.get(
      "/api/admin/analytics/format-effectiveness",
      auth.protectAdmin,
      getFormatEffectiveness,
    );
    app.get(
      "/api/admin/analytics/grade-competency",
      auth.protectAdmin,
      getGradeCompetency,
    );
    app.get(
      "/api/admin/analytics/speed-vs-comprehension",
      auth.protectAdmin,
      getSpeedVsComprehension,
    );
    app.get(
      "/api/admin/analytics/vocabulary-difficulty",
      auth.protectAdmin,
      getVocabularyDifficultyStats,
    );

    app.use(errorHandler);
  });

  describe("Unit Tests (Mocked DB)", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should handle error in getGlobalStats", async () => {
      jest
        .spyOn(User, "countDocuments")
        .mockRejectedValue(new Error("DB Error"));
      const res = await request(app).get("/api/admin/analytics/stats");
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("should handle error in getEngagementTrends", async () => {
      jest
        .spyOn(Responses, "aggregate")
        .mockRejectedValue(new Error("DB Error"));
      const res = await request(app).get("/api/admin/analytics/trends");
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("should handle error in getMisfitQuestions", async () => {
      jest
        .spyOn(Responses, "find")
        .mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error("DB Error")),
        });
      const res = await request(app).get("/api/admin/analytics/misfits");
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("should handle error in getChallengingModules", async () => {
      jest
        .spyOn(Responses, "find")
        .mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error("DB Error")),
        });
      const res = await request(app).get(
        "/api/admin/analytics/challenging-modules",
      );
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("should handle error in getFormatEffectiveness", async () => {
      jest
        .spyOn(Responses, "find")
        .mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error("DB Error")),
        });
      const res = await request(app).get(
        "/api/admin/analytics/format-effectiveness",
      );
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("should handle error in getGradeCompetency", async () => {
      jest
        .spyOn(Responses, "find")
        .mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error("DB Error")),
        });
      const res = await request(app).get(
        "/api/admin/analytics/grade-competency",
      );
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("should handle error in getSpeedVsComprehension", async () => {
      jest
        .spyOn(Responses, "find")
        .mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error("DB Error")),
        });
      const res = await request(app).get(
        "/api/admin/analytics/speed-vs-comprehension",
      );
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("should handle error in getVocabularyDifficultyStats", async () => {
      jest
        .spyOn(Vocabulary, "aggregate")
        .mockRejectedValue(new Error("DB Error"));
      const res = await request(app).get(
        "/api/admin/analytics/vocabulary-difficulty",
      );
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Integration Tests (Real DB)", () => {
    beforeEach(async () => {
      await User.deleteMany({});
      await Module.deleteMany({});
      await Question.deleteMany({});
      await Responses.deleteMany({});
      await Vocabulary.deleteMany({});
      await Passages.deleteMany({});
      await ContextAttachment.deleteMany({});
    });

    describe("GET /api/admin/analytics/stats", () => {
      it("should return global stats successfully", async () => {
        await User.create({
          email: "t1@ex.com",
          fullname: "U1",
          password: "123",
          role: "student",
        });
        await Vocabulary.create({
          word: "W1",
          definition: "D1",
          difficulty: "Easy",
        });

        const res = await request(app).get("/api/admin/analytics/stats");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalUsers).toBe(1);
        expect(res.body.data.totalVocabularies).toBe(1);
      });
    });

    describe("GET /api/admin/analytics/trends", () => {
      it("should return engagement trends", async () => {
        await Responses.create({
          user: userId,
          userId,
          moduleId: new mongoose.Types.ObjectId(),
          questionId: new mongoose.Types.ObjectId(),
          response: "A",
          timeTaken: 10,
          isMarathon: false,
        });

        const res = await request(app).get("/api/admin/analytics/trends");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].count).toBe(1);
      });
    });

    describe("GET /api/admin/analytics/misfits", () => {
      it("should return misfit questions", async () => {
        const q = await Question.create({
          text: "Q1",
          answerType: "SA",
          question: { slate: "test" },
          options: { sa: "A" },
          correctAnswer: "A",
          rating: 1200,
          category: "misc",
          createdBy: userId,
        });
        await Responses.create({
          userId,
          moduleId: new mongoose.Types.ObjectId(),
          questionId: q._id,
          response: "A",
          timeTaken: 10,
        });
        await Responses.create({
          userId,
          moduleId: new mongoose.Types.ObjectId(),
          questionId: q._id,
          response: "B",
          timeTaken: 10,
        });

        const res = await request(app).get("/api/admin/analytics/misfits");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].averageAccuracy).toBe(50);
      });

      it("should return empty array if no responses", async () => {
        const res = await request(app).get("/api/admin/analytics/misfits");
        expect(res.body.data).toEqual([]);
      });
    });

    describe("GET /api/admin/analytics/challenging-modules", () => {
      it("should return challenging modules", async () => {
        const m = await Module.create({
          name: "M1",
          subject: "maths",
          status: "published",
        });
        const q = await Question.create({
          text: "Q1",
          answerType: "SA",
          question: { slate: "test" },
          options: { sa: "A" },
          correctAnswer: "A",
          category: "misc",
          createdBy: userId,
        });
        await Responses.create({
          userId,
          moduleId: m._id,
          questionId: q._id,
          response: "B",
          timeTaken: 10,
        });

        const res = await request(app).get(
          "/api/admin/analytics/challenging-modules",
        );
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].averageAccuracy).toBe(0);
      });
    });

    describe("GET /api/admin/analytics/format-effectiveness", () => {
      it("should return format effectiveness", async () => {
        const q = await Question.create({
          text: "Q1",
          answerType: "SA",
          question: { slate: "test" },
          options: { sa: "A" },
          correctAnswer: "A",
          category: "misc",
          createdBy: userId,
        });
        await Responses.create({
          userId,
          moduleId: new mongoose.Types.ObjectId(),
          questionId: q._id,
          response: "A",
          timeTaken: 10,
        });

        const res = await request(app).get(
          "/api/admin/analytics/format-effectiveness",
        );
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].answerType).toBe("SA");
        expect(res.body.data[0].averageAccuracy).toBe(100);
      });
    });

    describe("GET /api/admin/analytics/grade-competency", () => {
      it("should return grade competency", async () => {
        const u = await User.create({
          email: "t@ex.com",
          fullname: "U",
          password: "123",
          role: "student",
          grade: 5,
        });
        const m = await Module.create({
          name: "M1",
          subject: "english",
          status: "published",
        });
        const q = await Question.create({
          text: "Q1",
          answerType: "SA",
          question: { slate: "test" },
          options: { sa: "A" },
          correctAnswer: "A",
          category: "misc",
          createdBy: userId,
        });

        await Responses.create({
          userId: u._id,
          moduleId: m._id,
          questionId: q._id,
          response: "A",
          timeTaken: 10,
        });

        const res = await request(app).get(
          "/api/admin/analytics/grade-competency",
        );
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].grade).toBe(5);
        expect(res.body.data[0].subject).toBe("english");
        expect(res.body.data[0].averageAccuracy).toBe(100);
      });
    });

    describe("GET /api/admin/analytics/speed-vs-comprehension", () => {
      it("should cluster students by speed vs comprehension", async () => {
        const q = await Question.create({
          text: "Q1",
          answerType: "SA",
          question: { slate: "test" },
          options: { sa: "A" },
          correctAnswer: "A",
          category: "misc",
          createdBy: userId,
        });
        await Responses.create({
          userId,
          moduleId: new mongoose.Types.ObjectId(),
          questionId: q._id,
          response: "A",
          timeTaken: 15,
        });

        const res = await request(app).get(
          "/api/admin/analytics/speed-vs-comprehension",
        );
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].timeBucket).toBe("10"); // 15 is in [10, 20)
        expect(res.body.data[0].averageAccuracy).toBe(100);
      });

      it("should fallback to 300+ bucket", async () => {
        const q = await Question.create({
          text: "Q1",
          answerType: "SA",
          question: { slate: "test" },
          options: { sa: "A" },
          correctAnswer: "A",
          category: "misc",
          createdBy: userId,
        });
        await Responses.create({
          userId,
          moduleId: new mongoose.Types.ObjectId(),
          questionId: q._id,
          response: "A",
          timeTaken: 400,
        });

        const res = await request(app).get(
          "/api/admin/analytics/speed-vs-comprehension",
        );
        expect(res.status).toBe(200);
        expect(res.body.data[0].timeBucket).toBe("300+");
      });
    });

    describe("GET /api/admin/analytics/vocabulary-difficulty", () => {
      it("should return vocabulary difficulty stats", async () => {
        await Vocabulary.create({
          word: "W1",
          definition: "D1",
          difficulty: "Easy",
          rating: 1200,
        });
        await Vocabulary.create({
          word: "W2",
          definition: "D2",
          difficulty: "Hard",
          rating: 2000,
        });

        const res = await request(app).get(
          "/api/admin/analytics/vocabulary-difficulty",
        );
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.topDifficult.length).toBe(2);
        expect(res.body.data.topEasiest.length).toBe(2);

        // W2 should be more difficult (rating 2000 -> higher displayDifficulty)
        expect(res.body.data.topDifficult[0].word).toBe("W2");
      });
    });
  });
});
