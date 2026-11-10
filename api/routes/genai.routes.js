/**
 * @file genai.routes.js
 * @description Defines the Express routes for GenAI endpoints such as streaming, evaluation, explanation, and TTS.
 * @architecture Acts as the API layer connecting incoming HTTP requests for AI features to the GenAI controller.
 */
import express from "express";
import {
  generateContentStream,
  evaluateSentence,
  generateExplanation,
  generateTTS,
  parseQuestionsText,
} from "../controllers/genai.controller.js";
import {
  protectUserOrAdmin,
  protectAdmin,
} from "../middlewares/authMiddleware.js";
import idempotencyGuard from "../middlewares/idempotency.js";
import { genaiRateLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.post("/stream", protectUserOrAdmin, generateContentStream);
router.post(
  "/sentences/evaluate",
  protectUserOrAdmin,
  idempotencyGuard,
  evaluateSentence,
);
router.post("/explanation", protectUserOrAdmin, generateExplanation);
router.post("/tts", protectUserOrAdmin, generateTTS);
router.post(
  "/parse-questions",
  protectAdmin,
  genaiRateLimiter,
  parseQuestionsText,
);

/**
 * @module genaiRoutes
 * @description Express router serving GenAI-related operations.
 */
export default router;
