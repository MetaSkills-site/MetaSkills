/**
 * @file math.controller.js
 * @description Manages math topic retrieval and dynamic question generation.
 * @architecture Controller layer that delegates mathematical generation logic to the mathService and handles user gamification updates.
 */
import expressAsyncHandler from "express-async-handler";
import mathService from "../services/math.service.js";
import User from "../models/user.model.js";
import { GAMIFICATION } from "../config/gamification.js";

/**
 * @desc    Get math topics based on a given path
 * @route   GET /api/math/topics
 * @access  Public
 */
const getTopics = expressAsyncHandler(async (req, res) => {
  const { path } = req.query;
  // path can be undefined, or a comma separated string etc, or just a string "Arithmetic"
  // The service expects a single string or undefined.
  // If the frontend sends "Arithmetic,Simple arithmetic", we might need to handle that?
  // The prompt says: "The browser should send a current page... FOr example, the browser sends arithmetic..."
  // It seems the frontend sends the *current parent*.
  // So if I am at "Math", I request children of "Math".
  // If I click "Arithmetic", I request children of "Arithmetic".

  const topics = mathService.getTopics(path);
  res.json({
    success: true,
    data: topics,
  });
});

/**
 * @desc    Generate a math question for a specific topic ID
 * @route   GET /api/math/question
 * @access  Public
 */
const getQuestion = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) {
    res.status(400);
    throw new Error("Question ID is required");
  }

  try {
    const questionData = mathService.generateQuestion(id);
    res.json({
      success: true,
      data: questionData,
    });
  } catch (error) {
    res.status(404);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Verify an answer for a generated math question and award carrots if correct
 * @route   POST /api/math/answer
 * @access  Private
 */
const checkAnswer = expressAsyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized: User not found");
  }

  const { token, response } = req.body;

  if (!token || response === undefined) {
    res.status(400);
    throw new Error("Token and response are required");
  }

  try {
    const result = mathService.verifyAnswer(token, response);

    // Award Carrots if correct
    let updatedCarrots = null;
    if (result.correct) {
      const user = await User.addCarrots(
        req.user._id,
        GAMIFICATION.SUM_CORRECT,
      );
      if (!user) {
        console.error(
          `Failed to award carrots to user ${req.user._id}: User.addCarrots returned null`,
        );
        res.status(404);
        throw new Error("Could not award carrots: User not found");
      }
      updatedCarrots = user.carrots;
    }

    res.json({
      success: true,
      data: {
        ...result,
        carrots: updatedCarrots,
      },
    });
  } catch (error) {
    // If token is invalid or answer logic fails
    res.status(400); // Or 401? Let's say 400 for now.
    throw new Error(error.message, { cause: error });
  }
});

export default {
  getTopics,
  getQuestion,
  checkAnswer,
};
