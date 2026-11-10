import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import mongoose from "mongoose";

import errorHandler from "../../middlewares/errorHandler.js";

// Mock screenshot storage util
jest.unstable_mockModule("../../utils/screenshotStorage.js", () => ({
  generateScreenshotUploadSignedUrl: jest.fn(async (filename) => {
    if (filename === "fail.png") throw new Error("GCS Error");
    return { uploadUrl: `http://signed-url/${filename}`, finalUrl: `http://final-url/${filename}` };
  }),
  generateScreenshotReadUrl: jest.fn(async (filename) => {
    if (filename === "fail_read.png") throw new Error("GCS Read Error");
    return `http://read-url/${filename}`;
  }),
  deleteScreenshot: jest.fn(async () => {
    return { ok: true };
  }),
  deleteScreenshots: jest.fn(async (filenames) => {
    return { deletedCount: filenames.length };
  })
}));

// Mock auth middleware
const userId = new mongoose.Types.ObjectId();
jest.unstable_mockModule("../../middlewares/authMiddleware.js", () => ({
  protect: (req, res, next) => {
    req.user = { _id: userId, role: "student" };
    next();
  },
  protectAdmin: (req, res, next) => {
    req.user = { _id: userId, role: "admin" };
    next();
  },
  protectUserOrAdmin: (req, res, next) => {
    req.user = { _id: userId, role: "admin" };
    next();
  }
}));

const {
  reportError,
  getErrors,
  getErrorById,
  resolveError,
  resolveAllErrors,
  checkPendingErrorsStatus,
  getScreenshotUploadUrl
} = await import("../../controllers/error.controller.js");

const { default: ErrorModel } = await import("../../models/Errors.model.js");
const { default: User } = await import("../../models/user.model.js");

describe("Error Controller", () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Use mock middleware
    const auth = await import("../../middlewares/authMiddleware.js");

    app.post("/api/errors/report", auth.protect, reportError);
    app.get("/api/errors", auth.protectAdmin, getErrors);
    app.get("/api/errors/pending-status", auth.protectAdmin, checkPendingErrorsStatus);
    app.get("/api/errors/:id", auth.protectAdmin, getErrorById);
    app.delete("/api/errors/:id", auth.protectAdmin, resolveError);
    app.delete("/api/errors", auth.protectAdmin, resolveAllErrors);
    app.post("/api/errors/screenshot-url", auth.protect, getScreenshotUploadUrl);
    
    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("POST /api/errors/report", () => {
      it("should validate required fields", async () => {
        const res = await request(app)
          .post("/api/errors/report")
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
      
      it("should sanitize and validate systemMetadata", async () => {
        const res = await request(app)
          .post("/api/errors/report")
          .send({
            environment: "prod",
            userDescription: "It crashed",
            systemMetadata: {
              userAgent: "Mozilla/5.0",
              version: "1.0",
              extraField: "invalid"
            }
          });

        expect(res.status).toBe(400); // Because of extraField
      });

      it("should handle DB errors during error reporting", async () => {
        const createSpy = jest.spyOn(ErrorModel.prototype, 'save').mockRejectedValueOnce(new Error("DB Error"));
        // if controller uses ErrorModel.create, we spy on create
        const createModelSpy = jest.spyOn(ErrorModel, 'create').mockRejectedValueOnce(new Error("DB Error"));
        
        const res = await request(app)
          .post("/api/errors/report")
          .send({
            environment: "prod",
            userDescription: "It crashed",
            screenshotUrl: "http://image.png",
            reportType: "manual"
          });

        expect(res.status).toBe(500);
        
        createSpy.mockRestore();
        createModelSpy.mockRestore();
      });
    });

    describe("GET /api/errors/:id", () => {
      it("should return 400 for invalid ID format", async () => {
        const res = await request(app).get("/api/errors/invalid-id");
        expect(res.status).toBe(400);
      });

      it("should handle DB errors during fetch", async () => {
        const validId = new mongoose.Types.ObjectId();
        const spy = jest.spyOn(ErrorModel, 'findById').mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockRejectedValue(new Error("DB Error"))
        });
        const res = await request(app).get(`/api/errors/${validId}`);
        expect(res.status).toBe(500);
        spy.mockRestore();
      });
    });

    describe("DELETE /api/errors/:id", () => {
      it("should return 400 for invalid ID format", async () => {
        const res = await request(app).delete("/api/errors/invalid-id");
        expect(res.status).toBe(400);
      });

      it("should handle DB errors during delete", async () => {
        const validId = new mongoose.Types.ObjectId();
        const spy = jest.spyOn(ErrorModel, 'findByIdAndDelete').mockRejectedValueOnce(new Error("DB Error"));
        // sometimes it might use findById() and then .remove(), let's also spy on findById
        const spy2 = jest.spyOn(ErrorModel, 'findById').mockRejectedValueOnce(new Error("DB Error"));

        const res = await request(app).delete(`/api/errors/${validId}`);
        expect(res.status).toBe(500);
        
        spy.mockRestore();
        spy2.mockRestore();
      });
    });

    describe("DELETE /api/errors", () => {
      it("should require confirm flag", async () => {
        const res = await request(app).delete("/api/errors");
        expect(res.status).toBe(400);
      });

      it("should handle DB errors during bulk delete", async () => {
        const spy = jest.spyOn(ErrorModel, 'deleteMany').mockRejectedValueOnce(new Error("DB Error"));
        const findSpy = jest.spyOn(ErrorModel, 'find').mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockRejectedValue(new Error("DB Error"))
        });
        
        const res = await request(app).delete("/api/errors?confirm=true");
        expect(res.status).toBe(500);
        
        spy.mockRestore();
        findSpy.mockRestore();
      });
    });

    describe("POST /api/errors/screenshot-url", () => {
      it("should generate a signed url", async () => {
        const res = await request(app)
          .post("/api/errors/screenshot-url")
          .send({ filename: "test.png", contentType: "image/png" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.uploadUrl).toBe("http://signed-url/test.png");
      });

      it("should validate content type", async () => {
        const res = await request(app)
          .post("/api/errors/screenshot-url")
          .send({ filename: "test.txt", contentType: "text/plain" });

        expect(res.status).toBe(400);
      });

      it("should handle service errors", async () => {
        const res = await request(app)
          .post("/api/errors/screenshot-url")
          .send({ filename: "fail.png", contentType: "image/png" });

        expect(res.status).toBe(500);
      });
      
      it("should validate path traversal in filename", async () => {
        const res = await request(app)
          .post("/api/errors/screenshot-url")
          .send({ filename: "../test.png", contentType: "image/png" });

        expect(res.status).toBe(400);
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      await ErrorModel.deleteMany({}); 
      await User.deleteMany({});
      await User.create({
        _id: userId,
        fullname: "Test User",
        email: "test@example.com",
        role: "admin",
        password: "password123",
        grade: 4,
      });
    });

    describe("POST /api/errors/report", () => {
      it("should report an error successfully", async () => {
        const res = await request(app)
          .post("/api/errors/report")
          .send({
            environment: "prod",
            userDescription: "It crashed",
            screenshotUrl: "http://image.png",
            reportType: "manual"
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.userDescription).toBe("It crashed");
      });
    });

    describe("GET /api/errors", () => {
      it("should fetch all errors with signed URLs", async () => {
        await ErrorModel.create({
          user: userId,
          environment: "dev",
          userDescription: "test error",
          screenshotFilename: "test.png",
          status: "open"
        });

        const res = await request(app).get("/api/errors");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].screenshotUrl).toBe("http://read-url/test.png");
      });
    });

    describe("GET /api/errors/:id", () => {
      it("should fetch an error by id", async () => {
        const err = await ErrorModel.create({
          user: userId,
          environment: "dev",
          userDescription: "test error",
        });

        const res = await request(app).get(`/api/errors/${err._id}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.userDescription).toBe("test error");
      });

      it("should return 404 if error not found", async () => {
        const validId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/errors/${validId}`);
        expect(res.status).toBe(404);
      });
    });

    describe("DELETE /api/errors/:id", () => {
      it("should resolve and delete error", async () => {
        const err = await ErrorModel.create({
          user: userId,
          environment: "dev",
          userDescription: "test error",
          screenshotFilename: "test.png"
        });

        const res = await request(app).delete(`/api/errors/${err._id}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const check = await ErrorModel.findById(err._id);
        expect(check).toBeNull();
      });
    });

    describe("DELETE /api/errors", () => {
      it("should resolve all errors in bulk with confirm flag", async () => {
        await ErrorModel.create({ user: userId, environment: "dev", userDescription: "err1" });
        await ErrorModel.create({ user: userId, environment: "dev", userDescription: "err2" });

        const res = await request(app).delete("/api/errors?confirm=true");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const count = await ErrorModel.countDocuments();
        expect(count).toBe(0);
      });
    });

    describe("GET /api/errors/pending-status", () => {
      it("should return true if pending errors exist", async () => {
        await ErrorModel.create({ user: userId, environment: "dev", userDescription: "err1", status: "open" });
        
        const res = await request(app).get("/api/errors/pending-status");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.errorReportsAvailable).toBe(true);
      });

      it("should return false if no pending errors", async () => {
        const res = await request(app).get("/api/errors/pending-status");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.errorReportsAvailable).toBe(false);
      });
    });
  });
});
