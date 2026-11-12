import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import quizController from "../../controllers/quiz.controller.js";
import errorHandler from "../../middlewares/errorHandler.js";
import Module from "../../models/Module.model.js";
import Question from "../../models/Questions.model.js";
import Responses from "../../models/Responses.model.js";
import generateToken from "../../utils/genToken.js";

const adminId = new mongoose.Types.ObjectId();
const adminToken = generateToken({ id: adminId, role: "admin" });

const userId = new mongoose.Types.ObjectId();
const userToken = generateToken({ id: userId, role: "student" });

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  // mock auth
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (auth && auth.includes("admin")) {
      req.user = { role: "admin", _id: adminId };
    } else if (auth && auth.includes("student")) {
      req.user = { role: "student", _id: userId };
    }
    next();
  });

  app.post("/api/modules", quizController.createModule);
  app.post("/api/modules/get", quizController.getModules);
  app.post("/api/modules/getById", quizController.getModuleById);
  app.put("/api/modules/update", quizController.updateModule);
  app.delete("/api/modules/delete", quizController.deleteModule);
  app.delete(
    "/api/modules/deleteCascade",
    quizController.deleteModuleAndQuestions,
  );

  app.use(errorHandler);
});

describe("Unit Tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/modules", () => {
    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/modules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Please provide name and subject/i);
    });

    it("should return 500 if DB operation throws an error", async () => {
      jest.spyOn(Module, "create").mockRejectedValue(new Error("DB Error"));

      const payload = {
        name: "Basic Grammar",
        subject: "english",
        grades: [4, 5],
      };

      const res = await request(app)
        .post("/api/modules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("DB Error");
    });
  });

  describe("POST /api/modules/get", () => {
    it("should handle error when DB fails", async () => {
      jest.spyOn(Module, "find").mockImplementation(() => {
        return {
          sort: jest.fn().mockRejectedValue(new Error("DB Error")),
        };
      });

      const res = await request(app)
        .post("/api/modules/get")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ subject: "maths" });

      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/modules/getById", () => {
    it("should handle error when DB fails", async () => {
      jest.spyOn(Module, "findById").mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("DB Error")),
      });

      const res = await request(app)
        .post("/api/modules/getById")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ id: new mongoose.Types.ObjectId() });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/modules/update", () => {
    it("should handle error when DB fails", async () => {
      jest
        .spyOn(Module, "findByIdAndUpdate")
        .mockRejectedValue(new Error("DB Error"));

      const res = await request(app)
        .put("/api/modules/update")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ id: new mongoose.Types.ObjectId(), name: "New Name" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/modules/delete", () => {
    it("should handle error when DB fails", async () => {
      jest
        .spyOn(Module, "findByIdAndDelete")
        .mockRejectedValue(new Error("DB Error"));

      const res = await request(app)
        .delete("/api/modules/delete")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ id: new mongoose.Types.ObjectId() });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/modules/deleteCascade", () => {
    it("should handle error when DB fails", async () => {
      jest
        .spyOn(Module, "findByIdAndDelete")
        .mockRejectedValue(new Error("DB Error"));

      const res = await request(app)
        .delete("/api/modules/deleteCascade")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ id: new mongoose.Types.ObjectId() });

      expect(res.status).toBe(400);
    });
  });
});

describe("Integration Tests", () => {
  beforeEach(async () => {
    await Module.deleteMany({});
    await Question.deleteMany({});
    await Responses.deleteMany({});
  });

  describe("POST /api/modules", () => {
    it("should create a new module", async () => {
      const payload = {
        name: "Basic Grammar",
        subject: "english",
        grades: [4, 5],
      };
      const res = await request(app)
        .post("/api/modules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Basic Grammar");
    });
  });

  describe("POST /api/modules/get", () => {
    it("should get modules", async () => {
      await Module.create({
        name: "Test Module",
        subject: "maths",
        grades: [1],
      });
      const res = await request(app)
        .post("/api/modules/get")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ subject: "maths" });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("POST /api/modules/getById", () => {
    it("should get module by id", async () => {
      const m = await Module.create({
        name: "Test Module 2",
        subject: "english",
        grades: [2],
      });
      const res = await request(app)
        .post("/api/modules/getById")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ id: m._id });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Test Module 2");
    });
  });

  describe("PUT /api/modules/update", () => {
    it("should update a module", async () => {
      const m = await Module.create({
        name: "Old Name",
        subject: "english",
        grades: [3],
      });
      const res = await request(app)
        .put("/api/modules/update")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ id: m._id, name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New Name");
    });
  });

  describe("DELETE /api/modules/delete", () => {
    it("should delete a module", async () => {
      const m = await Module.create({
        name: "To Delete",
        subject: "english",
        grades: [4],
      });
      const res = await request(app)
        .delete("/api/modules/delete")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ id: m._id });

      expect(res.status).toBe(200);
      const check = await Module.findById(m._id);
      expect(check).toBeNull();
    });

    it("should cascade delete associated Responses when a module is deleted", async () => {
      const m = await Module.create({
        name: "Module With Responses",
        subject: "english",
        grades: [4],
      });
      await Responses.create({
        userId: userId,
        moduleId: m._id,
        questionId: new mongoose.Types.ObjectId(),
        attempts: 1,
        response: ["some response"],
        timeTaken: 10,
        responses: [],
      });

      const res = await request(app)
        .delete("/api/modules/delete")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ id: m._id });

      expect(res.status).toBe(200);
      const responsesCount = await Responses.countDocuments({
        moduleId: m._id,
      });
      expect(responsesCount).toBe(0);
    });
  });

  describe("DELETE /api/modules/deleteCascade", () => {
    it("should cascade delete associated Questions and Responses", async () => {
      const m = await Module.create({
        name: "Cascade Module",
        subject: "english",
        grades: [4],
      });
      const q = await Question.create({
        question: { slate: [{ text: "Q" }] },
        answerType: "SA",
        options: { type: "SA", sa: "Correct Answer" },
        modules: [m._id],
        subject: "english",
        difficulty: "easy",
        type: "mcq",
      });
      await Responses.create({
        userId: userId,
        moduleId: m._id,
        questionId: q._id,
        attempts: 1,
        response: ["another response"],
        timeTaken: 15,
        responses: [],
      });

      const res = await request(app)
        .delete("/api/modules/deleteCascade")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ id: m._id });

      expect(res.status).toBe(200);
      const checkModule = await Module.findById(m._id);
      expect(checkModule).toBeNull();

      const checkQuestion = await Question.findById(q._id);
      expect(checkQuestion).not.toBeNull();
      expect(checkQuestion.active).toBe(false);

      const responsesCount = await Responses.countDocuments({
        moduleId: m._id,
      });
      expect(responsesCount).toBe(0);
    });
  });
});
