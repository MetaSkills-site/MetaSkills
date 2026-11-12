/**
 * @file sequence.controller.test.js
 * @description Unit and Integration tests for sequence controller.
 */

import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import {
  getSequenceByGradeAndSubject,
  updateSequence,
} from "../../controllers/sequence.controller.js";
import errorHandler from "../../middlewares/errorHandler.js";
import Sequence from "../../models/Sequence.model.js";
import Module from "../../models/Module.model.js";

const app = express();
app.use(express.json());

app.get("/api/sequence/:grade/:subject", getSequenceByGradeAndSubject);
app.put("/api/sequence/:grade/:subject", updateSequence);

app.use(errorHandler);

describe("Sequence Controller", () => {
  describe("Unit Tests (Mocked DB)", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("GET /api/sequence/:grade/:subject", () => {
      it("should handle error if Sequence.findOne throws", async () => {
        jest.spyOn(Sequence, "findOne").mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("DB Error")),
        });

        const res = await request(app).get("/api/sequence/5/maths");

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("DB Error");
      });

      it("should handle error if Module.find throws", async () => {
        jest.spyOn(Sequence, "findOne").mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        });
        jest.spyOn(Module, "find").mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error("Module DB Error")),
        });

        const res = await request(app).get("/api/sequence/5/maths");

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Module DB Error");
      });
    });

    describe("PUT /api/sequence/:grade/:subject", () => {
      it("should return 400 if modules is not an array", async () => {
        const res = await request(app)
          .put("/api/sequence/5/maths")
          .send({ modules: "not-an-array" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Modules must be an array of IDs/);
      });

      it("should handle error if Sequence.findOneAndUpdate throws", async () => {
        jest.spyOn(Sequence, "findOneAndUpdate").mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Update DB Error")),
        });

        const res = await request(app)
          .put("/api/sequence/5/maths")
          .send({ modules: ["123"] });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Update DB Error");
      });
    });
  });

  describe("Integration Tests (Real DB)", () => {
    beforeEach(async () => {
      await Sequence.deleteMany({});
      await Module.deleteMany({});
      jest.restoreAllMocks();
    });

    afterAll(async () => {
      await Sequence.deleteMany({});
      await Module.deleteMany({});
    });

    describe("GET /api/sequence/:grade/:subject", () => {
      it("should return 200 and a default sequence if not found in DB", async () => {
        const module = await Module.create({
          name: "Test Module",
          subject: "maths",
          grades: 5,
          questions: [],
          questionCount: 0,
        });

        const res = await request(app).get("/api/sequence/5/maths");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.grade).toBe(5);
        expect(res.body.data.subject).toBe("maths");
        expect(res.body.data.modules.length).toBe(1);
        expect(res.body.data.modules[0]._id.toString()).toBe(
          module._id.toString(),
        );
      });

      it("should return 200 and the existing sequence from DB", async () => {
        const module = await Module.create({
          name: "Test Module",
          subject: "maths",
          grades: 5,
          questions: [],
          questionCount: 0,
        });

        await Sequence.create({
          grade: 5,
          subject: "maths",
          modules: [module._id],
        });

        const res = await request(app).get("/api/sequence/5/maths");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.modules.length).toBe(1);
      });
    });

    describe("PUT /api/sequence/:grade/:subject", () => {
      it("should return 200 and update the sequence", async () => {
        const module = await Module.create({
          name: "Test Module",
          subject: "maths",
          grades: 5,
          questions: [],
          questionCount: 0,
        });

        const res = await request(app)
          .put("/api/sequence/5/maths")
          .send({ modules: [module._id] });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.modules.length).toBe(1);

        const checkSeq = await Sequence.findOne({ grade: 5, subject: "maths" });
        expect(checkSeq).toBeTruthy();
        expect(checkSeq.modules[0].toString()).toBe(module._id.toString());
      });
    });
  });
});
