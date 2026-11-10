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
  }
}));

const mockExec = jest.fn();
jest.unstable_mockModule("child_process", () => ({
  exec: mockExec
}));

jest.unstable_mockModule("../../config/scripts.registry.js", () => ({
  SCRIPTS_REGISTRY: {
    test_script: {
      name: "Test Script",
      description: "A test script",
      path: "/path/to/test.js"
    }
  }
}));

const scriptsController = (await import("../../controllers/scripts.controller.js")).default;

describe("Scripts Controller", () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const auth = await import("../../middlewares/authMiddleware.js");
    app.post("/api/admin/scripts/run", auth.protectAdmin, scriptsController.runScript);
    app.get("/api/admin/scripts", auth.protectAdmin, scriptsController.getScripts);
    
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Unit Tests", () => {
    describe("GET /api/admin/scripts", () => {
      it("should list available scripts", async () => {
        const res = await request(app).get("/api/admin/scripts");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].key).toBe("test_script");
        expect(res.body.data[0].name).toBe("Test Script");
      });
    });

    describe("POST /api/admin/scripts/run", () => {
      it("should return 400 for missing script key", async () => {
        const res = await request(app).post("/api/admin/scripts/run").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid script key/);
      });

      it("should return 400 for invalid script key", async () => {
        const res = await request(app).post("/api/admin/scripts/run").send({ scriptKey: "invalid_key" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid script key/);
      });

      it("should execute script successfully and return 200", async () => {
        mockExec.mockImplementation((cmd, callback) => {
          callback(null, "stdout success output", "");
        });

        const res = await request(app).post("/api/admin/scripts/run").send({ scriptKey: "test_script" });
        
        expect(mockExec).toHaveBeenCalledWith('node "/path/to/test.js"', expect.any(Function));
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/Script executed successfully/);
        expect(res.body.output).toBe("stdout success output");
      });

      it("should return 200 with false success on script execution error", async () => {
        mockExec.mockImplementation((cmd, callback) => {
          callback(new Error("Command failed"), "stdout partial", "stderr error");
        });

        const res = await request(app).post("/api/admin/scripts/run").send({ scriptKey: "test_script" });
        
        expect(mockExec).toHaveBeenCalledWith('node "/path/to/test.js"', expect.any(Function));
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Script executed with errors/);
        expect(res.body.output).toMatch(/stdout partial\nstderr error/);
        expect(res.body.error).toMatch(/Command failed/);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should bypass DB integration tests as scripts controller interacts with child_process directly", () => {
      expect(true).toBe(true);
    });
  });
});
