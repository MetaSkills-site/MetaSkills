/**
 * @file csrfMiddleware.js
 * @description Express middleware for CSRF token generation and validation.
 * @architecture Used to secure state-changing endpoints against cross-site request forgery by requiring a token.
 */
import crypto from "crypto";

/**
 * @desc    Middleware that validates CSRF tokens for state-changing requests
 * @param   {Object} req - Express request
 * @param   {Object} res - Express response
 * @param   {Function} next - Express next middleware function
 */
export const csrfProtection = (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt authentication routes from CSRF since they establish the session
  const publicRoutes = ["/api/users/google-auth", "/api/admin/auth/google"];
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const cookieToken = req.cookies && req.cookies["XSRF-TOKEN"];
  const headerToken = req.headers["x-xsrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "CSRF token missing or invalid" });
  }

  next();
};

/**
 * @desc    Generates and sets a new CSRF token in a cookie, and returns it to the client
 * @param   {Object} req - Express request
 * @param   {Object} res - Express response
 */
export const generateCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie("XSRF-TOKEN", token, {
    httpOnly: false, // Must be readable by client JavaScript
    secure: process.env.NODE_ENV === "production" ? true : true, // For consistency, or just true since SameSite=None needs it
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.json({ csrfToken: token });
};
