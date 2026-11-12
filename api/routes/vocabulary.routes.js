/**
 * @file vocabulary.routes.js
 * @description Defines the routes for vocabulary quizzes and administrative vocabulary management.
 * @architecture Acts as the API routing layer for vocabulary operations, integrating with vocabulary controllers and idempotency guards.
 */
import express from "express";
import vocabularyController from "../controllers/vocabulary.controller.js";
import { protectAdmin, protect } from "../middlewares/authMiddleware.js";
import idempotencyGuard from "../middlewares/idempotency.js";
import { vocabularyLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.use(vocabularyLimiter);

// Public (Authenticated) Routes
router.get("/random", protect, vocabularyController.getRandomVocabulary);
router.get("/quiz", protect, vocabularyController.getVocabularyQuiz);
router.post(
  "/verify",
  protect,
  idempotencyGuard,
  vocabularyController.verifyVocabularyResponse,
);

// Admin Routes
router.use(protectAdmin);

// GET all vocabulary
router.get("/", vocabularyController.getAllVocabulary);

// POST bulk create
router.post("/bulk", vocabularyController.bulkCreateVocabulary);

// POST create single
router.post("/", vocabularyController.createVocabulary);

// GET by ID
router.get("/:id", vocabularyController.getVocabularyById);

// PUT update
router.put("/:id", vocabularyController.updateVocabulary);

// DELETE
router.delete("/:id", vocabularyController.deleteVocabulary);

/**
 * @module vocabularyRouter
 * @description Serves vocabulary-related routes including quizzes, random fetching, and admin CRUD operations.
 */
export default router;
