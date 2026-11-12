import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import errorHandler from "../../middlewares/errorHandler.js";

const userId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();

jest.unstable_mockModule("../../middlewares/authMiddleware.js", () => ({
  protect: (req, res, next) => {
    // If we want to simulate an admin request, we can set req.user in the test setup somehow,
    // but a simple mock could just rely on headers if we need to switch roles,
    // or we just define protect to use adminId if a certain header is set.
    if (req.headers["x-role"] === "admin") {
      req.user = { _id: adminId, role: "admin" };
    } else {
      req.user = { _id: userId, role: "student" };
    }
    next();
  },
  protectAdmin: (req, res, next) => {
    req.user = { _id: adminId, role: "admin" };
    next();
  },
}));

const notificationController = (
  await import("../../controllers/notification.controller.js")
).default;
const { default: Notification } =
  await import("../../models/Notification.model.js");

describe("Notification Controller", () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const auth = await import("../../middlewares/authMiddleware.js");
    app.get(
      "/api/notifications/unread",
      auth.protect,
      notificationController.getUnreadStatus,
    );
    app.get(
      "/api/notifications",
      auth.protect,
      notificationController.getNotifications,
    );
    app.post(
      "/api/notifications",
      auth.protectAdmin,
      notificationController.createNotification,
    );
    app.get(
      "/api/notifications/all",
      auth.protectAdmin,
      notificationController.getAllNotifications,
    );
    app.delete(
      "/api/notifications",
      auth.protectAdmin,
      notificationController.deleteNotification,
    );

    app.use(errorHandler);
  });

  describe("Unit Tests", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("GET /api/notifications/unread", () => {
      it("should handle server errors gracefully", async () => {
        jest
          .spyOn(Notification, "findOne")
          .mockRejectedValueOnce(new Error("DB Error"));
        const res = await request(app).get("/api/notifications/unread");
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Server error");
      });
    });

    describe("GET /api/notifications", () => {
      it("should handle server errors gracefully", async () => {
        jest
          .spyOn(Notification, "findOne")
          .mockRejectedValueOnce(new Error("DB Error"));
        const res = await request(app).get("/api/notifications");
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Server error");
      });
    });

    describe("POST /api/notifications", () => {
      it("should require title and content", async () => {
        const res = await request(app)
          .post("/api/notifications")
          .send({ title: "Only Title" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Title and content are required/);
      });

      it("should handle server errors gracefully", async () => {
        jest
          .spyOn(Notification, "findOne")
          .mockRejectedValueOnce(new Error("DB Error"));
        const res = await request(app)
          .post("/api/notifications")
          .send({ title: "T", content: "C" });
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Server error");
      });
    });

    describe("GET /api/notifications/all", () => {
      it("should handle server errors gracefully", async () => {
        jest
          .spyOn(Notification, "findOne")
          .mockRejectedValueOnce(new Error("DB Error"));
        const res = await request(app).get("/api/notifications/all");
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Server error");
      });
    });

    describe("DELETE /api/notifications", () => {
      it("should handle server errors gracefully", async () => {
        jest
          .spyOn(Notification, "findOne")
          .mockRejectedValueOnce(new Error("DB Error"));
        const res = await request(app)
          .delete("/api/notifications")
          .send({ notificationId: "someId", clearSeen: false });
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Server error");
      });
    });
  });

  describe("Integration Tests", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      await Notification.deleteMany({});
    });

    describe("GET /api/notifications/unread", () => {
      it("should return true if user has not seen notifications", async () => {
        await Notification.create({
          data: [{ title: "T1", content: "C1" }],
          seenBy: [],
        });

        const res = await request(app).get("/api/notifications/unread");
        expect(res.status).toBe(200);
        expect(res.body).toBe(true);
      });

      it("should return false if user has seen notifications", async () => {
        await Notification.create({
          data: [{ title: "T1", content: "C1" }],
          seenBy: [userId],
        });

        const res = await request(app).get("/api/notifications/unread");
        expect(res.status).toBe(200);
        expect(res.body).toBe(false);
      });
    });

    describe("GET /api/notifications", () => {
      it("should fetch notifications and mark as read", async () => {
        await Notification.create({
          data: [
            { title: "T1", content: "C1" },
            { title: "T2", content: "C2" },
          ],
          seenBy: [],
        });

        const res = await request(app).get("/api/notifications");
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].title).toBe("T2"); // reversed order

        const doc = await Notification.findOne();
        expect(doc.seenBy).toContainEqual(userId);
      });
    });

    describe("POST /api/notifications", () => {
      it("should create a notification and clear seenBy array", async () => {
        await Notification.create({ data: [], seenBy: [userId] });

        const res = await request(app).post("/api/notifications").send({
          title: "New Update",
          content: "System will be down",
        });
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Notification created");
        expect(res.body.notification.title).toBe("New Update");

        const doc = await Notification.findOne();
        expect(doc.data.length).toBe(1);
        expect(doc.seenBy.length).toBe(0);
      });
    });

    describe("GET /api/notifications/all", () => {
      it("should return paginated notifications", async () => {
        await Notification.create({
          data: [
            { title: "1", content: "1" },
            { title: "2", content: "2" },
            { title: "3", content: "3" },
          ],
          seenBy: [],
        });

        const res = await request(app).get(
          "/api/notifications/all?page=1&limit=2",
        );
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data[0].title).toBe("3"); // Reversed order
        expect(res.body.meta.total).toBe(3);
      });
    });

    describe("DELETE /api/notifications", () => {
      it("should delete a specific notification", async () => {
        const doc = await Notification.create({
          data: [
            { title: "T1", content: "C1" },
            { title: "T2", content: "C2" },
          ],
          seenBy: [userId],
        });

        const res = await request(app)
          .delete("/api/notifications")
          .send({
            notificationId: doc.data[0]._id.toString(),
            clearSeen: false,
          });

        expect(res.status).toBe(200);

        const updated = await Notification.findOne();
        expect(updated.data.length).toBe(1);
        expect(updated.data[0].title).toBe("T2");
        expect(updated.seenBy).toContainEqual(userId);
      });

      it("should clear seenBy if requested", async () => {
        const doc = await Notification.create({
          data: [{ title: "T1", content: "C1" }],
          seenBy: [userId],
        });

        const res = await request(app)
          .delete("/api/notifications")
          .send({
            notificationId: doc.data[0]._id.toString(),
            clearSeen: true,
          });

        expect(res.status).toBe(200);

        const updated = await Notification.findOne();
        expect(updated.seenBy.length).toBe(0);
      });
    });
  });
});
