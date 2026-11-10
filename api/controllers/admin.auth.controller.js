/**
 * @file admin.auth.controller.js
 * @description Handles authentication and session management for admin users.
 * @architecture Acts as the entry point for admin login, issuing JWTs and managing admin sessions in the database.
 */
import Admin from "../models/admin.model.js";
import Session from "../models/session.model.js";
import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";

import { OAuth2Client } from "google-auth-library";

// Generate consistent minimal JWT payload for admins
const generateAdminToken = (admin) => {
  return jwt.sign(
    { _id: admin._id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
      algorithm: "HS256",
    },
  );
};

const adminCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// In-memory OTP store removed as we are switching to Google OAuth
// In-memory OTP store removed as we are switching to Google OAuth
// const adminOtps = {};
// const genOtp = ... (removed unused)
// const sendOtpEmail = ... (removed unused)

/**
 * @desc    Authenticate admin via Google OAuth token and issue JWT
 * @route   POST /api/admin/auth/google
 * @access  Public
 */
// Google OAuth Authentication for Admins
const googleAuth = expressAsyncHandler(async (req, res) => {
  const { credential } = req.body;

  const googleClientId =
    process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error(
      "Critical: Google Client ID is missing in environment variables.",
    );
    res.status(500);
    throw new Error("Server configuration error: Google Client ID is missing.");
  }

  if (!credential) {
    res.status(400);
    throw new Error("Google credential is required");
  }

  try {
    // Verify Google token
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email || !name) {
      res.status(400);
      throw new Error("Invalid Google token - missing required fields");
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email });

    if (!admin) {
      res.status(401);
      throw new Error(
        "You are not authorized to access the admin portal. Please contact a superadmin.",
      );
    }

    // Sync fullname from Google
    admin.fullname = name;
    await admin.save();

    const token = generateAdminToken(admin);

    await Session.updateOne(
      { id: admin._id },
      { $set: { token, onModel: "Admin" } },
      { upsert: true },
    );

    const adminObj = admin.toObject();

    res.cookie("adminToken", token, adminCookieOptions).json({
      message: "Admin logged in successfully",
      user: adminObj,
    });
  } catch (error) {
    console.error("Admin Google auth error:", error);
    res.status(res.statusCode === 200 ? 401 : res.statusCode);
    throw new Error(error.message || "Admin authentication failed", {
      cause: error,
    });
  }
});

/**
 * @desc    Validate existing admin session and return a fresh token
 * @route   GET /api/admin/auth/check
 * @access  Private (Admin)
 */
const checkAuth = expressAsyncHandler(async (req, res) => {
  // If the request reaches here, it passed the protectAdmin middleware,
  // so req.admin is already populated and valid.
  // const admin = req.admin; // unused

  // CheckAuth: return a fresh token or the current identity validated
  // Since we trust the token in middleware (req.admin), we can just return a confirmation
  // or a refreshed token.
  // To align with philosophy: return token with latest data.
  // We need to fetch latest from DB to be sure?
  // Middleware set req.admin = decoded. If we want fresh data, we must fetch.
  // But protectAdmin didn't fetch.
  // Let's fetch to be safe for 'checkAuth' which implies a validity check.
  try {
    const freshAdmin = await Admin.findById(req.admin._id);
    if (!freshAdmin) throw new Error("Admin not found");

    const tokenPayload = req.admin;
    const hasChanged =
      tokenPayload.email !== freshAdmin.email ||
      tokenPayload.role !== freshAdmin.role;

    if (!hasChanged) {
      return res.status(200).json({
        success: true,
        user: freshAdmin.toObject(),
      });
    }

    const token = generateAdminToken(freshAdmin);

    await Session.updateOne(
      { id: freshAdmin._id },
      { $set: { token, onModel: "Admin" } },
      { upsert: true },
    );

    res.status(200).cookie("adminToken", token, adminCookieOptions).json({
      success: true,
      user: freshAdmin.toObject(),
    });
  } catch (e) {
    res.status(401);
    throw new Error("Admin validation failed", { cause: e });
  }
});

const logout = expressAsyncHandler(async (req, res) => {
  try {
    let token = req.cookies && req.cookies.adminToken;
    if (token === "null" || token === "undefined") token = null;

    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      await Session.deleteOne({ token });
    }

    res.clearCookie("adminToken", adminCookieOptions).json({
      message: "Admin logged out successfully",
      success: true,
    });
  } catch (e) {
    res.status(500);
    throw new Error("Admin logout failed", { cause: e });
  }
});

export default { googleAuth, checkAuth, logout };
