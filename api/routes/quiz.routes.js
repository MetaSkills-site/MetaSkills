/**
 * @file quiz.routes.js
 * @description Configures the routing for quiz questions, modules, sequences, imports, and user interactions.
 * @architecture Acts as the primary API router for quiz management and student test flow, communicating with the quiz controller.
 */
import express from "express";
import quizController from "../controllers/quiz.controller.js";
import protect, {
  protectAdmin,
  protectUserOrAdmin,
} from "../middlewares/authMiddleware.js";
import idempotencyGuard from "../middlewares/idempotency.js";
import {
  getSequenceByGradeAndSubject,
  updateSequence,
} from "../controllers/sequence.controller.js";
import { quizLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.use(quizLimiter);

// Question routes
router.post("/questions", protectAdmin, quizController.createQuestion);
router.get("/questions/skills", protectUserOrAdmin, quizController.getSkills);
router.post("/questions/get", protectUserOrAdmin, quizController.getQuestions); // Changed from GET /questions
router.post(
  "/questionsByModule",
  protectUserOrAdmin,
  quizController.getQuestionsByModuleId,
);
router.post("/trash/questions", protectAdmin, quizController.getTrashQuestions); // Changed from GET
router.delete("/trash/questions", protectAdmin, quizController.emptyTrash);
router.post(
  "/questions/getById",
  protectUserOrAdmin,
  quizController.getQuestionByIdForQuiz,
); // Use safe version for quiz flow
router.post(
  "/questions/getByIdAdmin",
  protectAdmin,
  quizController.getQuestionById,
); // Admin version (full data) // Changed from GET /questions/:id
router.put("/questions/update", protectAdmin, quizController.updateQuestion); // Changed from PUT /questions/:id
router.put("/questions/restore", protectAdmin, quizController.restoreQuestion); // Changed from PUT /questions/:id/restore
router.delete("/questions/delete", protectAdmin, quizController.deleteQuestion); // Changed from DELETE /questions/:id
router.delete(
  "/questions/deletePermanent",
  protectAdmin,
  quizController.deleteQuestionPermanently,
); // Changed from DELETE /questions/:id/permanent

// Module routes
router.post("/modules", protectAdmin, quizController.createModule);
router.post("/modules/get", protectUserOrAdmin, quizController.getModules); // Changed from GET /modules
router.post(
  "/modules/getById",
  protectUserOrAdmin,
  quizController.getModuleById,
); // Changed from GET /modules/:id
router.put("/modules/update", protectAdmin, quizController.updateModule); // Changed from PUT /modules/:id
router.delete("/modules/delete", protectAdmin, quizController.deleteModule); // Changed from DELETE /modules/:id
router.delete(
  "/modules/deleteCascade",
  protectAdmin,
  quizController.deleteModuleAndQuestions,
); // Changed from DELETE /modules/:id/cascade

// Sequence Routes
router.get(
  "/sequence/:subject/:grade",
  protectAdmin,
  getSequenceByGradeAndSubject,
);
router.put("/sequence/:subject/:grade", protectAdmin, updateSequence);

// Module questions management
router.post(
  "/modules/addQuestion",
  protectAdmin,
  quizController.addQuestionToModule,
); // Changed from POST /modules/:id/questions
router.delete(
  "/modules/removeQuestion",
  protectAdmin,
  quizController.removeQuestionFromModule,
); // Changed from DELETE /modules/:id/questions/:questionId

// Bulk Import
router.post("/bulk-import", protectAdmin, quizController.bulkImportQuestions);

// Student Quiz Flow
router.post("/modules/start", protect, quizController.startModule);
router.post("/submit", protect, idempotencyGuard, quizController.submitAnswer);
router.post(
  "/response",
  protect,
  idempotencyGuard,
  quizController.saveMarathonResponse,
);
router.post(
  "/modules/progress",
  protect,
  quizController.getModulesWithProgress,
);
router.post("/modules/next", protect, quizController.nextQuestion);
router.get("/history", protect, quizController.getMyHistory);
router.get("/analytics/daily", protect, quizController.getDailyAnalytics);
router.get(
  "/analytics/marathons",
  protect,
  quizController.getMarathonAnalytics,
);
router.get(
  "/analytics/speed-accuracy",
  protect,
  quizController.getSpeedAccuracyAnalytics,
);
router.get("/analytics/formats", protect, quizController.getFormatAnalytics);
router.get(
  "/analytics/difficulty",
  protect,
  quizController.getDifficultyAnalytics,
);
router.get("/analytics/skills", protect, quizController.getSkillsAnalytics);

// User History (Admin)
router.get(
  "/admin/users/:userId/history",
  protectAdmin,
  quizController.getUserHistory,
);

router.delete(
  "/admin/responses/:responseId",
  protectAdmin,
  quizController.deleteResponse,
);

/**
 * @module quizRoutes
 * @description Express router serving quiz, question, module management, and student test flows.
 */
export default router;
