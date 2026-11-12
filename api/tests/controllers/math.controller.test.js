import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import errorHandler from "../../middlewares/errorHandler.js";
import User from "../../models/user.model.js";
import generateToken from "../../utils/genToken.js";

const userId = new mongoose.Types.ObjectId();
const userToken = generateToken({ id: userId, role: "student" });

jest.unstable_mockModule("../../services/math.service.js", () => ({
  default: {
    getTopics: jest.fn().mockReturnValue([{ id: "t1", name: "Topic 1" }]),
    generateQuestion: jest.fn((id) => {
      if (id === "bad") throw new Error("Invalid id");
      return { id, token: "mockToken", question: "1+1" };
    }),
    verifyAnswer: jest.fn((token, response) => {
      if (token === "badToken") throw new Error("Invalid token");
      return { correct: response === "2" };
    }),
  },
}));

const { default: mathControllerModule } =
  await import("../../controllers/math.controller.js");

describe("Math Controller", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      const auth = req.headers.authorization;
      if (auth && auth.includes(userToken)) {
        req.user = { role: "student", _id: userId };
      }
      next();
    });

    app.get("/api/math/topics", mathControllerModule.getTopics);
    app.get("/api/math/question", mathControllerModule.getQuestion);
    app.post("/api/math/answer", mathControllerModule.checkAnswer);

    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    afterEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    describe("GET /api/math/topics", () => {
      it("should return math topics", async () => {
        const res = await request(app).get("/api/math/topics");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
      });
    });

    describe("GET /api/math/question", () => {
      it("should return 400 if id is missing", async () => {
        const res = await request(app).get("/api/math/question");
        expect(res.status).toBe(400);
      });

      it("should return 404 if generateQuestion throws error", async () => {
        const res = await request(app).get("/api/math/question?id=bad");
        expect(res.status).toBe(404);
      });

      it("should return generated question", async () => {
        const res = await request(app).get("/api/math/question?id=good");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBe("mockToken");
      });
    });

    describe("POST /api/math/answer", () => {
      it("should return 401 if unauthenticated", async () => {
        const res = await request(app)
          .post("/api/math/answer")
          .send({ token: "a", response: "1" });
        expect(res.status).toBe(401);
      });

      it("should return 400 if token or response is missing", async () => {
        const res = await request(app)
          .post("/api/math/answer")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ token: "a" });
        expect(res.status).toBe(400);
      });

      it("should return 400 if verifyAnswer throws", async () => {
        const res = await request(app)
          .post("/api/math/answer")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ token: "badToken", response: "1" });
        expect(res.status).toBe(400);
      });

      it("should check answer and NOT award carrots if incorrect (mock DB)", async () => {
        const addCarrotsSpy = jest
          .spyOn(User, "addCarrots")
          .mockResolvedValue(null);
        const res = await request(app)
          .post("/api/math/answer")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ token: "goodToken", response: "3" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.correct).toBe(false);
        expect(res.body.data.carrots).toBeNull();
        expect(addCarrotsSpy).not.toHaveBeenCalled();
      });

      it("should check answer and award carrots if correct (mock DB)", async () => {
        const addCarrotsSpy = jest
          .spyOn(User, "addCarrots")
          .mockResolvedValue({ carrots: { count: 15 } });
        const res = await request(app)
          .post("/api/math/answer")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ token: "goodToken", response: "2" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.correct).toBe(true);
        expect(res.body.data.carrots.count).toBe(15);
        expect(addCarrotsSpy).toHaveBeenCalled();
      });

      it("should return 400 if user not found when awarding carrots (controller overrides 404 to 400 in catch block)", async () => {
        const addCarrotsSpy = jest
          .spyOn(User, "addCarrots")
          .mockResolvedValue(null);
        const res = await request(app)
          .post("/api/math/answer")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ token: "goodToken", response: "2" });

        // Note: The controller manually sets res.status(404) but then throws an Error which is caught by the try-catch block setting it to 400.
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          "Could not award carrots: User not found",
        );
        expect(addCarrotsSpy).toHaveBeenCalled();
      });

      it("should return 400 if DB operation throws an error (controller catches and returns 400)", async () => {
        const addCarrotsSpy = jest
          .spyOn(User, "addCarrots")
          .mockRejectedValue(new Error("DB Connection Error"));
        const res = await request(app)
          .post("/api/math/answer")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ token: "goodToken", response: "2" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("DB Connection Error");
        expect(addCarrotsSpy).toHaveBeenCalled();
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      await User.deleteMany({});
      await User.create({
        _id: userId,
        fullname: "Test User",
        email: "test@example.com",
        role: "student",
        password: "password123",
        grade: 4,
        carrots: { count: 10, history: [0, 0, 0, 0, 0, 0, 0] },
      });
    });

    afterAll(async () => {
      await User.deleteMany({});
    });

    describe("POST /api/math/answer", () => {
      it("should check answer and NOT award carrots if incorrect", async () => {
        const res = await request(app)
          .post("/api/math/answer")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ token: "goodToken", response: "3" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.correct).toBe(false);
        expect(res.body.data.carrots).toBeNull();
      });

      it("should check answer and award carrots if correct", async () => {
        const res = await request(app)
          .post("/api/math/answer")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ token: "goodToken", response: "2" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.correct).toBe(true);
        expect(res.body.data.carrots.count).toBeGreaterThan(10);
      });
    });
  });
});
