import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import errorHandler from "../../middlewares/errorHandler.js";

jest.unstable_mockModule("../../config/brevo.js", () => ({
  default: {
    sendTransacEmail: jest.fn(async (payload) => {
      if (payload.subject.includes("FailEmail")) throw new Error("Brevo Error");
      return { messageId: "123" };
    }),
  },
}));

jest.unstable_mockModule("../../services/ai.service.js", () => ({
  aiService: {
    generateWithFallback: jest.fn(async (models, prompt) => {
      if (prompt.includes("FailAI")) throw new Error("AI Error");
      return { text: "AI Analysis Details", usedModel: models[0] };
    }),
  },
}));

const { sendErrorReport } =
  await import("../../controllers/email.controller.js");

describe("Email Controller", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post("/api/email/error-report", sendErrorReport);
    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    describe("POST /api/email/error-report", () => {
      it("should send error report successfully with AI analysis", async () => {
        const res = await request(app)
          .post("/api/email/error-report")
          .send({
            error: { message: "Test Error", stack: "Stack Trace" },
            url: "http://localhost",
            userAgent: "Jest",
            platform: "Node",
            language: "en",
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Error report sent successfully");
      });

      it("should send error report successfully even if AI analysis fails", async () => {
        const res = await request(app)
          .post("/api/email/error-report")
          .send({
            error: { message: "FailAI", stack: "Stack Trace" },
            url: "http://localhost",
            userAgent: "Jest",
            platform: "Node",
            language: "en",
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Error report sent successfully");
      });

      it("should return 500 if email service fails", async () => {
        const res = await request(app)
          .post("/api/email/error-report")
          .send({
            error: { message: "FailEmail", stack: "Stack Trace" },
            url: "http://localhost",
            userAgent: "Jest",
            platform: "Node",
            language: "en",
          });

        expect(res.status).toBe(500);
      });

      it("should handle missing error details gracefully", async () => {
        const res = await request(app).post("/api/email/error-report").send({
          url: "http://localhost",
          userAgent: "Jest",
          platform: "Node",
          language: "en",
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Error report sent successfully");
      });
    });
  });

  describe("Integration Tests", () => {
    describe("POST /api/email/error-report", () => {
      it.todo("should test with real external services if needed");
    });
  });
});
