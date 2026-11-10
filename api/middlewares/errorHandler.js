/**
 * @file errorHandler.js
 * @description Global error handling middleware for formatting and returning standardized error responses.
 * @architecture Captures uncaught exceptions or next(err) calls from the request pipeline and sends a consistent JSON payload.
 */
import { setCorsHeaders } from "./clientblock.js";

/**
 * @desc    Catches application errors and sends a JSON response with status and message, including stack trace in dev
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  setCorsHeaders(req, res);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
