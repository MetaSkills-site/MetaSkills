/**
 * @file contextAttachments.controller.test.js
 * @description Unit tests for context attachments controller.
 */

import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import contextAttachmentsController from "../../controllers/contextAttachments.controller.js";
import errorHandler from "../../middlewares/errorHandler.js";
import ContextAttachment from "../../models/ContextAttachments.model.js";
import Question from "../../models/Questions.model.js";

describe("Context Attachments Controller", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.post("/api/contexts", contextAttachmentsController.createContext);
    app.get("/api/contexts", contextAttachmentsController.getAllContexts);
    app.get("/api/contexts/:id", contextAttachmentsController.getContextById);
    app.put("/api/contexts/:id", contextAttachmentsController.updateContext);
    app.delete("/api/contexts/:id", contextAttachmentsController.deleteContext);

    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("POST /api/contexts", () => {
      it("should return 400 if title or text is missing", async () => {
        const res = await request(app)
          .post("/api/contexts")
          .send({ title: "Title" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/provide title and content/);
      });

      it("should handle database errors on create", async () => {
        jest
          .spyOn(ContextAttachment, "create")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app)
          .post("/api/contexts")
          .send({ title: "Title", text: { slate: [] } });
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("DB Error");
      });
    });

    describe("GET /api/contexts", () => {
      it("should handle database errors on aggregate", async () => {
        jest
          .spyOn(ContextAttachment, "aggregate")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app).get("/api/contexts");
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("DB Error");
      });
    });

    describe("GET /api/contexts/:id", () => {
      it("should return 404 if context not found", async () => {
        jest.spyOn(ContextAttachment, "findById").mockResolvedValue(null);
        const res = await request(app).get(
          `/api/contexts/${new mongoose.Types.ObjectId()}`,
        );
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Context attachment not found");
      });

      it("should handle database errors on findById", async () => {
        jest
          .spyOn(ContextAttachment, "findById")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app).get(
          `/api/contexts/${new mongoose.Types.ObjectId()}`,
        );
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("DB Error");
      });
    });

    describe("PUT /api/contexts/:id", () => {
      it("should return 404 if context not found", async () => {
        jest.spyOn(ContextAttachment, "findById").mockResolvedValue(null);
        const res = await request(app)
          .put(`/api/contexts/${new mongoose.Types.ObjectId()}`)
          .send({ title: "Updated" });
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Context attachment not found");
      });

      it("should handle database errors on findByIdAndUpdate", async () => {
        jest
          .spyOn(ContextAttachment, "findById")
          .mockResolvedValue({ _id: "123" });
        jest
          .spyOn(ContextAttachment, "findByIdAndUpdate")
          .mockRejectedValue(new Error("DB Error"));
        const res = await request(app)
          .put(`/api/contexts/${new mongoose.Types.ObjectId()}`)
          .send({ title: "Updated" });
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("DB Error");
      });
    });

    describe("DELETE /api/contexts/:id", () => {
      it("should return 404 if context not found", async () => {
        jest.spyOn(ContextAttachment, "findById").mockResolvedValue(null);
        const res = await request(app).delete(
          `/api/contexts/${new mongoose.Types.ObjectId()}`,
        );
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Context attachment not found");
      });

      it("should handle database errors on deleteOne", async () => {
        const mockContext = {
          deleteOne: jest.fn().mockRejectedValue(new Error("DB Error")),
        };
        jest
          .spyOn(ContextAttachment, "findById")
          .mockResolvedValue(mockContext);
        jest.spyOn(Question, "updateMany").mockResolvedValue({});
        const res = await request(app).delete(
          `/api/contexts/${new mongoose.Types.ObjectId()}`,
        );
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("DB Error");
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      await ContextAttachment.deleteMany({});
      await Question.deleteMany({});
    });

    describe("POST /api/contexts", () => {
      it("should return 201 and create a new context", async () => {
        const payload = {
          title: "Test Passage",
          text: { slate: [{ text: "Hello" }] },
        };

        const res = await request(app).post("/api/contexts").send(payload);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe("Test Passage");
      });
    });

    describe("GET /api/contexts", () => {
      it("should return a paginated list of contexts", async () => {
        await ContextAttachment.create({ title: "C1", text: { slate: [] } });
        await ContextAttachment.create({ title: "C2", text: { slate: [] } });

        const res = await request(app).get("/api/contexts?limit=1");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.meta.total).toBe(2);
      });
    });

    describe("GET /api/contexts/:id", () => {
      it("should return 200 and the context", async () => {
        const ctx = await ContextAttachment.create({
          title: "C1",
          text: { slate: [] },
        });
        const res = await request(app).get(`/api/contexts/${ctx._id}`);
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe("C1");
      });
    });

    describe("PUT /api/contexts/:id", () => {
      it("should return 200 and update the context", async () => {
        const ctx = await ContextAttachment.create({
          title: "C1",
          text: { slate: [] },
        });
        const res = await request(app)
          .put(`/api/contexts/${ctx._id}`)
          .send({ title: "Updated C1" });
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe("Updated C1");
      });
    });

    describe("DELETE /api/contexts/:id", () => {
      it("should return 200 and delete context", async () => {
        const ctx = await ContextAttachment.create({
          title: "C1",
          text: { slate: [] },
        });

        // Also test question unset relation
        await Question.create({
          content: { slate: [] },
          question: {
            slate: [
              { type: "paragraph", children: [{ text: "Question text" }] },
            ],
          },
          answerType: "SA",
          options: { sa: "Correct answer" },
          subject: "english",
          difficulty: "easy",
          type: "mcq",
          contextAttachment: ctx._id,
        });

        const res = await request(app).delete(`/api/contexts/${ctx._id}`);
        expect(res.status).toBe(200);

        const check = await ContextAttachment.findById(ctx._id);
        expect(check).toBeNull();

        const qCheck = await Question.findOne({});
        expect(qCheck.contextAttachment).toBeUndefined();
      });
    });
  });
});
