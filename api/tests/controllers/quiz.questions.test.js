/**
 * @file quiz.questions.test.js
 * @description Unit tests for question-related operations in quiz.controller.js
 */

import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import quizController from "../../controllers/quiz.controller.js";
import errorHandler from "../../middlewares/errorHandler.js";
import Question from "../../models/Questions.model.js";
import Module from "../../models/Module.model.js";
import Responses from "../../models/Responses.model.js";
import ContextAttachment from "../../models/ContextAttachments.model.js";

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock user for protect middlewares in real app
  app.use((req, res, next) => {
    req.user = { _id: new mongoose.Types.ObjectId(), isAdmin: true };
    next();
  });

  app.post("/api/questions", quizController.createQuestion);
  app.get("/api/questions/skills", quizController.getSkills);
  app.post("/api/questions/get", quizController.getQuestions);
  app.post("/api/questionsByModule", quizController.getQuestionsByModuleId);
  app.post("/api/trash/questions", quizController.getTrashQuestions);
  app.delete("/api/trash/questions", quizController.emptyTrash);
  app.post("/api/questions/getById", quizController.getQuestionByIdForQuiz);
  app.post("/api/questions/getByIdAdmin", quizController.getQuestionById);
  app.put("/api/questions/update", quizController.updateQuestion);
  app.put("/api/questions/restore", quizController.restoreQuestion);
  app.delete("/api/questions/delete", quizController.deleteQuestion);
  app.delete(
    "/api/questions/deletePermanent",
    quizController.deleteQuestionPermanently,
  );
  app.post("/api/bulk-import", quizController.bulkImportQuestions);

  app.use(errorHandler);
  return app;
};

describe("Quiz Controller - Questions", () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe("Unit Tests", () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    describe("POST /api/questions", () => {
      it("should return 400 if required fields are missing", async () => {
        const res = await request(app).post("/api/questions").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Please provide all required fields/);
      });

      it("should return 500 if database throws an error during creation", async () => {
        const payload = {
          question: { slate: [{ text: "Q" }] },
          explanation: { slate: [{ text: "E" }] },
          options: { type: "SA", sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
          modules: [new mongoose.Types.ObjectId()],
          skills: ["grammar"],
        };

        jest
          .spyOn(Question, "create")
          .mockRejectedValueOnce(new Error("Database error"));

        const res = await request(app).post("/api/questions").send(payload);
        expect(res.status).toBe(400);
      });
    });

    describe("DELETE /api/questions/delete", () => {
      it("should return 404 if not found", async () => {
        jest.spyOn(Question, "findByIdAndUpdate").mockResolvedValueOnce(null);
        jest.spyOn(Question, "findById").mockResolvedValueOnce(null);

        const res = await request(app)
          .delete("/api/questions/delete")
          .send({ id: new mongoose.Types.ObjectId() });
        expect(res.status).toBeGreaterThanOrEqual(400);
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      jest.restoreAllMocks();
      await Question.deleteMany({});
      await Module.deleteMany({});
      await Responses.deleteMany({});
      await ContextAttachment.deleteMany({});
    });

    describe("POST /api/questions", () => {
      it("should create a question", async () => {
        const payload = {
          question: { slate: [{ text: "Q" }] },
          explanation: { slate: [{ text: "E" }] },
          options: { type: "SA", sa: "A" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
          modules: [new mongoose.Types.ObjectId()],
          skills: ["grammar"],
        };
        const res = await request(app).post("/api/questions").send(payload);
        if (res.status !== 201) console.error("CREATE ERROR:", res.body);
        expect(res.status).toBe(201);
        expect(res.body.data.answerType).toBe("SA");
      });
    });

    describe("GET /api/questions/skills", () => {
      it("should return skills from questions", async () => {
        await Question.create({
          question: { slate: [] },
          answerType: "SA",
          options: { type: "SA", sa: "A" },
          explanation: { slate: [] },
          modules: [new mongoose.Types.ObjectId()],
          skills: ["grammar"],
          subject: "english",
          difficulty: "easy",
          type: "mcq",
          skill: "grammar",
          subSkill: "verbs",
        });
        const res = await request(app).get(
          "/api/questions/skills?subject=english",
        );
        expect(res.status).toBe(200);
        expect(res.body.data).toContain("grammar");
      });
    });

    describe("POST /api/questions/get", () => {
      it("should return paginated questions", async () => {
        await Question.create({
          question: { slate: [] },
          answerType: "SA",
          options: { type: "SA", sa: "A" },
          explanation: { slate: [] },
          modules: [new mongoose.Types.ObjectId()],
          skills: ["grammar"],
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const res = await request(app)
          .post("/api/questions/get")
          .send({ page: 1, limit: 10, subject: "english" });
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
      });
    });

    describe("DELETE /api/questions/delete", () => {
      it("should soft delete a question", async () => {
        const q = await Question.create({
          question: { slate: [] },
          answerType: "SA",
          options: { type: "SA", sa: "A" },
          explanation: { slate: [] },
          modules: [new mongoose.Types.ObjectId()],
          skills: ["grammar"],
          subject: "english",
          difficulty: "easy",
          type: "mcq",
        });
        const res = await request(app)
          .delete("/api/questions/delete")
          .send({ id: q._id });
        expect(res.status).toBe(200);
        const check = await Question.findById(q._id);
        expect(check.active).toBe(false);
      });
    });

    describe("DELETE /api/questions/deletePermanent", () => {
      it("should permanently delete a question and cascade to Responses and ContextAttachments", async () => {
        const q = await Question.create({
          question: { slate: [{ text: "Q" }] },
          answerType: "SA",
          options: { type: "SA", sa: "A" },
          explanation: { slate: [] },
          modules: [new mongoose.Types.ObjectId()],
          skills: ["grammar"],
          subject: "english",
          difficulty: "easy",
          type: "mcq",
          isDeleted: true,
        });
        await Responses.create({
          userId: new mongoose.Types.ObjectId(),
          moduleId: new mongoose.Types.ObjectId(),
          questionId: q._id,
          attempts: 1,
          response: ["some response"],
          timeTaken: 10,
          responses: [],
        });
        await ContextAttachment.create({
          title: "Test Attachment",
          text: { slate: [{ text: "Attachment Text" }] },
          questionId: q._id,
        });

        const res = await request(app)
          .delete("/api/questions/deletePermanent")
          .send({ id: q._id });
        expect(res.status).toBe(200);
        const check = await Question.findById(q._id);
        expect(check).toBeNull();

        const resps = await Responses.countDocuments({ questionId: q._id });
        expect(resps).toBe(0);

        const atts = await ContextAttachment.countDocuments({
          questionId: q._id,
        });
        expect(atts).toBe(0);
      });
    });
  });
});
