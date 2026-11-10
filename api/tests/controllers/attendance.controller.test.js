import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import errorHandler from "../../middlewares/errorHandler.js";

const userId = new mongoose.Types.ObjectId();
let mockUser = {
  _id: userId,
  days: [-1, -1, -1, -1, -1, -1, -1],
  week: 1,
  lastSeen: new Date()
};

jest.unstable_mockModule("../../middlewares/authMiddleware.js", () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));

const { attendance } = await import("../../controllers/attendance.controller.js");
const { default: User } = await import("../../models/user.model.js");

describe("Attendance Controller", () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const auth = await import("../../middlewares/authMiddleware.js");
    app.get("/api/attendance", auth.protect, attendance);
    
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Unit Tests", () => {
    it("should return 500 when days are missing from req.user", async () => {
      mockUser = {
        _id: userId,
        days: null, // this will cause error when trying to mutate days
        week: 1,
        lastSeen: new Date()
      };
      
      const res = await request(app).get("/api/attendance");
      expect(res.status).toBe(500);
      expect(res.body.message).toBeDefined();
    });

    it("should return 500 when database throws an error", async () => {
      mockUser = {
        _id: userId,
        days: [-1, -1, -1, -1, -1, -1, -1],
        week: 1,
        lastSeen: new Date()
      };
      
      jest.spyOn(User, "findByIdAndUpdate").mockRejectedValue(new Error("DB connection lost"));
      
      const res = await request(app).get("/api/attendance");
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Something went wrong/);
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      await User.deleteMany({});
    });

    describe("GET /api/attendance", () => {
      it("should update attendance for same week", async () => {
        const today = new Date();
        mockUser = {
          _id: userId,
          days: [-1, -1, -1, -1, -1, -1, -1],
          week: 1,
          lastSeen: today
        };

        await User.create({
          _id: userId,
          email: "att1@test.com",
          fullname: "Att User",
          password: "123",
          role: "student",
          days: [-1, -1, -1, -1, -1, -1, -1],
          week: 1
        });

        const res = await request(app).get("/api/attendance");
        expect(res.status).toBe(200);
        expect(res.body.week).toBe(1);
        
        const day = today.getDay();
        expect(res.body.days[day]).toBe(1);
      });

      it("should start new week and increment week count", async () => {
        // Set lastSeen to a month ago to force new week branch
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        mockUser = {
          _id: userId,
          days: [1, 1, 1, 1, 1, 1, 1],
          week: 1,
          lastSeen: lastMonth
        };

        await User.create({
          _id: userId,
          email: "att2@test.com",
          fullname: "Att User 2",
          password: "123",
          role: "student",
          days: [1, 1, 1, 1, 1, 1, 1],
          week: 1
        });

        const res = await request(app).get("/api/attendance");
        expect(res.status).toBe(200);
        expect(res.body.week).toBe(2);
        
        const day = new Date().getDay();
        expect(res.body.days[day]).toBe(1);
      });
    });
  });
});
