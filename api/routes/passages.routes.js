/**
 * @file passages.routes.js
 * @description Defines routes for managing passages, generating quizzes, and bulk sentences.
 * @architecture Serves as the API interface for the reading and comprehension features, routing to the passages controller.
 */
import express from "express";
import { protectAdmin, protect } from "../middlewares/authMiddleware.js";
import passagesController from "../controllers/passages.controller.js";

const router = express.Router();

router
  .route("/")
  .post(protectAdmin, passagesController.createPassage)
  .get(protectAdmin, passagesController.getAllPassages);

router.post(
  "/bulk-sentences",
  protectAdmin,
  passagesController.createBulkSentences,
);

router.get(
  "/generate/grammar",
  protect,
  passagesController.generateGrammarQuiz,
);
router.get(
  "/generate/vocabulary",
  protect,
  passagesController.generateVocabularyQuiz,
);
router.get(
  "/generate/passage",
  protect,
  passagesController.generatePassageQuiz,
);

router
  .route("/:id")
  .get(protectAdmin, passagesController.getPassageById)
  .put(protectAdmin, passagesController.updatePassage)
  .delete(protectAdmin, passagesController.deletePassage);

/**
 * @module passagesRoutes
 * @description Express router serving endpoints for reading passages and related quizzes.
 */
export default router;
