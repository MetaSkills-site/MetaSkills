import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import errorHandler from "../../middlewares/errorHandler.js";

const userId = new mongoose.Types.ObjectId();

jest.unstable_mockModule("../../middlewares/authMiddleware.js", () => ({
  protectAdmin: (req, res, next) => {
    req.user = { _id: userId, role: "admin" };
    next();
  },
}));

const mockUpload = jest.fn();
const mockList = jest.fn();
const mockDelete = jest.fn();
const mockEmpty = jest.fn();
const mockGetContent = jest.fn();

jest.unstable_mockModule("../../config/googledriveupload.js", () => ({
  uploadBackupToDrive: mockUpload,
  listDriveFiles: mockList,
  deleteDriveFile: mockDelete,
  emptyDriveFolder: mockEmpty,
  getDriveFileContent: mockGetContent,
}));

const backupController = (
  await import("../../controllers/backup.controller.js")
).default;
const { default: Question } = await import("../../models/Questions.model.js");
const { default: Module } = await import("../../models/Module.model.js");

describe("Backup Controller", () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const auth = await import("../../middlewares/authMiddleware.js");
    app.post("/api/backup", auth.protectAdmin, backupController.backupToDrive);
    app.get("/api/backup", auth.protectAdmin, backupController.getBackupFiles);
    app.delete(
      "/api/backup/empty",
      auth.protectAdmin,
      backupController.emptyBackupDrive,
    );
    app.delete(
      "/api/backup/:fileId",
      auth.protectAdmin,
      backupController.deleteBackupFile,
    );
    app.get(
      "/api/backup/:fileId/content",
      auth.protectAdmin,
      backupController.getBackupFileContent,
    );

    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("POST /api/backup", () => {
      it("should return 500 on database fetch failure", async () => {
        jest
          .spyOn(Module, "find")
          .mockRejectedValue(new Error("Database error"));

        const res = await request(app).post("/api/backup");
        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/Database error/);
      });

      it("should return 500 on upload failure", async () => {
        jest.spyOn(Module, "find").mockResolvedValue([]);
        jest.spyOn(Question, "find").mockResolvedValue([]);
        mockUpload.mockRejectedValue(new Error("Drive error"));

        const res = await request(app).post("/api/backup");
        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/Drive error/);
      });
    });

    describe("GET /api/backup", () => {
      it("should list backup files", async () => {
        mockList.mockResolvedValue([{ id: "1", name: "backup1.json" }]);

        const res = await request(app).get("/api/backup");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.files.length).toBe(1);
      });

      it("should return 500 on list failure", async () => {
        mockList.mockRejectedValue(new Error("Drive error"));

        const res = await request(app).get("/api/backup");
        expect(res.status).toBe(500);
        expect(res.body.message).toBeDefined();
      });
    });

    describe("DELETE /api/backup/:fileId", () => {
      it("should delete specific backup file", async () => {
        mockDelete.mockResolvedValue(true);

        const res = await request(app).delete("/api/backup/123");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockDelete).toHaveBeenCalledWith("123");
      });

      it("should return 500 on delete failure", async () => {
        mockDelete.mockRejectedValue(new Error("Drive error"));

        const res = await request(app).delete("/api/backup/123");
        expect(res.status).toBe(500);
        expect(res.body.message).toBeDefined();
      });
    });

    describe("DELETE /api/backup/empty", () => {
      it("should empty drive folder", async () => {
        mockEmpty.mockResolvedValue(5);

        const res = await request(app).delete("/api/backup/empty");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/5 files/);
      });

      it("should return 500 on empty failure", async () => {
        mockEmpty.mockRejectedValue(new Error("Drive error"));

        const res = await request(app).delete("/api/backup/empty");
        expect(res.status).toBe(500);
        expect(res.body.message).toBeDefined();
      });
    });

    describe("GET /api/backup/:fileId/content", () => {
      it("should get backup file content", async () => {
        const mockContent = { questions: [], modules: [] };
        mockGetContent.mockResolvedValue(mockContent);

        const res = await request(app).get("/api/backup/123/content");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.content).toEqual(mockContent);
        expect(mockGetContent).toHaveBeenCalledWith("123");
      });

      it("should return 500 on content fetch failure", async () => {
        mockGetContent.mockRejectedValue(new Error("Drive error"));

        const res = await request(app).get("/api/backup/123/content");
        expect(res.status).toBe(500);
        expect(res.body.message).toBeDefined();
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      await Question.deleteMany({});
      await Module.deleteMany({});
    });

    afterAll(async () => {
      await Question.deleteMany({});
      await Module.deleteMany({});
    });

    describe("POST /api/backup", () => {
      it("should successfully create and upload backup with real db data", async () => {
        mockUpload.mockResolvedValue("mock_file_id");
        await Module.create({
          name: "M1",
          subject: "english",
          status: "published",
        });

        const res = await request(app).post("/api/backup");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.fileId).toBe("mock_file_id");

        expect(mockUpload).toHaveBeenCalledTimes(1);
      });
    });
  });
});
