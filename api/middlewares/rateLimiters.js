/**
 * @file rateLimiters.js
 * @description Configures pre-defined rate limiting middleware for various routes.
 * @architecture Uses express-rate-limit to protect auth and GenAI endpoints from abuse.
 */
import rateLimit from "express-rate-limit";
import { setCorsHeaders } from "./clientblock.js";

/**
 * @desc    Ensures CORS headers are included even on rate-limit responses
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware function
 * @param   {Object} options - Rate limit options
 */
const customHandler = (req, res, next, options) => {
  // Ensure CORS headers are present even on rate-limit responses
  setCorsHeaders(req, res);
  res.status(options.statusCode).json(options.message);
};

// Rate limiter for login/auth endpoints (stricter)
/**
 * @desc    Limits login/auth requests to prevent brute force attacks
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message:
      "Too many login attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: customHandler,
});

// General auth rate limiter for other auth-related actions (e.g. complete-profile, read)
/**
 * @desc    Limits general authentication requests
 */
export const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message:
      "Too many authentication requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler,
});

// Rate limiter for GenAI parsing endpoint (Groq API protection — 30 req/min for iterative imports)
/**
 * @desc    Limits GenAI parsing requests to protect external API usage
 */
export const genaiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute (supports 10-page iterative imports)
  message: {
    success: false,
    message: "AI parsing rate limit exceeded. Please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler,
});
