import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import errorHandler from "../../middlewares/errorHandler.js";
import User from "../../models/user.model.js";
import generateToken from "../../utils/genToken.js";

jest.unstable_mockModule("../../services/math.service.js", () => ({
  default: {
    verifyAnswer: jest.fn().mockReturnValue({ correct: true, accuracy: 100 })
  }
}));

const { default: quizController } = await import("../../controllers/quiz.controller.js");

const userId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();
const userToken = generateToken({ id: userId, role: "student" });
const adminToken = generateToken({ id: adminId, role: "admin" });

describe("Quiz Controller - Analytics & Misc", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // mock auth
    app.use((req, res, next) => {
      const auth = req.headers.authorization;
      if (auth && auth.includes(adminToken)) {
        req.user = { role: "admin", _id: adminId };
      } else if (auth && auth.includes(userToken)) {
        req.user = { role: "student", _id: userId };
      }
      next();
    });

    app.get("/api/history", quizController.getMyHistory);
    app.get("/api/analytics/daily", quizController.getDailyAnalytics);
    app.get("/api/analytics/marathons", quizController.getMarathonAnalytics);
    app.get("/api/analytics/speed-accuracy", quizController.getSpeedAccuracyAnalytics);
    app.get("/api/analytics/formats", quizController.getFormatAnalytics);
    app.get("/api/analytics/difficulty", quizController.getDifficultyAnalytics);
    app.get("/api/analytics/skills", quizController.getSkillsAnalytics);
    app.get("/api/admin/users/:userId/history", quizController.getUserHistory);
    app.post("/api/response", quizController.saveMarathonResponse);
    
    app.use(errorHandler);
  });

  describe("Unit Tests (Mocked DB)", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should handle DB errors in getDailyAnalytics", async () => {
      const Responses = mongoose.model("Responses");
      jest.spyOn(Responses, "find").mockImplementation(() => {
        throw new Error("DB Connection Error");
      });

      const res = await request(app)
        .get("/api/analytics/daily")
        .set("Authorization", `Bearer ${userToken}`);
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("DB Connection Error");
    });

    it("should handle invalid request in saveMarathonResponse (edge case)", async () => {
      const res = await request(app)
        .post("/api/response")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ type: "marathon", userId: userId.toString(), timeTaken: -10 }); // Missing token

      expect(res.status).toBe(400); 
    });
  });

  describe("Integration Tests (Real DB)", () => {
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
    });

    it("should get my history", async () => {
      const res = await request(app)
        .get("/api/history")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("should get daily analytics", async () => {
      const res = await request(app)
        .get("/api/analytics/daily")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("should get marathon analytics", async () => {
      const res = await request(app)
        .get("/api/analytics/marathons")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("should get speed accuracy analytics", async () => {
      const res = await request(app)
        .get("/api/analytics/speed-accuracy")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("should get format analytics", async () => {
      const res = await request(app)
        .get("/api/analytics/formats")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("should get difficulty analytics", async () => {
      const res = await request(app)
        .get("/api/analytics/difficulty")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("should get skills analytics", async () => {
      const res = await request(app)
        .get("/api/analytics/skills")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("should save marathon response", async () => {
      // Generate a valid question token
      const mockQuestionToken = jwt.sign(
        { answerHashes: ["mockHash123"] },
        process.env.JWT_SECRET || "testsecret"
      );

      const res = await request(app)
        .post("/api/response")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ type: "marathon", userId: userId.toString(), token: mockQuestionToken, timeTaken: 10, response: "test" });
      expect(res.status).toBe(200);
    });

    it("should evaluate math marathon response using mathService", async () => {
      const mockQuestionToken = jwt.sign(
        { type: "math" },
        process.env.JWT_SECRET || "testsecret"
      );

      const res = await request(app)
        .post("/api/response")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ type: "marathon", userId: userId.toString(), token: mockQuestionToken, timeTaken: 10, response: "1/2" });
      
      expect(res.status).toBe(200);
      expect(res.body.data.accuracy).toBe(100);

      const { default: mathService } = await import("../../services/math.service.js");
      expect(mathService.verifyAnswer).toHaveBeenCalledWith(mockQuestionToken, "1/2");
    });
  });
});
