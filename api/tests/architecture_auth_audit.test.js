import { jest } from "@jest/globals";
import Admin from "../models/admin.model.js";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";
import Module from "../models/Module.model.js";
import Sequence from "../models/Sequence.model.js";

// Mock OAuth2Client
jest.unstable_mockModule("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        email: "test@example.com",
        name: "Google Name",
        picture: "google-pic.jpg"
      })
    })
  }))
}));

// We must dynamically import the controllers after the mock is set up
const adminAuthController = (await import("../controllers/admin.auth.controller.js")).default;
const userController = (await import("../controllers/user.controller.js")).default;
const quizController = (await import("../controllers/quiz.controller.js")).default;

const mockReqRes = (body = {}, cookies = {}, headers = {}, user = null, admin = null) => {
  const req = { body, cookies, headers, user, admin };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
    statusCode: 200,
  };
  return { req, res };
};

describe("Architecture Auth Audit Fixes", () => {
  beforeEach(async () => {
    await Admin.deleteMany({});
    await Session.deleteMany({});
    await User.deleteMany({});
    await Module.deleteMany({});
    await Sequence.deleteMany({});
    jest.clearAllMocks();
  });

  describe("Phase 1: Admin Authentication Flow", () => {
    it("googleAuth should return the admin object and not throw a ReferenceError", async () => {
      await Admin.create({
        email: "test@example.com",
        password: "hashedpassword123", // Assuming password might be required by schema
        role: "admin",
        fullname: "Old Admin Name"
      });

      const { req, res } = mockReqRes({ credential: "dummy-google-token" });

      await adminAuthController.googleAuth(req, res);

      // Verify that it responds successfully (and not with 500 error)
      expect(res.json).toHaveBeenCalled();
      const jsonCallArg = res.json.mock.calls[0][0];
      expect(jsonCallArg.user).toBeDefined();
      expect(jsonCallArg.user.email).toBe("test@example.com");
    });

    it("checkAuth should not unconditionally generate a new token if the admin hasn't changed", async () => {
      const admin = await Admin.create({
        email: "admin@example.com",
        password: "hashedpassword123",
        role: "admin",
        fullname: "Admin User"
      });

      // Create an initial session
      const { req: req1, res: res1 } = mockReqRes({ credential: "dummy-google-token" });
      
      // We need to update the mock to return admin@example.com
      const { OAuth2Client } = await import("google-auth-library");
      OAuth2Client.mockImplementationOnce(() => ({
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: () => ({ email: "admin@example.com", name: "Admin User" })
        })
      }));

      await adminAuthController.googleAuth(req1, res1);
      const initialToken = res1.cookie.mock.calls[0][1];

      // Now call checkAuth
      const { req: req2, res: res2 } = mockReqRes({}, {}, {}, null, admin);
      req2.cookies = { adminToken: initialToken };
      
      await adminAuthController.checkAuth(req2, res2);

      // Verify that the token returned in the cookie is the SAME as the initial token
      // or at least that it didn't do an unnecessary DB upsert that invalidates old tokens.
      res2.cookie.mock.calls.length > 0 ? res2.cookie.mock.calls[0][1] : initialToken;
      
      const session = await Session.findOne({ id: admin._id });
      // The session token in DB should match the original token
      expect(session.token).toBe(initialToken);
    });
  });

  describe("Phase 2: User Onboarding Data Leak", () => {
    it("getModulesWithProgress should throw an error if the user has no grade", async () => {
      // Create user without grade
      const user = await User.create({
        fullname: "No Grade User",
        email: "nograde@example.com",
        carrots: { count: 0 }
      });

      // Mock the req with a user object that lacks a grade
      const { req, res } = mockReqRes({}, {}, {}, { _id: user._id, email: user.email }); // missing grade

      // Create a sequence that shouldn't be accessed
      await Sequence.create({ grade: 12, subject: "english", sequences: ["m1"] });
      
      await expect(quizController.getModulesWithProgress(req, res)).rejects.toThrow(/Profile incomplete|Grade is required/);
    });
  });

  describe("Phase 3: Destructive Profile Sync", () => {
    it("googleAuth should not overwrite custom fullname if user already exists", async () => {
      const user = await User.create({
        fullname: "Custom User Name", // The custom name
        email: "test@example.com",
        carrots: { count: 0 }
      });

      const { req, res } = mockReqRes({ credential: "dummy-google-token" });

      await userController.googleAuth(req, res);

      const updatedUser = await User.findById(user._id);
      
      // Verify that the custom name was preserved, not overwritten by "Google Name"
      expect(updatedUser.fullname).toBe("Custom User Name");
    });
  });
});
