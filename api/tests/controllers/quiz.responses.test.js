import User from "../../models/user.model.js";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import errorHandler from "../../middlewares/errorHandler.js";
import Module from "../../models/Module.model.js";
import Question from "../../models/Questions.model.js";
import Responses from "../../models/Responses.model.js";
import Sequence from "../../models/Sequence.model.js";
import generateToken from "../../utils/genToken.js";

import quizService from "../../services/quiz.service.js";
import quizController from "../../controllers/quiz.controller.js";

const userId = new mongoose.Types.ObjectId();
const userToken = generateToken({ id: userId, role: "student" });

describe("Quiz Controller - Responses", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      const auth = req.headers.authorization;
      if (auth) {
        req.user = { role: "student", _id: userId, grade: 4 };
      }
      next();
    });

    app.post("/api/modules/start", quizController.startModule);
    app.post("/api/submit", quizController.submitAnswer);
    app.post("/api/modules/progress", quizController.getModulesWithProgress);
    app.post("/api/modules/next", quizController.nextQuestion);

    app.use(errorHandler);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await User.create({
      _id: userId,
      fullname: "Test User",
      email: "test@example.com",
      role: "student",
      password: "password123",
      grade: 4,
    });
    await Module.deleteMany({});
    await Question.deleteMany({});
    await Responses.deleteMany({});
    await Sequence.deleteMany({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT TESTS — all DB/service calls are mocked via jest.spyOn
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Unit Tests", () => {
    // ── POST /api/modules/start ──────────────────────────────────────────────
    describe("POST /api/modules/start", () => {
      it("should return 400 when moduleId is missing", async () => {
        const res = await request(app)
          .post("/api/modules/start")
          .set("Authorization", `Bearer ${userToken}`)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Module ID is required");
      });

      it("should propagate service error when quizService.startModule throws", async () => {
        jest
          .spyOn(quizService, "startModule")
          .mockRejectedValue(new Error("Failed to start"));

        const res = await request(app)
          .post("/api/modules/start")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: new mongoose.Types.ObjectId() });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Failed to start");
      });

      it("should return 400 when module is locked", async () => {
        jest
          .spyOn(quizService, "startModule")
          .mockRejectedValue(new Error("Module is locked."));

        const res = await request(app)
          .post("/api/modules/start")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: new mongoose.Types.ObjectId() });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Module is locked.");
      });

      it("should return 400 when module is not found", async () => {
        jest
          .spyOn(quizService, "startModule")
          .mockRejectedValue(new Error("Module not found"));

        const res = await request(app)
          .post("/api/modules/start")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: new mongoose.Types.ObjectId() });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Module not found");
      });
    });

    // ── POST /api/submit ─────────────────────────────────────────────────────
    describe("POST /api/submit", () => {
      it("should return 400 when questionId is missing", async () => {
        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            answer: "A",
            timeTaken: 10,
            moduleId: new mongoose.Types.ObjectId(),
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Missing required fields");
      });

      it("should return 400 when answer is missing", async () => {
        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            questionId: new mongoose.Types.ObjectId(),
            timeTaken: 10,
            moduleId: new mongoose.Types.ObjectId(),
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Missing required fields");
      });

      it("should return 400 when timeTaken is missing", async () => {
        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            questionId: new mongoose.Types.ObjectId(),
            answer: "A",
            moduleId: new mongoose.Types.ObjectId(),
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Missing required fields");
      });

      it("should return 400 when moduleId is missing", async () => {
        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            questionId: new mongoose.Types.ObjectId(),
            answer: "A",
            timeTaken: 10,
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Missing required fields");
      });

      it("should propagate service error when quizService.submitAnswer throws", async () => {
        jest
          .spyOn(quizService, "submitAnswer")
          .mockRejectedValue(new Error("Submit failed"));

        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            questionId: new mongoose.Types.ObjectId(),
            answer: "A",
            timeTaken: 10,
            moduleId: new mongoose.Types.ObjectId(),
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Submit failed");
      });

      it("should propagate 'Question not found' error from service", async () => {
        jest
          .spyOn(quizService, "submitAnswer")
          .mockRejectedValue(new Error("Question not found"));

        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            questionId: new mongoose.Types.ObjectId(),
            answer: "A",
            timeTaken: 10,
            moduleId: new mongoose.Types.ObjectId(),
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Question not found");
      });
    });

    // ── POST /api/modules/progress ───────────────────────────────────────────
    describe("POST /api/modules/progress", () => {
      it("should return 5xx error when User.adjustCarrots throws a DB error", async () => {
        jest
          .spyOn(User, "adjustCarrots")
          .mockRejectedValue(new Error("DB error"));

        const res = await request(app)
          .post("/api/modules/progress")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ subject: "english" });

        expect(res.status).not.toBe(200);
        expect(res.body.message).toBe("DB error");
      });

      it("should return an error when user is not found (adjustCarrots returns null)", async () => {
        jest.spyOn(User, "adjustCarrots").mockResolvedValue(null);

        const res = await request(app)
          .post("/api/modules/progress")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ subject: "english" });

        // Controller sets 404 then throws; the catch block overrides with 500
        expect(res.status).not.toBe(200);
        expect(res.body.message).toBe("User not found");
      });
    });

    // ── POST /api/modules/next ───────────────────────────────────────────────
    describe("POST /api/modules/next", () => {
      it("should return 400 when moduleId is missing", async () => {
        const res = await request(app)
          .post("/api/modules/next")
          .set("Authorization", `Bearer ${userToken}`)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Module ID is required");
      });

      it("should propagate service error when quizService.nextQuestion throws", async () => {
        jest
          .spyOn(quizService, "nextQuestion")
          .mockRejectedValue(new Error("Next error"));

        const res = await request(app)
          .post("/api/modules/next")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: new mongoose.Types.ObjectId() });

        expect(res.status).not.toBe(200);
        expect(res.body.message).toBe("Next error");
      });

      it("should propagate 'Module not found' error from service", async () => {
        jest
          .spyOn(quizService, "nextQuestion")
          .mockRejectedValue(new Error("Module not found"));

        const res = await request(app)
          .post("/api/modules/next")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: new mongoose.Types.ObjectId() });

        expect(res.status).not.toBe(200);
        expect(res.body.message).toBe("Module not found");
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // INTEGRATION TESTS — hit the real (in-memory/Atlas-test) database
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Integration Tests", () => {
    describe("POST /api/modules/start", () => {
      it("should start a module and return the first question", async () => {
        const q = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const m = await Module.create({
          name: "Test Module",
          subject: "english",
          grades: [4],
          questionIds: [q._id],
        });

        const res = await request(app)
          .post("/api/modules/start")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: m._id });

        expect(res.status).toBe(200);
        expect(res.body.data.question._id).toBe(q._id.toString());
      });

      it("should return the module in 'in_progress' status after partial completion", async () => {
        const q1 = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q1" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const q2 = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q2" }] },
          answerType: "SA",
          options: { sa: "B" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const m = await Module.create({
          name: "Two-Q Module",
          subject: "english",
          grades: [4],
          questionIds: [q1._id, q2._id],
        });

        // Answer q1 to put module in_progress
        await Responses.create({
          userId,
          questionId: q1._id,
          moduleId: m._id,
          response: "A",
          timeTaken: 5,
        });

        const res = await request(app)
          .post("/api/modules/start")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: m._id });

        expect(res.status).toBe(200);
        // Should now point to q2 (the unanswered question)
        expect(res.body.data.question._id).toBe(q2._id.toString());
        expect(res.body.data.progress.status).toBe("in_progress");
      });
    });

    describe("POST /api/submit", () => {
      it("should submit a correct answer and return isCorrect: true", async () => {
        const q = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const m = await Module.create({
          name: "Test Module",
          subject: "english",
          grades: [4],
          questionIds: [q._id],
        });

        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            questionId: q._id,
            answer: "A",
            timeTaken: 10,
            moduleId: m._id,
            sessionId: new mongoose.Types.ObjectId(),
            isMarathon: false,
          });

        expect(res.status).toBe(200);
        expect(res.body.data.isCorrect).toBe(true);
      });

      it("should submit a wrong answer and return isCorrect: false", async () => {
        const q = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const m = await Module.create({
          name: "Test Module",
          subject: "english",
          grades: [4],
          questionIds: [q._id],
        });

        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            questionId: q._id,
            answer: "B",
            timeTaken: 10,
            moduleId: m._id,
          });

        expect(res.status).toBe(200);
        expect(res.body.data.isCorrect).toBe(false);
      });

      it("should handle duplicate submission idempotently", async () => {
        const q = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const m = await Module.create({
          name: "Test Module",
          subject: "english",
          grades: [4],
          questionIds: [q._id],
        });

        const payload = {
          questionId: q._id,
          answer: "A",
          timeTaken: 10,
          moduleId: m._id,
        };

        const first = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send(payload);
        const second = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send(payload);

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        // Both submissions should agree on correctness
        expect(second.body.data.isCorrect).toBe(first.body.data.isCorrect);
        // Only one response document should exist in DB
        const count = await Responses.countDocuments({
          userId,
          questionId: q._id,
        });
        expect(count).toBe(1);
      });

      it("should mark module complete when last question is answered", async () => {
        const q = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const m = await Module.create({
          name: "Single-Q Module",
          subject: "english",
          grades: [4],
          questionIds: [q._id],
        });

        const res = await request(app)
          .post("/api/submit")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            questionId: q._id,
            answer: "A",
            timeTaken: 10,
            moduleId: m._id,
          });

        expect(res.status).toBe(200);
        expect(res.body.data.isModuleComplete).toBe(true);
      });
    });

    describe("POST /api/modules/progress", () => {
      it("should return an array of modules with progress metadata", async () => {
        await Module.create({
          name: "Test Module",
          subject: "english",
          grades: [4],
          questionIds: [],
        });

        const res = await request(app)
          .post("/api/modules/progress")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ subject: "english" });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it("should include carrots in the response", async () => {
        const res = await request(app)
          .post("/api/modules/progress")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ subject: "english" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("carrots");
      });

      it("should return a module with 'not_started' status when user has no responses", async () => {
        const q = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        await Module.create({
          name: "Fresh Module",
          subject: "english",
          grades: [4],
          questionIds: [q._id],
        });

        const res = await request(app)
          .post("/api/modules/progress")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ subject: "english" });

        expect(res.status).toBe(200);
        const freshModule = res.body.data.find(
          (m) => m.name === "Fresh Module",
        );
        expect(freshModule).toBeDefined();
        expect(freshModule.status).toBe("not_started");
        expect(freshModule.unlocked).toBe(true);
      });
    });

    describe("POST /api/modules/next", () => {
      it("should advance to the next question in a module", async () => {
        const q1 = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q1" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const q2 = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q2" }] },
          answerType: "SA",
          options: { sa: "B" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const m = await Module.create({
          name: "Two-Q Module",
          subject: "english",
          grades: [4],
          questionIds: [q1._id, q2._id],
        });

        // Advance from q1 — should return q2 as next
        const res = await request(app)
          .post("/api/modules/next")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: m._id, currentQuestionId: q1._id });

        expect(res.status).toBe(200);
        expect(res.body.data.nextQuestionId).toBe(q2._id.toString());
      });

      it("should indicate module completion when there is no next question", async () => {
        const q = await Question.create({
          _id: new mongoose.Types.ObjectId(),
          question: { slate: [{ text: "Q" }] },
          answerType: "SA",
          options: { sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const m = await Module.create({
          name: "Single-Q Module",
          subject: "english",
          grades: [4],
          questionIds: [q._id],
        });

        // Advance from the only question — should return isModuleComplete: true
        const res = await request(app)
          .post("/api/modules/next")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ moduleId: m._id, currentQuestionId: q._id });

        expect(res.status).toBe(200);
        expect(res.body.data.isModuleComplete).toBe(true);
      });
    });
  });
});
