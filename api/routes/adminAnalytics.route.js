/**
 * @file adminAnalytics.route.js
 * @description Defines routes for fetching various admin analytics and statistics.
 * @architecture Connects the admin analytics controller to the admin analytics path within the application routing hierarchy.
 */
import express from "express";
import {
  getGlobalStats,
  getEngagementTrends,
  getMisfitQuestions,
  getChallengingModules,
  getFormatEffectiveness,
  getGradeCompetency,
  getSpeedVsComprehension,
  getVocabularyDifficultyStats,
} from "../controllers/adminAnalytics.controller.js";
import { protectAdmin } from "../middlewares/authMiddleware.js";
import { adminAnalyticsLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();

// All analytics routes should be protected and restricted to admins
router.use(protectAdmin);
router.use(adminAnalyticsLimiter);

router.get("/global-stats", getGlobalStats);
router.get("/engagement-trends", getEngagementTrends);
router.get("/misfit-questions", getMisfitQuestions);
router.get("/challenging-modules", getChallengingModules);
router.get("/format-effectiveness", getFormatEffectiveness);
router.get("/grade-competency", getGradeCompetency);
router.get("/speed-vs-comprehension", getSpeedVsComprehension);
router.get("/vocabulary-difficulty", getVocabularyDifficultyStats);

/**
 * @module adminAnalyticsRouter
 * @description Serves analytics endpoints restricted to administrative users.
 */
export default router;
