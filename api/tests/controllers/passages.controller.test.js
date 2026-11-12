/**
 * @file passages.controller.test.js
 * @description Unit and Integration tests for passages controller.
 */

import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import passagesController from "../../controllers/passages.controller.js";
import errorHandler from "../../middlewares/errorHandler.js";
import Passages from "../../models/Passages.model.js";
import Vocabulary from "../../models/Vocabulary.model.js";

const app = express();
app.use(express.json());

app.post("/api/passages", passagesController.createPassage);
app.get("/api/passages", passagesController.getAllPassages);
app.post(
  "/api/passages/bulk-sentences",
  passagesController.createBulkSentences,
);
app.get(
  "/api/passages/generate/grammar",
  passagesController.generateGrammarQuiz,
);
app.get(
  "/api/passages/generate/vocabulary",
  passagesController.generateVocabularyQuiz,
);
app.get(
  "/api/passages/generate/passage",
  passagesController.generatePassageQuiz,
);
app.get("/api/passages/:id", passagesController.getPassageById);
app.put("/api/passages/:id", passagesController.updatePassage);
app.delete("/api/passages/:id", passagesController.deletePassage);

app.use(errorHandler);

describe("Passages Controller", () => {
  describe("Unit Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("POST /api/passages", () => {
      it("should return 400 if text is missing", async () => {
        const res = await request(app)
          .post("/api/passages")
          .send({ title: "T1" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Text content is required/);
      });

      it("should return 500 if DB throws error", async () => {
        jest.spyOn(Passages, "create").mockRejectedValue(new Error("DB Error"));
        const res = await request(app)
          .post("/api/passages")
          .send({ title: "T1", text: "Some text" });
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("DB Error");
      });
    });

    describe("POST /api/passages/bulk-sentences", () => {
      it("should return 400 if text is missing", async () => {
        const res = await request(app)
          .post("/api/passages/bulk-sentences")
          .send({});
        expect(res.status).toBe(400);
      });

      it("should return 400 if no valid sentences found", async () => {
        const res = await request(app)
          .post("/api/passages/bulk-sentences")
          .send({ text: "   \n  " });
        expect(res.status).toBe(400);
      });

      it("should return 500 if DB throws error", async () => {
        jest
          .spyOn(Passages, "insertMany")
          .mockRejectedValue(new Error("DB Error"));
        const text = "Sentence 1.\nSentence 2.";
        const res = await request(app)
          .post("/api/passages/bulk-sentences")
          .send({ text });
        expect(res.status).toBe(500);
      });
    });

    describe("GET /api/passages", () => {
      it("should return 500 if DB throws error", async () => {
        jest.spyOn(Passages, "find").mockImplementation(() => {
          throw new Error("DB Error");
        });
        const res = await request(app).get("/api/passages");
        expect(res.status).toBe(500);
      });
    });

    describe("GET /api/passages/:id", () => {
      it("should return 404 if passage not found", async () => {
        jest.spyOn(Passages, "findById").mockResolvedValue(null);
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/passages/${fakeId}`);
        expect(res.status).toBe(404);
      });

      it("should return 500 if DB throws error", async () => {
        jest
          .spyOn(Passages, "findById")
          .mockRejectedValue(new Error("DB Error"));
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/passages/${fakeId}`);
        expect(res.status).toBe(500);
      });
    });

    describe("PUT /api/passages/:id", () => {
      it("should return 404 if passage not found", async () => {
        jest.spyOn(Passages, "findById").mockResolvedValue(null);
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .put(`/api/passages/${fakeId}`)
          .send({ title: "T2" });
        expect(res.status).toBe(404);
      });

      it("should return 500 if DB throws error on find", async () => {
        jest
          .spyOn(Passages, "findById")
          .mockRejectedValue(new Error("DB Error"));
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .put(`/api/passages/${fakeId}`)
          .send({ title: "T2" });
        expect(res.status).toBe(500);
      });
    });

    describe("DELETE /api/passages/:id", () => {
      it("should return 404 if passage not found", async () => {
        jest.spyOn(Passages, "findById").mockResolvedValue(null);
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).delete(`/api/passages/${fakeId}`);
        expect(res.status).toBe(404);
      });

      it("should return 500 if DB throws error on find", async () => {
        jest
          .spyOn(Passages, "findById")
          .mockRejectedValue(new Error("DB Error"));
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).delete(`/api/passages/${fakeId}`);
        expect(res.status).toBe(500);
      });
    });

    describe("GET /api/passages/generate/vocabulary", () => {
      it("should return 404 if not enough words", async () => {
        jest.spyOn(Vocabulary, "aggregate").mockResolvedValue([]);
        const res = await request(app).get("/api/passages/generate/vocabulary");
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Not enough words/);
      });

      it("should return 500 if DB throws error", async () => {
        jest
          .spyOn(Vocabulary, "aggregate")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app).get("/api/passages/generate/vocabulary");
        expect(res.status).toBe(500);
      });
    });

    describe("GET /api/passages/generate/passage", () => {
      it("should return 404 if no passages found", async () => {
        jest.spyOn(Passages, "aggregate").mockResolvedValue([]);
        const res = await request(app).get("/api/passages/generate/passage");
        expect(res.status).toBe(404);
      });

      it("should return 500 if DB throws error", async () => {
        jest
          .spyOn(Passages, "aggregate")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app).get("/api/passages/generate/passage");
        expect(res.status).toBe(500);
      });
    });

    describe("GET /api/passages/generate/grammar", () => {
      it("should return 404 if no sentences found", async () => {
        jest.spyOn(Passages, "aggregate").mockResolvedValue([]);
        const res = await request(app).get("/api/passages/generate/grammar");
        expect(res.status).toBe(404);
      });

      it("should return 500 if DB throws error", async () => {
        jest
          .spyOn(Passages, "aggregate")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app).get("/api/passages/generate/grammar");
        expect(res.status).toBe(500);
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      await Passages.deleteMany({});
      await Vocabulary.deleteMany({});
      jest.restoreAllMocks();
    });

    describe("POST /api/passages", () => {
      it("should return 201 and create passage", async () => {
        const res = await request(app)
          .post("/api/passages")
          .send({ title: "T1", text: "Some text" });
        expect(res.status).toBe(201);
        expect(res.body.data.text).toBe("Some text");
        const check = await Passages.findOne({ title: "T1" });
        expect(check).toBeTruthy();
      });
    });

    describe("POST /api/passages/bulk-sentences", () => {
      it("should return 201 and insert sentences", async () => {
        const text = "Sentence 1.\nSentence 2.";
        const res = await request(app)
          .post("/api/passages/bulk-sentences")
          .send({ text });
        expect(res.status).toBe(201);
        expect(res.body.count).toBe(2);
        const count = await Passages.countDocuments();
        expect(count).toBe(2);
      });
    });

    describe("GET /api/passages", () => {
      it("should list passages with pagination and difficulty filter", async () => {
        await Passages.create({
          title: "Easy",
          text: "txt",
          type: "passage",
          rating: 800,
        });
        await Passages.create({
          title: "Hard",
          text: "txt",
          type: "passage",
          rating: 2000,
        });

        const res = await request(app).get(
          "/api/passages?difficulty=Easy,Very Hard&limit=10",
        );
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);
      });
    });

    describe("GET /api/passages/:id", () => {
      it("should return 200 and passage data", async () => {
        const p = await Passages.create({
          title: "T1",
          text: "txt",
          type: "passage",
        });
        const res = await request(app).get(`/api/passages/${p._id}`);
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe("T1");
      });
    });

    describe("PUT /api/passages/:id", () => {
      it("should return 200 and updated passage", async () => {
        const p = await Passages.create({
          title: "T1",
          text: "txt",
          type: "passage",
        });
        const res = await request(app)
          .put(`/api/passages/${p._id}`)
          .send({ title: "T2" });
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe("T2");
        const check = await Passages.findById(p._id);
        expect(check.title).toBe("T2");
      });
    });

    describe("DELETE /api/passages/:id", () => {
      it("should return 200 and delete passage", async () => {
        const p = await Passages.create({
          title: "T1",
          text: "txt",
          type: "passage",
        });
        const res = await request(app).delete(`/api/passages/${p._id}`);
        expect(res.status).toBe(200);

        const check = await Passages.findById(p._id);
        expect(check).toBeNull();
      });
    });

    describe("GET /api/passages/generate/vocabulary", () => {
      it("should return 200 and generate vocabulary quiz", async () => {
        await Vocabulary.create([
          {
            word: "W1",
            definition: "D1",
            partOfSpeech: "n",
            difficulty: "easy",
            sentence: "S1",
          },
          {
            word: "W2",
            definition: "D2",
            partOfSpeech: "n",
            difficulty: "easy",
            sentence: "S2",
          },
          {
            word: "W3",
            definition: "D3",
            partOfSpeech: "n",
            difficulty: "easy",
            sentence: "S3",
          },
          {
            word: "W4",
            definition: "D4",
            partOfSpeech: "n",
            difficulty: "easy",
            sentence: "S4",
          },
        ]);
        const res = await request(app).get("/api/passages/generate/vocabulary");
        expect(res.status).toBe(200);
        expect(res.body.data.options.length).toBe(4);
        expect(res.body.data.vocabId).toBeDefined();
      });
    });

    describe("GET /api/passages/generate/passage", () => {
      it("should return 200 and generate passage quiz", async () => {
        await Passages.create({
          title: "T1",
          text: "The quick brown fox jumps over the lazy dog. A wonderful day to write tests in Node js.",
          type: "passage",
        });
        const res = await request(app).get("/api/passages/generate/passage");
        if (res.status !== 200) console.error("PASSAGE ERROR:", res.body);
        expect(res.status).toBe(200);
        expect(res.body.data.wordBank.length).toBeGreaterThan(0);
      });
    });

    describe("GET /api/passages/generate/grammar", () => {
      it("should return 200 and generate grammar quiz", async () => {
        await Passages.create({
          title: "S1",
          text: "The quick brown fox jumps over the lazy dog.",
          type: "sentence",
        });
        const res = await request(app).get("/api/passages/generate/grammar");
        if (res.status !== 200) console.error("GRAMMAR ERROR:", res.body);
        expect(res.status).toBe(200);
      });
    });
  });
});
