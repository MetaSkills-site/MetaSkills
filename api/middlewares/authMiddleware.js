/**
 * @file authMiddleware.js
 * @description Express middleware for protecting routes via JSON Web Tokens (JWT) and verifying user or admin privileges.
 * @architecture Acts as the primary security layer intercepting requests to validate authentication state before reaching controllers.
 */
import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";
import Session from "../models/session.model.js";
import Admin from "../models/admin.model.js";

/**
 * @desc    Protects routes by ensuring a valid JWT is present and an active user session exists
 */
export const protect = expressAsyncHandler(async (req, res, next) => {
  let token = req.cookies && req.cookies.authToken;

  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Explicitly reject "null" or "undefined" string interpolation
  if (token === "null" || token === "undefined") {
    token = null;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });

      if (!(await Session.findOne({ token: token }))) {
        res.status(401);
        throw new Error(
          "Another login detected. Please login again to continue",
        );
      }

      req.user = decoded;
      return next();
    } catch (err) {
      // Suppress stack trace for normal token failures (invalid, expired)
      res.status(401);
      throw new Error(err.message || "Not authorized, token failed", {
        cause: err,
      });
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

/**
 * @desc    Protects admin routes by ensuring a valid JWT and an active admin session with correct role
 */
export const protectAdmin = expressAsyncHandler(async (req, res, next) => {
  let token = req.cookies && req.cookies.adminToken;

  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token === "null" || token === "undefined") {
    token = null;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });

      if (!(await Session.findOne({ token: token }))) {
        res.status(401);
        throw new Error("Session expired or revoked. Please log in again.");
      }

      // Check if user is Admin
      // Note: We now check Session for admins since they are tracked
      const admin = await Admin.findById(decoded._id); // decoded._id contains the admin user ID from the JWT

      if (!admin) {
        res.status(401);
        throw new Error("Not authorized, admin not found");
      }

      if (admin.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized, not an admin");
      }

      req.admin = admin;
      return next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed", { cause: error });
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

/**
 * @desc    Protects routes allowing both standard users and admins with valid sessions to pass
 */
export const protectUserOrAdmin = expressAsyncHandler(
  async (req, res, next) => {
    let token =
      (req.cookies && req.cookies.adminToken) ||
      (req.cookies && req.cookies.authToken);

    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token === "null" || token === "undefined") {
      token = null;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
          algorithms: ["HS256"],
        });

        // Check if Admin
        if (decoded.role === "admin") {
          if (!(await Session.findOne({ token: token }))) {
            res.status(401);
            throw new Error("Session expired or revoked. Please log in again.");
          }
          const admin = await Admin.findById(decoded._id);
          if (!admin || admin.role !== "admin") {
            res.status(401);
            throw new Error("Not authorized, valid admin not found");
          }
          req.admin = admin;
          req.user = decoded; // For compatibility if controller uses req.user
          return next();
        }

        // Check if User (requires session)
        if (await Session.findOne({ token: token })) {
          req.user = decoded;
          return next();
        }

        res.status(401);
        throw new Error("Not authorized, user not found");
      } catch (error) {
        res.status(401);
        throw new Error("Not authorized, token failed", { cause: error });
      }
    }

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }
  },
);

export default protect;
