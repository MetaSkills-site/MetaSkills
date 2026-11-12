import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import errorHandler from "../../middlewares/errorHandler.js";
import Vocabulary from "../../models/Vocabulary.model.js";
import VocabProgress from "../../models/VocabProgress.model.js";
import User from "../../models/user.model.js";
import generateToken from "../../utils/genToken.js";

const userId = new mongoose.Types.ObjectId();
const userToken = generateToken({ id: userId, role: "student" });
const adminId = new mongoose.Types.ObjectId();
const adminToken = generateToken({ id: adminId, role: "admin" });

// Mock idempotencyGuard
jest.unstable_mockModule("../../middlewares/idempotency.js", () => ({
  default: (req, res, next) => next(),
}));

jest.unstable_mockModule("../../middlewares/authMiddleware.js", () => ({
  protect: (req, res, next) => next(),
  protectAdmin: (req, res, next) => next(),
  protectUserOrAdmin: (req, res, next) => next(),
}));

const { default: vocabRoutes } =
  await import("../../routes/vocabulary.routes.js");

describe("Vocabulary Controller", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      const auth = req.headers.authorization;
      if (auth && auth.includes(adminToken)) {
        req.user = { role: "admin", _id: adminId };
      } else if (auth && auth.includes(userToken)) {
        req.user = { role: "student", _id: userId };
      }
      next();
    });

    app.use("/api/vocabulary", vocabRoutes);
    app.use(errorHandler);
  });

  beforeEach(async () => {
    await Vocabulary.deleteMany({});
    await VocabProgress.deleteMany({});
    await User.deleteMany({});

    await User.create({
      _id: userId,
      fullname: "Test User",
      email: "test@example.com",
      role: "student",
      password: "password123",
      grade: 4,
      carrots: 0,
    });
  });

  describe("Unit Tests (Mocked DB)", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("POST /api/vocabulary", () => {
      it("should return 400 if word is missing", async () => {
        const res = await request(app)
          .post("/api/vocabulary")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ definition: "A definition" });

        expect(res.status).toBe(400);
      });

      it("should return 400 if definition is missing", async () => {
        const res = await request(app)
          .post("/api/vocabulary")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ word: "Test" });

        expect(res.status).toBe(400);
      });

      it("should return 500 when DB throws during creation", async () => {
        jest
          .spyOn(Vocabulary, "create")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app)
          .post("/api/vocabulary")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ word: "Word", definition: "Def" });

        expect(res.status).toBe(500);
      });
    });

    describe("GET /api/vocabulary", () => {
      it("should return 500 when DB aggregate throws", async () => {
        jest
          .spyOn(Vocabulary, "aggregate")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app)
          .get("/api/vocabulary")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
      });
    });

    describe("GET /api/vocabulary/:id", () => {
      it("should return 404 when vocabulary item is not found", async () => {
        jest.spyOn(Vocabulary, "findById").mockResolvedValue(null);
        const res = await request(app)
          .get(`/api/vocabulary/${new mongoose.Types.ObjectId()}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
      });

      it("should return 500 when DB throws during findById", async () => {
        jest
          .spyOn(Vocabulary, "findById")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app)
          .get(`/api/vocabulary/${new mongoose.Types.ObjectId()}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
      });
    });

    describe("POST /api/vocabulary/bulk", () => {
      it("should return 400 if text field is missing", async () => {
        const res = await request(app)
          .post("/api/vocabulary/bulk")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({});

        expect(res.status).toBe(400);
      });

      it("should return 400 if text contains only blank lines", async () => {
        const res = await request(app)
          .post("/api/vocabulary/bulk")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ text: "\n\n" });

        expect(res.status).toBe(400);
      });

      it("should return 400 if lines have no '-' separator", async () => {
        const res = await request(app)
          .post("/api/vocabulary/bulk")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ text: "NoSeparatorLine" });

        expect(res.status).toBe(400);
      });

      it("should return 200 with partial success when insertMany has duplicate key errors", async () => {
        jest.spyOn(Vocabulary, "insertMany").mockRejectedValue({
          writeErrors: [{ errmsg: "duplicate key error" }],
          insertedDocs: [{ word: "A", definition: "B" }],
        });
        const res = await request(app)
          .post("/api/vocabulary/bulk")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ text: "A - B\nC - D" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
      });

      it("should return 500 when insertMany throws a non-duplicate error", async () => {
        jest
          .spyOn(Vocabulary, "insertMany")
          .mockRejectedValue(new Error("Unexpected DB Error"));
        const res = await request(app)
          .post("/api/vocabulary/bulk")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ text: "Word1 - Def1\nWord2 - Def2" });

        expect(res.status).toBe(500);
      });
    });

    describe("PUT /api/vocabulary/:id", () => {
      it("should return 404 when the vocabulary item does not exist", async () => {
        jest.spyOn(Vocabulary, "findById").mockResolvedValue(null);
        const res = await request(app)
          .put(`/api/vocabulary/${new mongoose.Types.ObjectId()}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ word: "New", definition: "Def" });

        expect(res.status).toBe(404);
      });

      it("should return 400 if word or definition is missing on update", async () => {
        jest.spyOn(Vocabulary, "findById").mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          word: "Old",
          definition: "OldDef",
        });
        const res = await request(app)
          .put(`/api/vocabulary/${new mongoose.Types.ObjectId()}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ word: "OnlyWord" });

        expect(res.status).toBe(400);
      });

      it("should return 500 when DB throws during update findById", async () => {
        jest
          .spyOn(Vocabulary, "findById")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app)
          .put(`/api/vocabulary/${new mongoose.Types.ObjectId()}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ word: "New", definition: "Def" });

        expect(res.status).toBe(500);
      });
    });

    describe("DELETE /api/vocabulary/:id", () => {
      it("should return 404 when the vocabulary item does not exist", async () => {
        jest.spyOn(Vocabulary, "findById").mockResolvedValue(null);
        const res = await request(app)
          .delete(`/api/vocabulary/${new mongoose.Types.ObjectId()}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
      });

      it("should return 500 when DB throws during findById on delete", async () => {
        jest
          .spyOn(Vocabulary, "findById")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app)
          .delete(`/api/vocabulary/${new mongoose.Types.ObjectId()}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
      });
    });

    describe("GET /api/vocabulary/quiz", () => {
      it("should return 500 when VocabProgress.findOne chain throws", async () => {
        jest.spyOn(VocabProgress, "findOne").mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockRejectedValue(new Error("DB Error")),
        });
        const res = await request(app)
          .get("/api/vocabulary/quiz")
          .set("Authorization", `Bearer ${userToken}`);

        expect(res.status).toBe(500);
      });
    });

    describe("POST /api/vocabulary/verify", () => {
      it("should return 400 if vocabId is missing", async () => {
        const res = await request(app)
          .post("/api/vocabulary/verify")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ userId: userId.toString(), timeTaken: 5 });

        expect(res.status).toBe(400);
      });

      it("should return 400 if timeTaken is missing", async () => {
        const res = await request(app)
          .post("/api/vocabulary/verify")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            userId: userId.toString(),
            vocabId: new mongoose.Types.ObjectId(),
          });

        expect(res.status).toBe(400);
      });

      it("should return 400 if userId is missing", async () => {
        const res = await request(app)
          .post("/api/vocabulary/verify")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ vocabId: new mongoose.Types.ObjectId(), timeTaken: 5 });

        expect(res.status).toBe(400);
      });

      it("should return 404 if vocabulary item is not found during verify", async () => {
        jest.spyOn(Vocabulary, "findById").mockResolvedValue(null);
        const res = await request(app)
          .post("/api/vocabulary/verify")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            userId: userId.toString(),
            vocabId: new mongoose.Types.ObjectId(),
            timeTaken: 5,
            response: ["SomeDef"],
          });

        expect(res.status).toBe(404);
      });
    });
  });

  describe("Integration Tests (Real DB)", () => {
    describe("Admin CRUD Routes", () => {
      it("POST /api/vocabulary — should create a new vocabulary word", async () => {
        const res = await request(app)
          .post("/api/vocabulary")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ word: "Abundant", definition: "Plentiful" });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.word).toBe("Abundant");

        const doc = await Vocabulary.findOne({ word: "Abundant" });
        expect(doc).not.toBeNull();
      });

      it("POST /api/vocabulary — should reject duplicate word (unique schema constraint)", async () => {
        await Vocabulary.create({
          word: "Echo",
          definition: "A sound that repeats",
        });

        const res = await request(app)
          .post("/api/vocabulary")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ word: "Echo", definition: "Another definition" });

        expect(res.status).toBe(500);
      });

      it("GET /api/vocabulary — should return paginated vocabulary list with metadata", async () => {
        await Vocabulary.create({
          word: "Brisk",
          definition: "Active and energetic",
        });

        const res = await request(app)
          .get("/api/vocabulary")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].word).toBe("Brisk");
        expect(res.body.meta).toHaveProperty("total", 1);
      });

      it("GET /api/vocabulary — should filter results by search query", async () => {
        await Vocabulary.insertMany([
          { word: "Candid", definition: "Truthful and straightforward" },
          { word: "Daunt", definition: "Make someone feel intimidated" },
        ]);

        const res = await request(app)
          .get("/api/vocabulary?search=candid")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].word).toBe("Candid");
      });

      it("GET /api/vocabulary/:id — should return a vocabulary item by ID", async () => {
        const v = await Vocabulary.create({
          word: "Eager",
          definition: "Keenly wanting to do something",
        });

        const res = await request(app)
          .get(`/api/vocabulary/${v._id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.word).toBe("Eager");
      });

      it("POST /api/vocabulary/bulk — should bulk-create vocabulary from text", async () => {
        const res = await request(app)
          .post("/api/vocabulary/bulk")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            text: "Candid - Truthful and straightforward\nDaunt - Make someone feel intimidated",
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);

        const count = await Vocabulary.countDocuments();
        expect(count).toBe(2);
      });

      it("POST /api/vocabulary/bulk — should skip DB duplicates and report partial success", async () => {
        await Vocabulary.create({ word: "Fervent", definition: "Passionate" });

        const res = await request(app)
          .post("/api/vocabulary/bulk")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            text: "Fervent - Passionate\nGlean - To gather information",
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
      });

      it("PUT /api/vocabulary/:id — should update an existing vocabulary word", async () => {
        const v = await Vocabulary.create({
          word: "Eager",
          definition: "Wanting to do something",
        });

        const res = await request(app)
          .put(`/api/vocabulary/${v._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ word: "Eagerly", definition: "Wanting to do something" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.word).toBe("Eagerly");

        const updated = await Vocabulary.findById(v._id);
        expect(updated.word).toBe("Eagerly");
      });

      it("DELETE /api/vocabulary/:id — should delete vocab and cascade VocabProgress records", async () => {
        const v = await Vocabulary.create({
          word: "Fervent",
          definition: "Passionate",
        });
        await VocabProgress.create({
          user: userId,
          word: v._id,
          level: 1,
          nextReviewDate: new Date(),
        });

        const res = await request(app)
          .delete(`/api/vocabulary/${v._id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);

        const check = await Vocabulary.findById(v._id);
        expect(check).toBeNull();

        const prog = await VocabProgress.countDocuments({ word: v._id });
        expect(prog).toBe(0);
      });
    });

    describe("Quiz & SRS Routes", () => {
      it("GET /api/vocabulary/quiz — should serve a 4-option MCQ for a new unseen word", async () => {
        await Vocabulary.insertMany([
          { word: "Alpha", definition: "Def Alpha" },
          { word: "Beta", definition: "Def Beta" },
          { word: "Gamma", definition: "Def Gamma" },
          { word: "Delta", definition: "Def Delta" },
        ]);

        const res = await request(app)
          .get("/api/vocabulary/quiz")
          .set("Authorization", `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("vocabId");
        expect(res.body.data).toHaveProperty("options");
        expect(res.body.data.options).toHaveLength(4);
        expect(res.body.data.type).toBe("mcq");
      });

      it("GET /api/vocabulary/quiz — should prioritise a DUE review word over a new word", async () => {
        const v = await Vocabulary.create({
          word: "Serene",
          definition: "Calm and peaceful",
        });
        await Vocabulary.insertMany([
          { word: "Brisk", definition: "Active and energetic" },
          { word: "Candid", definition: "Truthful" },
          { word: "Daunt", definition: "Intimidate" },
        ]);

        await VocabProgress.create({
          user: userId,
          word: v._id,
          box: 1,
          nextReviewDate: new Date(Date.now() - 1000),
        });

        const res = await request(app)
          .get("/api/vocabulary/quiz")
          .set("Authorization", `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.vocabId.toString()).toBe(v._id.toString());
      });

      it("POST /api/vocabulary/verify — should record correct answer, advance SRS box, and award carrots", async () => {
        const v = await Vocabulary.create({
          word: "Correct",
          definition: "Is Correct",
        });

        const res = await request(app)
          .post("/api/vocabulary/verify")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            vocabId: v._id,
            response: ["Is Correct"],
            userId: userId.toString(),
            timeTaken: 5,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accuracy).toBe(100);
        expect(res.body.data.srs.box).toBe(1);
        expect(res.body.data.carrotsAwarded).toBeGreaterThan(0);

        const progress = await VocabProgress.findOne({
          user: userId,
          word: v._id,
        });
        expect(progress.box).toBe(1);
      });

      it("POST /api/vocabulary/verify — should reset SRS box to 0 on wrong answer", async () => {
        const v = await Vocabulary.create({
          word: "Tricky",
          definition: "Hard to deal with",
        });

        await VocabProgress.create({
          user: userId,
          word: v._id,
          box: 3,
          nextReviewDate: new Date(),
        });

        const res = await request(app)
          .post("/api/vocabulary/verify")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            vocabId: v._id,
            response: ["Wrong answer"],
            userId: userId.toString(),
            timeTaken: 8,
          });

        expect(res.status).toBe(200);
        expect(res.body.data.accuracy).toBe(0);
        expect(res.body.data.srs.box).toBe(0);
        expect(res.body.data.carrotsAwarded).toBe(0);

        const progress = await VocabProgress.findOne({
          user: userId,
          word: v._id,
        });
        expect(progress.box).toBe(0);
      });
    });
  });
});
