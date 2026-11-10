/**
 * @file performance.controller.js
 * @description Controller for fetching user performance and statistics.
 * @architecture Analyzes user responses to compute progress and accuracy metrics.
 */
import expressAsyncHandler from "express-async-handler";
import Module from "../models/Module.model.js";
import Responses from "../models/Responses.model.js";
import User from "../models/user.model.js";
import { calculateAccuracy } from "../utils/accuracy.js";

/**
 * @desc    Get user performance overview (Progress & Accuracy)
 * @route   GET /api/user/performance
 * @access  Private
 */
export const getUserPerformance = expressAsyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user from DB to ensure we have the latest grade,
    // avoiding issues with stale tokens.
    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const userGrade = user.grade;

    if (!userGrade) {
      res.status(400);
      throw new Error("User grade is required for performance calculation");
    }

    // Initialize result structure
    const stats = {
      english: { progress: 0, accuracy: 0 },
      maths: { progress: 0, accuracy: 0 },
      hasData: false,
    };

    // Process each subject
    const subjects = ["english", "maths"];

    for (const subject of subjects) {
      // 1. Fetch Modules for this subject and grade
      const modules = await Module.find({
        subject: subject,
        grades: { $in: [userGrade] },
        isComplete: true, // Only consider published modules for performance tracking
      });

      if (modules.length === 0) {
        continue; // No modules, stats remain 0
      }

      // 2. Fetch User Responses for this subject (filter by moduleIds later or fetch all)
      const moduleIds = modules.map((m) => m._id);

      // We need to fetch responses for questions belonging to these modules.
      // Easiest is to fetch all responses for the user where moduleId is in our list
      const responses = await Responses.find({
        userId: userId,
        moduleId: { $in: moduleIds },
        isMarathon: { $ne: true }, // Exclude Marathon responses
      }).populate("questionId"); // Need question details for accuracy calc

      if (responses.length > 0) {
        stats.hasData = true;
      }

      // --- Calculate Progress (Average % completion of modules) ---
      let totalModuleCompletionPercentage = 0;

      for (const module of modules) {
        const totalQuestions = module.questionIds.length;

        if (totalQuestions === 0) {
          totalModuleCompletionPercentage += 100;
          continue;
        }

        // Count unique answered questions for this module
        const answeredQuestionIds = new Set();
        responses.forEach((r) => {
          if (r.moduleId && r.moduleId.toString() === module._id.toString()) {
            // Ensure questionId is populated
            if (r.questionId && r.questionId._id) {
              answeredQuestionIds.add(r.questionId._id.toString());
            }
          }
        });

        const completedQuestions = answeredQuestionIds.size;

        // Cap at 100% (in case logic drifts, though shouldn't)
        const moduleProgress = Math.min(
          100,
          (completedQuestions / totalQuestions) * 100,
        );
        totalModuleCompletionPercentage += moduleProgress;
      }

      const overallProgress =
        modules.length > 0
          ? totalModuleCompletionPercentage / modules.length
          : 0;

      stats[subject].progress = Math.round(overallProgress);

      // --- Calculate Accuracy (Average accuracy of all attempted questions) ---
      let totalAccuracy = 0;
      let attemptedCount = 0;

      for (const response of responses) {
        // calculateAccuracy expects (question, userResponse)
        // populate questionId in response query
        if (response.questionId) {
          const acc = calculateAccuracy(response.questionId, response.response);
          totalAccuracy += acc;
          attemptedCount++;
        }
      }

      const overallAccuracy =
        attemptedCount > 0 ? totalAccuracy / attemptedCount : 0;

      stats[subject].accuracy = Math.round(overallAccuracy);
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (res.statusCode && res.statusCode !== 200) {
      throw error;
    }
    res.status(500);
    throw new Error(error.message, { cause: error });
  }
});
