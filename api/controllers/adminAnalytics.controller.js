/**
 * @file adminAnalytics.controller.js
 * @description Provides statistical and analytical data for the admin dashboard.
 * @architecture Aggregates performance, engagement, and question difficulty metrics dynamically from collections.
 */
import User from "../models/user.model.js";
import Module from "../models/Module.model.js";
import Question from "../models/Questions.model.js";
import Responses from "../models/Responses.model.js";
import Vocabulary from "../models/Vocabulary.model.js";
import Passages from "../models/Passages.model.js";
import ContextAttachment from "../models/ContextAttachments.model.js";
import { calculateAccuracy } from "../utils/accuracy.js";

// ─── Shared helper ────────────────────────────────────────────────────────────
/**
 * Fetches all module-quiz responses that have a stored raw answer, then
 * batch-loads the current question documents so accuracy can be re-derived
 * dynamically via calculateAccuracy(question, storedResponse).
 *
 * Returns { responses, questionMap } both ready to iterate.
 */
const loadResponsesWithLiveQuestions = async (matchQuery = {}) => {
  const responses = await Responses.find({
    ...matchQuery,
    questionId: { $exists: true, $ne: null },
    response: { $exists: true, $ne: null },
  }).lean();

  if (responses.length === 0) return { responses, questionMap: new Map() };

  const questionIds = [
    ...new Set(responses.map((r) => r.questionId.toString())),
  ];
  const questions = await Question.find({ _id: { $in: questionIds } }).lean();
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  return { responses, questionMap };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get high-level global statistics for the admin dashboard.
 * Returns total counts for Users, Modules, and Questions.
 */
/**
 * @desc    Get high-level global statistics for the admin dashboard
 * @route   GET /api/admin/analytics/stats
 * @access  Private (Admin)
 */
export const getGlobalStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalModules,
      totalQuestions,
      totalResponses,
      totalVocabularies,
      totalSentences,
      totalPassages,
      totalContextAttachments,
    ] = await Promise.all([
      User.countDocuments(),
      Module.countDocuments(),
      Question.countDocuments(),
      Responses.countDocuments({ isMarathon: { $ne: true } }),
      Vocabulary.countDocuments(),
      Passages.countDocuments({ type: "sentence" }),
      Passages.countDocuments({ type: { $ne: "sentence" } }), // or { type: "passage" } but just in case
      ContextAttachment.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalModules,
        totalQuestions,
        totalResponses,
        totalVocabularies,
        totalSentences,
        totalPassages,
        totalContextAttachments,
      },
    });
  } catch (error) {
    console.error("Error fetching global admin stats:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * 1. Platform Engagement Trends
 * Returns daily response counts for the last 30 days.
 * No accuracy involved → no change needed.
 */
/**
 * @desc    Get daily response counts for the last 30 days
 * @route   GET /api/admin/analytics/trends
 * @access  Private (Admin)
 */
export const getEngagementTrends = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Responses.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    console.error("Error fetching engagement trends:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * 2. The "Misfit" Questions
 * Plots average accuracy against each question's ELO rating to surface
 * questions where difficulty and actual performance diverge.
 *
 * Accuracy is computed dynamically so teacher edits to the correct answer
 * are reflected immediately.
 */
/**
 * @desc    Identify questions where difficulty rating and actual performance diverge
 * @route   GET /api/admin/analytics/misfits
 * @access  Private (Admin)
 */
export const getMisfitQuestions = async (req, res) => {
  try {
    const { responses, questionMap } = await loadResponsesWithLiveQuestions();

    if (responses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Accumulate per-question: total dynamic accuracy + attempt count
    const accumulator = {}; // questionId → { totalAccuracy, count, rating }

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (!question) continue;

      const accuracy = calculateAccuracy(question, resp.response);
      const qId = question._id.toString();

      if (!accumulator[qId]) {
        accumulator[qId] = {
          totalAccuracy: 0,
          count: 0,
          rating: question.rating ?? null,
        };
      }
      accumulator[qId].totalAccuracy += accuracy;
      accumulator[qId].count += 1;
    }

    const misfits = Object.entries(accumulator).map(
      ([questionId, { totalAccuracy, count, rating }]) => ({
        questionId,
        averageAccuracy: Math.round(totalAccuracy / count),
        totalAttempts: count,
        rating,
      }),
    );

    res.status(200).json({ success: true, data: misfits });
  } catch (error) {
    console.error("Error fetching misfit questions:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * 3. Most Challenging Content Areas
 * Top 10 modules with the lowest average accuracy — useful for identifying
 * content that students consistently struggle with.
 *
 * Accuracy is computed dynamically per response.
 */
/**
 * @desc    Get top 10 modules with the lowest average accuracy
 * @route   GET /api/admin/analytics/challenging-modules
 * @access  Private (Admin)
 */
export const getChallengingModules = async (req, res) => {
  try {
    const { responses, questionMap } = await loadResponsesWithLiveQuestions({
      moduleId: { $exists: true, $ne: null },
    });

    if (responses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Batch-load modules for name/subject metadata
    const moduleIds = [...new Set(responses.map((r) => r.moduleId.toString()))];
    const modules = await Module.find({ _id: { $in: moduleIds } }).lean();
    const moduleMap = new Map(modules.map((m) => [m._id.toString(), m]));

    // Accumulate per-module
    const accumulator = {}; // moduleId → { totalAccuracy, count }

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (!question) continue;

      const accuracy = calculateAccuracy(question, resp.response);
      const mId = resp.moduleId.toString();

      if (!accumulator[mId]) {
        accumulator[mId] = { totalAccuracy: 0, count: 0 };
      }
      accumulator[mId].totalAccuracy += accuracy;
      accumulator[mId].count += 1;
    }

    const challenging = Object.entries(accumulator)
      .map(([moduleId, { totalAccuracy, count }]) => {
        const mod = moduleMap.get(moduleId);
        return {
          moduleId,
          averageAccuracy: Math.round(totalAccuracy / count),
          totalAttempts: count,
          moduleName: mod?.name ?? "Unknown",
          subject: mod?.subject ?? "Unknown",
        };
      })
      .sort((a, b) => a.averageAccuracy - b.averageAccuracy) // lowest first
      .slice(0, 10);

    res.status(200).json({ success: true, data: challenging });
  } catch (error) {
    console.error("Error fetching challenging modules:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * 4. Question Format Effectiveness
 * Average accuracy broken down by question answerType (MCQ, SA, fillInTheBlanks).
 *
 * Accuracy is computed dynamically per response.
 */
/**
 * @desc    Get average accuracy broken down by question answer format
 * @route   GET /api/admin/analytics/format-effectiveness
 * @access  Private (Admin)
 */
export const getFormatEffectiveness = async (req, res) => {
  try {
    const { responses, questionMap } = await loadResponsesWithLiveQuestions();

    if (responses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const accumulator = {}; // answerType → { totalAccuracy, count }

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (!question) continue;

      const accuracy = calculateAccuracy(question, resp.response);
      const type = question.answerType;

      if (!accumulator[type]) {
        accumulator[type] = { totalAccuracy: 0, count: 0 };
      }
      accumulator[type].totalAccuracy += accuracy;
      accumulator[type].count += 1;
    }

    const formatStats = Object.entries(accumulator).map(
      ([answerType, { totalAccuracy, count }]) => ({
        answerType,
        averageAccuracy: Math.round(totalAccuracy / count),
        totalAttempts: count,
      }),
    );

    res.status(200).json({ success: true, data: formatStats });
  } catch (error) {
    console.error("Error fetching format effectiveness:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * 5. Grade/Class Level Competency
 * Average accuracy grouped by User.grade and Module.subject.
 * Reveals how well each grade level performs across different subjects.
 *
 * Accuracy is computed dynamically per response.
 */
/**
 * @desc    Get average accuracy grouped by user grade and module subject
 * @route   GET /api/admin/analytics/grade-competency
 * @access  Private (Admin)
 */
export const getGradeCompetency = async (req, res) => {
  try {
    const { responses, questionMap } = await loadResponsesWithLiveQuestions({
      moduleId: { $exists: true, $ne: null },
    });

    if (responses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Batch-load users for grade and modules for subject
    const userIds = [...new Set(responses.map((r) => r.userId.toString()))];
    const moduleIds = [
      ...new Set(responses.map((r) => r.moduleId?.toString()).filter(Boolean)),
    ];

    const [users, modules] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      Module.find({ _id: { $in: moduleIds } }).lean(),
    ]);

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const moduleMap = new Map(modules.map((m) => [m._id.toString(), m]));

    // Accumulate by (grade, subject)
    const accumulator = {}; // "grade::subject" → { totalAccuracy, count, grade, subject }

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (!question) continue;

      const user = userMap.get(resp.userId.toString());
      const module = resp.moduleId
        ? moduleMap.get(resp.moduleId.toString())
        : null;
      if (!user?.grade || !module?.subject) continue;

      const accuracy = calculateAccuracy(question, resp.response);
      const key = `${user.grade}::${module.subject}`;

      if (!accumulator[key]) {
        accumulator[key] = {
          totalAccuracy: 0,
          count: 0,
          grade: user.grade,
          subject: module.subject,
        };
      }
      accumulator[key].totalAccuracy += accuracy;
      accumulator[key].count += 1;
    }

    const competencyStats = Object.values(accumulator)
      .map(({ totalAccuracy, count, grade, subject }) => ({
        grade,
        subject,
        averageAccuracy: Math.round(totalAccuracy / count),
        totalAttempts: count,
      }))
      .sort((a, b) => {
        if (a.grade < b.grade) return -1;
        if (a.grade > b.grade) return 1;
        return a.subject.localeCompare(b.subject);
      });

    res.status(200).json({ success: true, data: competencyStats });
  } catch (error) {
    console.error("Error fetching grade competency:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * 6. Speed vs. Comprehension (Cohort Level)
 * Clusters students based on their average time taken vs average accuracy
 * across all their attempts. Useful for identifying fast-but-careless vs
 * slow-and-thorough cohorts.
 *
 * Accuracy is computed dynamically per response, then averaged per user,
 * then bucketed by average time taken — preserving the original 2-stage logic.
 */
/**
 * @desc    Cluster students based on average time taken versus average accuracy
 * @route   GET /api/admin/analytics/speed-vs-comprehension
 * @access  Private (Admin)
 */
export const getSpeedVsComprehension = async (req, res) => {
  try {
    const { responses, questionMap } = await loadResponsesWithLiveQuestions({
      timeTaken: { $gt: 0, $lt: 600 }, // sanity bounds: exclude anomalous responses
    });

    if (responses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Stage 1: Compute per-user averages (mirrors original $group by userId)
    const userAccumulator = {}; // userId → { totalAccuracy, totalTimeTaken, count }

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (!question) continue;

      const accuracy = calculateAccuracy(question, resp.response);
      const uId = resp.userId.toString();

      if (!userAccumulator[uId]) {
        userAccumulator[uId] = {
          totalAccuracy: 0,
          totalTimeTaken: 0,
          count: 0,
        };
      }
      userAccumulator[uId].totalAccuracy += accuracy;
      userAccumulator[uId].totalTimeTaken += resp.timeTaken;
      userAccumulator[uId].count += 1;
    }

    // Stage 2: Bucket users by their average time taken (mirrors original $bucket)
    const TIME_BOUNDARIES = [0, 10, 20, 30, 45, 60, 90, 120, 180, 240, 300];
    const bucketAccumulator = {}; // label → { totalAccuracy, totalTime, userCount }
    const DEFAULT_BUCKET = "300+";

    const getBucketLabel = (avgTime) => {
      for (let i = 0; i < TIME_BOUNDARIES.length - 1; i++) {
        if (avgTime >= TIME_BOUNDARIES[i] && avgTime < TIME_BOUNDARIES[i + 1]) {
          return TIME_BOUNDARIES[i];
        }
      }
      return DEFAULT_BUCKET;
    };

    for (const { totalAccuracy, totalTimeTaken, count } of Object.values(
      userAccumulator,
    )) {
      const avgAccuracy = totalAccuracy / count;
      const avgTimeTaken = totalTimeTaken / count;
      const label = getBucketLabel(avgTimeTaken);

      if (!bucketAccumulator[label]) {
        bucketAccumulator[label] = {
          totalAccuracy: 0,
          totalTime: 0,
          userCount: 0,
        };
      }
      bucketAccumulator[label].totalAccuracy += avgAccuracy;
      bucketAccumulator[label].totalTime += avgTimeTaken;
      bucketAccumulator[label].userCount += 1;
    }

    const speedComprehension = Object.entries(bucketAccumulator)
      .map(([timeBucket, { totalAccuracy, totalTime, userCount }]) => ({
        timeBucket,
        userCount,
        averageAccuracy: Math.round(totalAccuracy / userCount),
        averageTimeTaken: Math.round(totalTime / userCount),
      }))
      .sort((a, b) => {
        // Numeric buckets first, then "300+" at end
        const aNum = Number(a.timeBucket);
        const bNum = Number(b.timeBucket);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        if (isNaN(aNum)) return 1;
        if (isNaN(bNum)) return -1;
        return 0;
      });

    res.status(200).json({ success: true, data: speedComprehension });
  } catch (error) {
    console.error("Error fetching speed vs comprehension:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * 7. Vocabulary Difficulty
 * Returns top 10 most difficult and top 10 easiest vocabulary words.
 */
/**
 * @desc    Get top 10 most difficult and easiest vocabulary words
 * @route   GET /api/admin/analytics/vocabulary-difficulty
 * @access  Private (Admin)
 */
export const getVocabularyDifficultyStats = async (req, res) => {
  try {
    const pipeline = [
      {
        $addFields: {
          displayDifficulty: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      1,
                      {
                        $add: [
                          1,
                          {
                            $exp: {
                              $multiply: [
                                -1,
                                {
                                  $divide: [
                                    {
                                      $subtract: [
                                        { $ifNull: ["$rating", 1200] },
                                        1200,
                                      ],
                                    },
                                    400,
                                  ],
                                },
                              ],
                            },
                          },
                        ],
                      },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $facet: {
          topDifficult: [
            { $sort: { displayDifficulty: -1, word: 1 } },
            { $limit: 10 },
            { $project: { word: 1, displayDifficulty: 1, _id: 1 } },
          ],
          topEasiest: [
            { $sort: { displayDifficulty: 1, word: 1 } },
            { $limit: 10 },
            { $project: { word: 1, displayDifficulty: 1, _id: 1 } },
          ],
        },
      },
    ];

    const result = await Vocabulary.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: {
        topDifficult: result[0]?.topDifficult || [],
        topEasiest: result[0]?.topEasiest || [],
      },
    });
  } catch (error) {
    console.error("Error fetching vocabulary difficulty stats:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
