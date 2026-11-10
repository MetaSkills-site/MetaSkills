/**
 * @file math.routes.js
 * @description Sets up the routing for math-related queries and answer checking.
 * @architecture Provides the HTTP interface for math features, directing requests to the math controller.
 */
import express from "express";
import mathController from "../controllers/math.controller.js";
// The prompt doesn't explicitly ask for auth protection, but "math marathon" sounds like a user feature.
// Let's check `quiz.routes.js` to see if quizzes are protected.
// It's safer to probably protect it, but for now I'll leave it open or check existing patterns.
// Actually, `express.js` has `app.use("/api/quiz", quizRoute);`.
// Let's check `quiz.routes.js` content.

const router = express.Router();

// Public or Protected?
// "It will serve users the sums..."
// Usually these are for logged in users.
// I'll assume protected for now, but I'll check `quiz.routes.js` first to be sure.
// For now, I'll write it without middleware and add it if I see it's standard.

import { protect } from "../middlewares/authMiddleware.js";
import idempotencyGuard from "../middlewares/idempotency.js";

router.get("/topics", protect, mathController.getTopics);
router.get("/question", protect, mathController.getQuestion);
router.post("/answer", protect, idempotencyGuard, mathController.checkAnswer);

/**
 * @module mathRoutes
 * @description Express router serving Math-related endpoints.
 */
export default router;
