/**
 * @file vocabulary.controller.js
 * @description Controller for managing vocabulary and SRS (Spaced Repetition System) logic.
 * @architecture Interfaces with Vocabulary and VocabProgress models to serve words and track spaced repetition learning.
 */
import mongoose from "mongoose";
import Vocabulary from "../models/Vocabulary.model.js";
import VocabProgress from "../models/VocabProgress.model.js";
import expressAsyncHandler from "express-async-handler";
import { GAMIFICATION } from "../config/gamification.js";
import User from "../models/user.model.js";
import Responses from "../models/Responses.model.js";
import { updateVocabEloRatings } from "../utils/elo.js";

/**
 * @desc    Get all vocabulary
 * @route   GET /api/vocabulary
 * @access  Admin
 */
const getAllVocabulary = expressAsyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20, difficulty } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const pipeline = [];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { word: { $regex: search, $options: "i" } },
          { definition: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // Add displayDifficulty (mirroring getDisplayDifficulty via sigmoid)
  pipeline.push({
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
  });

  // Add difficultyBand
  pipeline.push({
    $addFields: {
      difficultyBand: {
        $switch: {
          branches: [
            { case: { $lte: ["$displayDifficulty", 35] }, then: "Easy" },
            { case: { $lte: ["$displayDifficulty", 60] }, then: "Medium" },
            { case: { $lte: ["$displayDifficulty", 80] }, then: "Hard" },
          ],
          default: "Very Hard",
        },
      },
    },
  });

  // Apply Difficulty Filtering if provided
  if (difficulty) {
    const diffFilters = difficulty.split(",");
    pipeline.push({
      $match: {
        difficultyBand: { $in: diffFilters },
      },
    });
  }

  pipeline.push({
    $sort: { word: 1 },
  });

  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: limitNum }],
    },
  });

  const aggregateResult = await Vocabulary.aggregate(pipeline);
  const total = aggregateResult[0].metadata[0]?.total || 0;
  const paginatedVocab = aggregateResult[0].data;

  res.status(200).json({
    success: true,
    data: paginatedVocab,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  });
});

/**
 * @desc    Get vocabulary by ID
 * @route   GET /api/vocabulary/:id
 * @access  Admin
 */
const getVocabularyById = expressAsyncHandler(async (req, res) => {
  const vocab = await Vocabulary.findById(req.params.id);

  if (!vocab) {
    res.status(404);
    throw new Error("Vocabulary item not found");
  }

  res.status(200).json({
    success: true,
    data: vocab,
  });
});

/**
 * @desc    Create vocabulary item
 * @route   POST /api/vocabulary
 * @access  Admin
 */
const createVocabulary = expressAsyncHandler(async (req, res) => {
  const { word, definition } = req.body;

  if (!word || !definition) {
    res.status(400);
    throw new Error("Word and definition are required");
  }

  const vocab = await Vocabulary.create({
    word: word.trim(),
    definition: definition.trim(),
  });

  res.status(201).json({
    success: true,
    data: vocab,
  });
});

/**
 * @desc    Bulk create vocabulary
 * @route   POST /api/vocabulary/bulk
 * @access  Admin
 */
const bulkCreateVocabulary = expressAsyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    res.status(400);
    throw new Error("Text content is required");
  }

  // Split by newline and filter empty
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    res.status(400);
    throw new Error("No valid entries found");
  }

  // Parse each line: "word - definition"
  const entries = [];
  const errors = [];

  lines.forEach((line, index) => {
    const parts = line.split("-");

    if (parts.length < 2) {
      errors.push(`Line ${index + 1}: Missing separator '-'`);
      return;
    }

    const word = parts[0].trim();
    const definition = parts.slice(1).join("-").trim(); // In case definition contains '-'

    if (!word || !definition) {
      errors.push(`Line ${index + 1}: Empty word or definition`);
      return;
    }

    entries.push({ word, definition });
  });

  if (entries.length === 0) {
    res.status(400);
    throw new Error("No valid entries to add. " + errors.join(", "));
  }

  // Insert with ordered: false to continue on duplicates
  let inserted;
  try {
    inserted = await Vocabulary.insertMany(entries, { ordered: false });
  } catch (err) {
    // Handle duplicate key errors
    if (err.writeErrors) {
      const successCount = entries.length - err.writeErrors.length;
      res.status(200).json({
        success: true,
        count: successCount,
        message: `Added ${successCount} words. ${err.writeErrors.length} duplicates skipped.`,
        data: err.insertedDocs || [],
      });
      return;
    }
    throw err;
  }

  res.status(201).json({
    success: true,
    count: inserted.length,
    message: `Successfully added ${inserted.length} vocabulary items`,
    data: inserted,
  });
});

/**
 * @desc    Update vocabulary
 * @route   PUT /api/vocabulary/:id
 * @access  Admin
 */
const updateVocabulary = expressAsyncHandler(async (req, res) => {
  const vocab = await Vocabulary.findById(req.params.id);

  if (!vocab) {
    res.status(404);
    throw new Error("Vocabulary item not found");
  }

  const { word, definition } = req.body;

  if (!word || !definition) {
    res.status(400);
    throw new Error("Word and definition are required");
  }

  const updatedVocab = await Vocabulary.findByIdAndUpdate(
    req.params.id,
    {
      word: word.trim(),
      definition: definition.trim(),
    },
    { new: true },
  );

  res.status(200).json({
    success: true,
    data: updatedVocab,
  });
});

/**
 * @desc    Delete vocabulary
 * @route   DELETE /api/vocabulary/:id
 * @access  Admin
 */
const deleteVocabulary = expressAsyncHandler(async (req, res) => {
  const vocab = await Vocabulary.findById(req.params.id);

  if (!vocab) {
    res.status(404);
    throw new Error("Vocabulary item not found");
  }

  // Cascade delete associated VocabProgress records
  await VocabProgress.deleteMany({ word: vocab._id });

  await vocab.deleteOne();

  res.status(200).json({
    success: true,
    message: "Vocabulary item deleted",
  });
});

/**
 * @desc    Get vocabulary quiz words (SRS integration)
 * @route   GET /api/vocabulary/quiz
 * @access  Private
 */
const getVocabularyQuiz = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  console.log(`\n[SRS] Starting quiz fetch for user: ${userId}`);

  // 1. Fetch 1 Due Review Word
  let targetItem = null;
  const dueReview = await VocabProgress.findOne({
    user: userId,
    nextReviewDate: { $lte: new Date() },
  })
    .populate("word")
    .sort({ nextReviewDate: 1 }); // Oldest due first

  if (dueReview && dueReview.word) {
    targetItem = dueReview.word;
    console.log(
      `[SRS] Serving DUE review word: ${targetItem.word} (Box ${dueReview.box || 0})`,
    );
  } else {
    // 2. Fetch a New Word if no due reviews AND under daily limit

    // Calculate sliding 24-hr window
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count how many new words the user started learning within the last 24h
    const newWordsStartedToday = await VocabProgress.countDocuments({
      user: userId,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (newWordsStartedToday >= 20) {
      // Find the absolute closest next review date
      const nextUpcomingReview = await VocabProgress.findOne({
        user: userId,
        nextReviewDate: { $gt: new Date() },
      }).sort({ nextReviewDate: 1 });

      let nextAvailableTime;
      if (nextUpcomingReview) {
        nextAvailableTime = nextUpcomingReview.nextReviewDate;
      } else {
        // If no reviews are upcoming, the next available time is 24hrs from the oldest created record in the batch
        // Find the oldest record from the last 24hrs
        const oldestRecentRecord = await VocabProgress.findOne({
          user: userId,
          createdAt: { $gte: twentyFourHoursAgo },
        }).sort({ createdAt: 1 });

        if (oldestRecentRecord && oldestRecentRecord.createdAt) {
          nextAvailableTime = new Date(
            oldestRecentRecord.createdAt.getTime() + 24 * 60 * 60 * 1000,
          );
        } else {
          // Fallback if counting failed somehow
          nextAvailableTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        }
      }

      console.log(
        `[SRS] Daily limit reached. User has learned ${newWordsStartedToday} new words in last 24h. Next available: ${nextAvailableTime.toISOString()}`,
      );
      return res.status(403).json({
        success: false,
        message: "Daily limit reached",
        nextAvailableTime: nextAvailableTime,
      });
    }

    const allSeenProgress = await VocabProgress.find({ user: userId }).select(
      "word",
    );
    const seenWordIds = allSeenProgress.map((p) => p.word);

    const newWords = await Vocabulary.aggregate([
      { $match: { _id: { $nin: seenWordIds } } },
      { $sample: { size: 1 } },
    ]);

    if (newWords.length > 0) {
      targetItem = newWords[0];
      console.log(`[SRS] Serving NEW unused word: ${targetItem.word}`);
    } else {
      // Provide an empty state if no words are available to avoid logic breaking SRS loops

      const nextUpcomingReview = await VocabProgress.findOne({
        user: userId,
        nextReviewDate: { $gt: new Date() },
      }).sort({ nextReviewDate: 1 });

      console.log(`[SRS] No unused words left and none currently due.`);
      return res.status(403).json({
        success: false,
        message: "You've caught up! No words are currently due.",
        nextAvailableTime: nextUpcomingReview
          ? nextUpcomingReview.nextReviewDate
          : null,
      });
    }
  }

  if (!targetItem) {
    res.status(404);
    throw new Error("No vocabulary available in the database");
  }

  // Generate 3 distractors for the MCQ options
  const availableCount = await Vocabulary.countDocuments({
    _id: { $ne: targetItem._id },
  });
  if (availableCount < 3) {
    res.status(400);
    throw new Error("Not enough vocabulary words to generate distractors");
  }

  const distractors = await Vocabulary.aggregate([
    { $match: { _id: { $ne: targetItem._id } } },
    { $sample: { size: 3 } },
  ]);

  const options = [
    targetItem.definition,
    ...distractors.map((d) => d.definition),
  ].sort(() => 0.5 - Math.random());

  res.status(200).json({
    success: true,
    data: {
      text: "",
      instruction: `Select the definition for the word:\n"${targetItem.word}"`,
      vocabId: targetItem._id,
      options: options,
      type: "mcq",
      title: "Vocabulary Exercise",
    },
  });
});

/**
 * @desc    Verify vocabulary answer (SRS and ELO logic)
 * @route   POST /api/vocabulary/verify
 * @access  Private
 */
const verifyVocabularyResponse = expressAsyncHandler(async (req, res) => {
  const { userId, response, timeTaken, vocabId } = req.body;

  if (!userId || typeof timeTaken === "undefined" || !vocabId) {
    res.status(400);
    throw new Error("Missing required fields (userId, vocabId, timeTaken)");
  }

  console.log(
    `\n[SRS] Grading submitted answer for user: ${userId} | wordId: ${vocabId}`,
  );

  let accuracy = 0;
  let correctAnswers = [];
  let vocabItem = null;
  let isCorrect = false;

  // 2. ID Verification
  try {
    vocabItem = await Vocabulary.findById(vocabId);

    if (vocabItem) {
      // response is array of strings (options)
      const userSelection =
        Array.isArray(response) && response.length > 0
          ? String(response[0]).trim()
          : "";
      const dbDefinition = String(vocabItem.definition).trim();
      isCorrect = userSelection === dbDefinition;

      accuracy = isCorrect ? 100 : 0;
      correctAnswers = [vocabItem.definition];
    }
  } catch (e) {
    console.error("Failed to verify vocabulary", e);
  }

  if (!vocabItem) {
    res.status(404);
    throw new Error("Vocabulary item not found");
  }

  // 3. Spaced Repetition Logic (Leitner System)
  const intervals = [
    { value: 10, unit: "minutes" }, // Box 0
    { value: 1, unit: "days" }, // Box 1
    { value: 3, unit: "days" }, // Box 2
    { value: 7, unit: "days" }, // Box 3
    { value: 14, unit: "days" }, // Box 4
    { value: 30, unit: "days" }, // Box 5
    { value: 60, unit: "days" }, // Box 6
  ];

  // Find existing progress or create new
  let progressTracker = await VocabProgress.findOne({
    user: userId,
    word: vocabId,
  });

  if (!progressTracker) {
    progressTracker = new VocabProgress({
      user: userId,
      word: vocabId,
      box: 0,
    });
  }

  const oldBox = progressTracker.box;

  // Update box based on performance
  if (isCorrect) {
    // Increment box, capping at max intervals length
    progressTracker.box = Math.min(
      progressTracker.box + 1,
      intervals.length - 1,
    );
  } else {
    // Reset to box 0
    progressTracker.box = 0;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  const interval = intervals[progressTracker.box];
  if (interval.unit === "minutes") {
    nextReviewDate.setMinutes(nextReviewDate.getMinutes() + interval.value);
  } else if (interval.unit === "days") {
    nextReviewDate.setDate(nextReviewDate.getDate() + interval.value);
  }
  progressTracker.nextReviewDate = nextReviewDate;

  console.log(
    `[SRS] Answer was ${isCorrect ? "CORRECT" : "INCORRECT"} | Leitner Box moved: ${oldBox} -> ${progressTracker.box} | Next Review: ${nextReviewDate.toISOString().split("T")[0]}`,
  );

  // Wrap multi-document updates in a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  let carrotsAwarded = 0;
  let updatedCarrots = null;

  try {
    // Save SRS tracking
    await progressTracker.save({ session });

    // 5. Award Carrots
    if (isCorrect) {
      carrotsAwarded = GAMIFICATION.VOCABULARY_MARATHON_AWARD;
      const user = await User.adjustCarrots(userId, carrotsAwarded, session);
      if (user) updatedCarrots = user.carrots;
    }

    // 6. Save Overall Legacy Response Record
    await Responses.create(
      [
        {
          userId,
          isMarathon: true,
          marathonType: "vocabulary",
          accuracy,
          timeTaken,
        },
      ],
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // 4. Update ELO Ratings
  // Fire and forget (it handles its own errors so it won't crash the request)
  updateVocabEloRatings(userId, vocabId, isCorrect ? 1 : 0).catch((err) =>
    console.error("updateVocabEloRatings failed", err),
  );

  res.json({
    success: true,
    data: {
      accuracy,
      carrotsAwarded,
      carrots: updatedCarrots,
      message:
        carrotsAwarded > 0 ? `+${carrotsAwarded} Carrots!` : "Keep trying!",
      correctAnswers,
      srs: {
        box: progressTracker.box,
        nextReviewDate: progressTracker.nextReviewDate,
      },
    },
  });
});

/**
 * @desc    Get a single random vocabulary word that the user has learned (box >= 2) out of cooldown
 * @route   GET /api/vocabulary/random
 * @access  Private
 */
const getRandomVocabulary = expressAsyncHandler(async (req, res) => {
  // Cast to ObjectId — req.user is the raw JWT decoded payload (plain string IDs).
  // Mongoose .find() auto-casts, but aggregate $match uses the native driver and does NOT.
  // Without this cast, the aggregate returns 0 results for every user.
  const rawUserId = req.user._id || req.user.id;
  const userId = new mongoose.Types.ObjectId(rawUserId);

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  // Find a word that is box 2 or higher and meets spaced repetition rules for sentence evaluation
  const masteredProgress = await VocabProgress.aggregate([
    {
      $match: {
        user: userId,
        box: { $gte: 2 },
        $or: [
          { lastSentenceTestedAt: null },
          { lastSentenceTestedAt: { $exists: false } },
          {
            $and: [
              { box: 2 },
              { lastSentenceTestedAt: { $lte: threeDaysAgo } },
            ],
          },
          {
            $and: [
              { box: { $gte: 3 } },
              { lastSentenceTestedAt: { $lte: fiveDaysAgo } },
            ],
          },
        ],
      },
    },
    { $sample: { size: 1 } },
  ]);

  if (!masteredProgress || masteredProgress.length === 0) {
    return res.status(200).json({
      success: true,
      isEmptyState: true,
      message:
        "No words available for sentence practice. Words in Box 2+ must cool down for 3-5 days after use.",
    });
  }

  // Retrieve the full dictionary definition for the sampled word
  const vocabItem = await Vocabulary.findById(masteredProgress[0].word);

  if (!vocabItem) {
    res.status(404);
    throw new Error("Vocabulary reference not found.");
  }

  // Create a copy of the object and remove the definition for security/UI requirements
  const wordResponse = vocabItem.toObject();
  delete wordResponse.definition;

  res.status(200).json({ success: true, data: wordResponse });
});

export default {
  getAllVocabulary,
  getVocabularyById,
  createVocabulary,
  bulkCreateVocabulary,
  updateVocabulary,
  deleteVocabulary,
  verifyVocabularyResponse,
  getVocabularyQuiz,
  getRandomVocabulary,
};
