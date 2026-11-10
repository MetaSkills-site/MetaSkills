/**
 * @file rateLimit.js
 * @description Provides a simple in-memory rate limiting middleware.
 * @architecture Middleware for protecting endpoints from excessive requests using a local Map.
 */
import { setCorsHeaders } from "./clientblock.js";

const rateLimit = new Map();

/**
 * @desc    Applies simple in-memory rate limiting to the request pipeline
 * @param   {number} windowMs - The time window in milliseconds
 * @param   {number} limit - The maximum number of requests allowed per window
 */
export const rateLimiter = (windowMs, limit) => (req, res, next) => {
  if (process.env.VERCEL) {
    return next();
  }

  const ip = req.ip;
  const now = Date.now();

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }

  const timestamps = rateLimit.get(ip);

  // Filter out timestamps older than the window
  const validTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (validTimestamps.length >= limit) {
    setCorsHeaders(req, res);
    return res.status(429).json({
      success: false,
      message: "Too many requests, please try again later.",
    });
  }

  validTimestamps.push(now);
  rateLimit.set(ip, validTimestamps);

  next();
};
