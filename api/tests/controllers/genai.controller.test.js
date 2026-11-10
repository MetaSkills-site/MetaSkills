import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import errorHandler from "../../middlewares/errorHandler.js";
import User from "../../models/user.model.js";
import Vocabulary from "../../models/Vocabulary.model.js";
import VocabProgress from "../../models/VocabProgress.model.js";
import generateToken from "../../utils/genToken.js";

const userId = new mongoose.Types.ObjectId();
const userToken = generateToken({ id: userId, role: "student" });
const adminId = new mongoose.Types.ObjectId();
const adminToken = generateToken({ id: adminId, role: "admin" });

jest.unstable_mockModule("../../middlewares/idempotency.js", () => ({
  default: (req, res, next) => next()
}));

jest.unstable_mockModule("../../middlewares/rateLimiters.js", () => ({
  genaiRateLimiter: (req, res, next) => next()
}));

jest.unstable_mockModule("../../middlewares/authMiddleware.js", () => ({
  protect: (req, res, next) => next(),
  protectAdmin: (req, res, next) => next(),
  protectUserOrAdmin: (req, res, next) => next()
}));

jest.unstable_mockModule("../../services/ai.service.js", () => ({
  aiService: {
    streamWithFallback: jest.fn(async (models, prompt, sys, opts) => {
      if (opts.onStatus) opts.onStatus("generating");
      if (opts.onChunk) opts.onChunk("chunk1");
      if (opts.onChunk) opts.onChunk("chunk2");
      return { text: "chunk1chunk2", usedModel: models[0] };
    }),
    generateWithFallback: jest.fn(async (models, prompt, sys, opts) => {
      if (opts && opts.onStatus) opts.onStatus("generating");
      if (prompt.includes("Sentence Evaluator") || prompt.includes("evaluateSentence") || (sys && sys.includes("Evaluator"))) {
        return { text: JSON.stringify({ accuracy: 80, errors: [] }), usedModel: models[0] };
      }
      if (prompt.includes("Parse the following raw text")) {
        return { text: JSON.stringify({ questions: [{ questionText: "Q1", questionType: "mcq", options: ["A", "B"], correctOptionIndex: 0 }], residualText: "" }), usedModel: models[0] };
      }
      return { text: "Mocked AI Response", usedModel: models[0] };
    }),
    generateTTS: jest.fn(async () => {
      return "base64audio";
    })
  }
}));

const { default: genaiRoutes } = await import("../../routes/genai.routes.js");

describe("GenAI Controller", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      const auth = req.headers.authorization;
      if (auth && auth.includes(adminToken)) {
        req.user = { role: "admin", _id: adminId };
      } else if (auth && auth.includes(userToken)) {
        req.user = { role: "student", _id: userId.toString() };
      }
      next();
    });

    app.use("/api/genai", genaiRoutes);
    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    beforeEach(() => {
      // Mock DB for Unit Tests
      jest.spyOn(Vocabulary, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([{ word: "MockWord1" }, { word: "MockWord2" }])
          })
        })
      });
      jest.spyOn(Vocabulary, "findOne").mockResolvedValue({ _id: new mongoose.Types.ObjectId(), word: "TestWord", definition: "A mocked definition" });
      jest.spyOn(VocabProgress, "findOne").mockResolvedValue({ box: 2, lastSentenceTestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) });
      jest.spyOn(VocabProgress, "findOneAndUpdate").mockResolvedValue({});
      jest.spyOn(User, "adjustCarrots").mockResolvedValue({ carrots: 50 });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("POST /api/genai/stream", () => {
      it("should return 400 if apiMode is missing", async () => {
        const res = await request(app).post("/api/genai/stream").send({});
        expect(res.status).toBe(400);
      });
      
      it("should return 400 if apiMode is provided without params", async () => {
        const res = await request(app).post("/api/genai/stream").send({ apiMode: "vocab" });
        expect(res.status).toBe(400);
      });

      it("should handle error gracefully when fetching vocab throws an error (DB failure)", async () => {
        jest.spyOn(Vocabulary, "find").mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockRejectedValue(new Error("DB Error"))
            })
          })
        });

        const res = await request(app)
          .post("/api/genai/stream")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ apiMode: "vocab", params: { count: 10 } });
        
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("application/x-ndjson");
      });
    });

    describe("POST /api/genai/sentences/evaluate", () => {
      it("should return 400 if required fields are missing", async () => {
        const res = await request(app)
          .post("/api/genai/sentences/evaluate")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ passage: "A passage" });
        expect(res.status).toBe(400);
      });

      it("should return evaluation successfully with mocked DB", async () => {
        const res = await request(app)
          .post("/api/genai/sentences/evaluate")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ word: "TestWord", sentence: "This is a test sentence." });
        
        expect(res.status).toBe(200);
        expect(res.text).toContain("accuracy");
      });

      it("should handle DB error when adjusting carrots gracefully", async () => {
        jest.spyOn(User, "adjustCarrots").mockRejectedValue(new Error("DB Update Error"));
        const res = await request(app)
          .post("/api/genai/sentences/evaluate")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ word: "TestWord", sentence: "This is a test sentence." });
        
        expect(res.status).toBe(200);
        expect(res.text).toContain("Failed to record evaluation progress.");
      });
    });

    describe("POST /api/genai/explanation", () => {
      it("should return explanation", async () => {
        const res = await request(app)
          .post("/api/genai/explanation")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ questionText: "q1", answerText: "a1" });
        
        expect(res.status).toBe(200);
        expect(res.text).toContain("Mocked AI Response");
      });

      it("should return 400 if missing questionText", async () => {
        const res = await request(app)
          .post("/api/genai/explanation")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ answerText: "a1" });
        expect(res.status).toBe(400);
      });
    });

    describe("POST /api/genai/tts", () => {
      it("should return TTS base64 audio", async () => {
        const res = await request(app)
          .post("/api/genai/tts")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ text: "Hello", voice: "alloy" });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.audioBase64).toBe("base64audio");
      });

      it("should return 400 if text is missing", async () => {
        const res = await request(app)
          .post("/api/genai/tts")
          .set("Authorization", `Bearer ${userToken}`)
          .send({});
        expect(res.status).toBe(400);
      });
      
      it("should return 400 if text is too long", async () => {
        const res = await request(app)
          .post("/api/genai/tts")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ text: "a".repeat(201) });
        expect(res.status).toBe(400);
      });
    });

    describe("POST /api/genai/parse-questions", () => {
      it("should return parsed questions", async () => {
        const res = await request(app)
          .post("/api/genai/parse-questions")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ rawText: "1. Question A? This text is longer than 20 characters." });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it("should return 400 if rawText is missing", async () => {
        const res = await request(app)
          .post("/api/genai/parse-questions")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({});
        expect(res.status).toBe(400);
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      await User.deleteMany({});
      await Vocabulary.deleteMany({});
      await VocabProgress.deleteMany({});
      
      const v = await Vocabulary.create({ word: "TestWord", definition: "A test word", difficulty: "Easy" });
      await VocabProgress.create({ user: userId, word: v._id, box: 2 });
      await User.create({ _id: userId, fullname: "Test User", email: "test@example.com", authProvider: "local", password: "password", carrots: 0 });
    });

    describe("POST /api/genai/stream", () => {
      it("should stream content successfully using real DB", async () => {
        const res = await request(app)
          .post("/api/genai/stream")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ apiMode: "vocab", params: { count: 10 } });
        
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("application/x-ndjson");
        expect(res.text).toContain("generating");
        expect(res.text).toContain("chunk1chunk2");
      });
    });

    describe("POST /api/genai/sentences/evaluate", () => {
      it("should return evaluation successfully and update real DB state", async () => {
        const res = await request(app)
          .post("/api/genai/sentences/evaluate")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ word: "TestWord", sentence: "This is a test sentence." });
        
        expect(res.status).toBe(200);
        expect(res.text).toContain("accuracy");

        const updatedUser = await User.findById(userId);
        expect(updatedUser.carrots.count).toBeGreaterThan(0);
      });
    });
  });
});
