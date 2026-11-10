/**
 * @file quiz.controller.js
 * @description Controller for managing quiz questions.
 * @architecture Handles question creation, retrieval, updates, and deletion, including interactions with modules and files.
 */
import expressAsyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { GAMIFICATION } from "../config/gamification.js";
import {
  updateEloRatings,
  getDisplayDifficulty,
  updatePassageEloRatings,
} from "../utils/elo.js";

import { calculateAccuracy } from "../utils/accuracy.js";
import mathService from "../services/math.service.js";
import { decryptData } from "../utils/encryption.js";
import Question from "../models/Questions.model.js";
import ContextAttachment from "../models/ContextAttachments.model.js";
import Module from "../models/Module.model.js";
import Sequence from "../models/Sequence.model.js";
import mongoose from "mongoose";

import { setFileMetadata, deleteFiles } from "../utils/storage.js";
import User from "../models/user.model.js";
import Responses from "../models/Responses.model.js";
import quizService from "../services/quiz.service.js";
import backupController from "./backup.controller.js";

import { extractImages } from "../utils/slateHelpers.js";

/**
 * @desc    Triggers the backup service asynchronously
 * @returns {void}
 */
const triggerBackup = () => {
  // Fire and forget backup
  backupController
    .runBackupService()
    .then((id) => console.log(`Auto-backup successful: ${id}`))
    .catch((err) => console.error("Auto-backup failed:", err));
};

// Helper: removed extractGCSFilenames, use extractImages from utils

/**
 * @desc    Finalizes files uploaded for a question to set their metadata
 * @param   {Object} questionObj - The question document containing slate nodes
 * @returns {Promise<void>}
 */
// Helper to finalize files
const finalizeQuestionFiles = async (questionObj) => {
  const nodesToScan = [
    questionObj.question?.slate,
    questionObj.explanation?.slate,
    // Scan options
    questionObj.options?.mcq?.map((o) => o.slate),
  ].flat();

  const filenames = nodesToScan
    .flatMap((node) => (node ? extractImages(node) : []))
    .map((url) => {
      const match = url.match(
        /https:\/\/storage\.googleapis\.com\/[^/]+\/([^"'\s]+)/,
      );
      return match ? match[1] : null;
    })
    .filter(Boolean);

  if (filenames.length > 0) {
    const uniqueFilenames = [...new Set(filenames)];

    await Promise.all(
      uniqueFilenames.map((filename) =>
        setFileMetadata(filename, {
          finalizedAt: new Date().toISOString(),
          questionId: questionObj._id.toString(),
          moduleId: questionObj.modules[0], // approximate for context
        }).catch((err) =>
          console.error(`Failed to finalize ${filename}:`, err.message),
        ),
      ),
    );
  }
};

// Question Controllers

/**
 * @desc    Create a new question
 * @route   POST /api/questions
 * @access  Private (Admin)
 */
const createQuestion = expressAsyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const withTransaction = async (cb) => {
      return await session.withTransaction(() => cb({ session }), {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      });
    };

    const result = await quizService.createQuestion(req.body, {
      questionRepo: Question,
      moduleRepo: Module,
      withTransaction,
    });

    session.endSession();

    // Dispatch side-effects based on events returned by the pure module
    for (const event of result.events) {
      if (event.type === "FINALIZE_FILES") {
        finalizeQuestionFiles(event.payload).catch((err) =>
          console.error("File finalization failed:", err),
        );
      } else if (event.type === "TRIGGER_BACKUP") {
        triggerBackup();
      }
    }

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: result.data,
    });
  } catch (error) {
    session.endSession();
    console.error("Transaction failed:", error);
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});
/**
 * @desc    Get questions associated with a specific module ID
 * @route   POST /api/questions/module
 * @access  Private
 */
const getQuestionsByModuleId = expressAsyncHandler(async (req, res) => {
  try {
    const moduleId = req.body.module;
    if (!moduleId) throw new Error("Invalid module");

    // Get the module first to know the correct order
    const moduleDoc = await Module.findById(moduleId);
    if (!moduleDoc) throw new Error("Module not found");

    const questions = await Question.find({
      _id: { $in: moduleDoc.questionIds },
      active: true,
    })
      .select("question answerType rating tags skills createdAt modules")
      .populate("modules", "name subject");
    // Sort questions based on the order in moduleDoc.questionIds
    const orderedQuestions = [];
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // Add questions in order of questionIds
    if (moduleDoc.questionIds) {
      moduleDoc.questionIds.forEach((qId) => {
        const q = questionMap.get(qId.toString());
        if (q) orderedQuestions.push(q);
      });
    }

    // Add any questions that might be in DB but missing from questionIds (edge case fallback)
    questions.forEach((q) => {
      if (
        !moduleDoc.questionIds
          .map((id) => id.toString())
          .includes(q._id.toString())
      ) {
        orderedQuestions.push(q);
      }
    });

    const data = orderedQuestions.map((q) => {
      const qObj = q.toObject ? q.toObject() : q;
      qObj.displayDifficulty = getDisplayDifficulty(qObj.rating ?? 1200);
      return qObj;
    });

    res.json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message, { cause: error });
  }
});
/**
 * @desc    Get questions based on various filters and pagination
 * @route   GET /api/questions
 * @access  Private
 */
const getQuestions = expressAsyncHandler(async (req, res) => {
  try {
    const {
      subject,
      rating,
      grade,
      module,
      page = 1,
      limit = 10,
      search,
    } = req.query;
    const pipeline = [];

    // 1. Search Stage (must be first)
    if (search) {
      pipeline.push({
        $search: {
          index: "default",
          text: {
            query: search,
            path: { wildcard: "*" }, // Search all indexed fields
          },
        },
      });
    }

    // 2. Filter match
    const matchStage = { active: true };
    if (subject) matchStage.subject = subject;
    if (rating) matchStage.rating = Number(rating);
    if (grade) matchStage.grades = { $in: [parseInt(grade)] };
    // For module filtering, ensure ObjectId matching if stored as such
    if (module) matchStage.modules = new mongoose.Types.ObjectId(module);
    if (req.body.contextAttachmentId)
      matchStage.contextAttachmentId = new mongoose.Types.ObjectId(
        req.body.contextAttachmentId,
      );
    if (req.query.contextAttachmentId)
      matchStage.contextAttachmentId = new mongoose.Types.ObjectId(
        req.query.contextAttachmentId,
      );

    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags)
        ? req.query.tags
        : req.query.tags.split(",");
      if (tags.length > 0) {
        matchStage.tags = { $in: tags };
      }
    }

    if (req.query.skills) {
      const skills = Array.isArray(req.query.skills)
        ? req.query.skills
        : req.query.skills.split(",");
      if (skills.length > 0) {
        matchStage.skills = { $in: skills };
      }
    }

    if (req.query.difficulty) {
      const diffs = Array.isArray(req.query.difficulty)
        ? req.query.difficulty
        : req.query.difficulty.split(",");
      // Map difficulty labels to rating ranges (based on getDisplayDifficulty thresholds)
      // Easy: displayDifficulty ≤ 35  → rating ≤ 1140
      // Medium: 36–60                   → rating 1141–1390
      // Hard: 61–80                     → rating 1391–1590
      // Very Hard: > 80                 → rating > 1590
      const ratingConditions = [];
      if (diffs.includes("easy"))
        ratingConditions.push({ rating: { $lte: 1140 } });
      if (diffs.includes("medium"))
        ratingConditions.push({ rating: { $gt: 1140, $lte: 1390 } });
      if (diffs.includes("hard"))
        ratingConditions.push({ rating: { $gt: 1390, $lte: 1590 } });
      if (diffs.includes("veryhard"))
        ratingConditions.push({ rating: { $gt: 1590 } });
      if (ratingConditions.length > 0) {
        matchStage.$or = ratingConditions;
      }
    }

    pipeline.push({ $match: matchStage });

    // 3. Sort (if search used, usually sort by score, else by date)
    if (!search) {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // 4. Pagination (Facets for count and data)
    const skip = (page - 1) * limit;

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: Number(limit) },
          // Filter fields to populate
          {
            $lookup: {
              from: "modules",
              localField: "modules",
              foreignField: "_id",
              as: "modules",
            },
          },
          {
            $project: {
              "modules._id": 1,
              "modules.name": 1,
              "modules.subject": 1,
              question: 1,
              answerType: 1,
              rating: 1,
              active: 1,
              tags: 1,
              skills: 1,
              createdAt: 1,
            },
          },
        ],
      },
    });

    const result = await Question.aggregate(pipeline);
    const metadata = result[0].metadata[0] || { total: 0 };
    const questions = result[0].data;

    const total = metadata.total;

    const data = questions.map((q) => {
      q.displayDifficulty = getDisplayDifficulty(q.rating ?? 1200);
      return q;
    });

    res.json({
      success: true,
      count: data.length,
      data: data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Get all questions that are soft-deleted (in trash)
 * @route   GET /api/questions/trash
 * @access  Private (Admin)
 */
const getTrashQuestions = expressAsyncHandler(async (req, res) => {
  try {
    const questions = await Question.find({ active: false })
      .select("question modules tags skills rating answerType active updatedAt")
      .populate("modules", "name subject")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Get a single question by its ID
 * @route   POST /api/questions/id
 * @access  Private
 */
const getQuestionById = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.body;
    const question = await Question.findById(id)
      .populate("modules", "name subject")
      .populate("contextAttachmentId");

    if (!question) {
      res.status(404);
      throw new Error("Question not found");
    }

    const questionObj = question.toObject();
    questionObj.displayDifficulty = getDisplayDifficulty(
      questionObj.rating ?? 1200,
    );

    res.json({
      success: true,
      data: questionObj,
    });
  } catch (error) {
    res.status(404);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Get a specific question by ID formatted for a quiz session
 * @route   POST /api/questions/quiz-id
 * @access  Private
 */
const getQuestionByIdForQuiz = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.body;
    const question = await Question.findById(id)
      .populate("modules", "name subject")
      .populate("contextAttachmentId");

    if (!question) {
      res.status(404);
      throw new Error("Question not found");
    }

    // Check if user has completed this module
    // Check if user has completed this module
    const responses = await Responses.find({
      userId: req.user._id,
      moduleId:
        question.modules.length === 1
          ? question.modules[0]._id
          : req.body.moduleId, // Try to infer or require moduleId passed in body
    });

    const targetModuleId =
      req.body.moduleId ||
      (question.modules.length === 1 ? question.modules[0]._id : null);
    if (!targetModuleId) {
      // If not provided and ambiguous, maybe error? Or default to first?
      // Let's assume frontend passes moduleId for quiz context usually.
    }

    // Get unique question IDs answered
    const answeredQuestionIds = new Set(
      responses
        .map((r) => (r.questionId ? r.questionId.toString() : null))
        .filter(Boolean),
    );

    const moduleDoc = await Module.findById(targetModuleId);
    const isCompleted =
      moduleDoc &&
      moduleDoc.questionIds.length > 0 &&
      moduleDoc.questionIds.every((qId) =>
        answeredQuestionIds.has(qId.toString()),
      );

    // Sanitize
    const sanitizedQuestion = question.toObject();
    let userResponse = null;
    let timeTaken = 0;
    let isCorrect = null;

    if (!isCompleted) {
      if (sanitizedQuestion.answerType === "MCQ") {
        sanitizedQuestion.correctOption = undefined;
      } else if (sanitizedQuestion.answerType === "SA") {
        sanitizedQuestion.options.sa = undefined;
      } else if (sanitizedQuestion.answerType === "fillInTheBlanks") {
        sanitizedQuestion.options.fillInTheBlanks = undefined;
      }
      sanitizedQuestion.explanation = undefined;
    } else {
      // Fetch user's response for this question
      const response = await Responses.findOne({
        userId: req.user._id,
        questionId: question._id,
        moduleId: targetModuleId,
      });
      if (response) {
        userResponse = response.response;
        timeTaken = response.timeTaken;

        // Calculate isCorrect
        const accuracy = calculateAccuracy(sanitizedQuestion, userResponse);
        isCorrect =
          sanitizedQuestion.answerType === "fillInTheBlanks"
            ? accuracy
            : accuracy === 100;
      }
    }

    // Fetch next question ID for navigation
    // Navigation logic updated to use Module.questionIds
    let nextQuestionId = null;
    let currentQuestionOrder = null;

    if (moduleDoc && moduleDoc.questionIds) {
      const currentIdx = moduleDoc.questionIds.findIndex(
        (qid) => qid.toString() === question._id.toString(),
      );
      if (currentIdx !== -1) {
        currentQuestionOrder = currentIdx + 1;
        if (currentIdx < moduleDoc.questionIds.length - 1) {
          nextQuestionId = moduleDoc.questionIds[currentIdx + 1];
        }
      }
    }

    res.json({
      success: true,
      data: {
        ...sanitizedQuestion,
        displayDifficulty: getDisplayDifficulty(
          sanitizedQuestion.rating ?? 1200,
        ),
        userResponse,
        timeTaken,
        isCorrect,

        nextQuestionId: nextQuestionId,
        currentQuestionOrder: currentQuestionOrder,
      },
    });
  } catch (error) {
    res.status(404);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Update an existing question
 * @route   PUT /api/questions
 * @access  Private (Admin)
 */
const updateQuestion = expressAsyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.body;
    // We also need optionIndex from body if updating MCQ
    const { optionIndex } = req.body;

    // Find original question to verify existence
    const question = await Question.findById(id);

    if (!question) {
      res.status(404);
      throw new Error("Question not found");
    }

    await session.withTransaction(async () => {
      // 1. Handle Module relationship updates
      if (req.body.modules) {
        const oldModules = (question.modules || []).map((m) => m.toString());
        const newModules = req.body.modules.map((m) => m.toString());

        // Remove from modules that are no longer in the list
        const removedModules = oldModules.filter(
          (m) => !newModules.includes(m),
        );
        if (removedModules.length > 0) {
          await Module.updateMany(
            { _id: { $in: removedModules } },
            { $pull: { questionIds: question._id } },
            { session },
          );
        }

        // Add to new modules
        const addedModules = newModules.filter((m) => !oldModules.includes(m));
        if (addedModules.length > 0) {
          await Module.updateMany(
            { _id: { $in: addedModules } },
            { $addToSet: { questionIds: question._id } },
            { session },
          );
        }
      }

      // 2. Prepare Update Data
      let updateData = { ...req.body };

      // Handle MCQ correctOption logic if answerType is MCQ and options are being updated
      // We need to ensure correctOption points to the correct subdocument ID
      if (
        updateData.answerType === "MCQ" &&
        updateData.options &&
        updateData.options.mcq
      ) {
        // Assign new IDs to options ensuring we control them
        // (Or rely on existing ones if passed, but frontend usually sends clean slate for update)
        const mcqWithIds = updateData.options.mcq.map((opt) => ({
          ...opt,
          _id: opt._id || new mongoose.Types.ObjectId(),
        }));

        updateData.options.mcq = mcqWithIds;

        // If optionIndex is provided (0-3), find the ID of that index
        if (
          optionIndex !== undefined &&
          optionIndex !== null &&
          optionIndex >= 0 &&
          optionIndex < mcqWithIds.length
        ) {
          updateData.correctOption = mcqWithIds[optionIndex]._id;
        }
        // If optionIndex is NOT provided but we are updating MCQ options,
        // we have a risk of broken reference if we rely on old correctOption ID which might be gone.
        // Ideally frontend ALWAYS sends optionIndex for MCQ updates.
      } else if (updateData.answerType !== "MCQ") {
        // ensure correctOption is nullified if type changed
        updateData.correctOption = null;
      }

      await Question.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        session,
      });
    });
    session.endSession();

    // Fetch updated to return
    const updatedQuestion = await Question.findById(id).populate("modules");

    res.json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    });

    // Finalize any uploaded files in the updated question
    if (updatedQuestion && updatedQuestion.modules.length > 0) {
      finalizeQuestionFiles({
        ...updatedQuestion.toObject(),
        module: updatedQuestion.modules[0]._id,
      }).catch((err) => console.error("File finalization failed:", err));
    }
    triggerBackup();
  } catch (error) {
    session.endSession();
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Soft delete a question (move to trash)
 * @route   DELETE /api/questions
 * @access  Private (Admin)
 */
const deleteQuestion = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.body;
    const question = await Question.findById(id);

    if (!question) {
      res.status(404);
      throw new Error("Question not found");
    }

    // Soft delete by setting active to false
    await Question.findByIdAndUpdate(id, { active: false });

    res.json({
      success: true,
      message: "Question moved to trash",
    });
    triggerBackup();
  } catch (error) {
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Restore a soft-deleted question from the trash
 * @route   POST /api/questions/restore
 * @access  Private (Admin)
 */
const restoreQuestion = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.body;
    const question = await Question.findById(id);

    if (!question) {
      res.status(404);
      throw new Error("Question not found");
    }

    await Question.findByIdAndUpdate(id, { active: true });

    res.json({
      success: true,
      message: "Question restored successfully",
    });
    triggerBackup();
  } catch (error) {
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Permanently delete a question and its associated files
 * @route   DELETE /api/questions/permanent
 * @access  Private (Admin)
 */
const deleteQuestionPermanently = expressAsyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.body;
    const question = await Question.findById(id).session(session);

    if (!question) {
      await session.abortTransaction();
      session.endSession();
      res.status(404);
      throw new Error("Question not found");
    }

    // Extract GCS filenames
    const nodesToScan = [
      question.question?.slate,
      question.explanation?.slate,
      question.options?.mcq?.map((opt) => opt.slate),
    ].flat();

    const filenames = nodesToScan
      .flatMap((node) => (node ? extractImages(node) : []))
      .map((url) => {
        const match = url.match(
          /https:\/\/storage\.googleapis\.com\/[^/]+\/([^"'\s]+)/,
        );
        return match ? match[1] : null;
      })
      .filter(Boolean);

    // Delete files from GCS (Side Effect - cannot be rolled back easily, do last or accept risk)
    // We will do this AFTER transaction commits to be safe, or just accept if DB fails files are gone.
    // Better practice: Do it after commit. But for now, we keep it here but acknowledge standard limits.
    // Actually, let's just keep the order but wrap DB ops.

    // Remove question reference from all modules first
    await Module.updateMany(
      { questionIds: question._id },
      { $pull: { questionIds: question._id } },
    ).session(session);

    // Cascade delete associated Responses and ContextAttachments
    await Responses.deleteMany({ questionId: id }).session(session);
    await ContextAttachment.deleteMany({ questionId: id }).session(session);
    await Module.updateMany(
      { questionIds: id },
      { $pull: { questionIds: id } },
    ).session(session);

    // Then delete question from DB
    await Question.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    // Delete files from GCS after successful commit
    if (filenames.length > 0) {
      // We don't await this to avoid blocking response, or we can.
      deleteFiles(filenames).catch((err) =>
        console.error("Failed to delete GCS files:", err),
      );
    }

    res.json({
      success: true,
      message: "Question deleted permanently",
    });
    triggerBackup();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Permanently delete all questions in the trash
 * @route   DELETE /api/questions/empty-trash
 * @access  Private (Admin)
 */
const emptyTrash = expressAsyncHandler(async (req, res) => {
  try {
    const questions = await Question.find({ active: false });

    if (questions.length === 0) {
      return res.json({
        success: true,
        message: "Trash is already empty",
      });
    }

    // Collect all filenames
    let allFilenames = [];
    questions.forEach((q) => {
      const nodesToScan = [
        q.question?.slate,
        q.explanation?.slate,
        q.options?.mcq?.map((opt) => opt.slate),
      ].flat();

      const urls = nodesToScan
        .flatMap((node) => (node ? extractImages(node) : []))
        .map((url) => {
          const match = url.match(
            /https:\/\/storage\.googleapis\.com\/[^/]+\/([^"'\s]+)/,
          );
          return match ? match[1] : null;
        })
        .filter(Boolean);
      allFilenames = [...allFilenames, ...urls];
    });

    // Delete files from GCS
    if (allFilenames.length > 0) {
      await deleteFiles([...new Set(allFilenames)]);
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Remove references from modules first
      const questionIds = questions.map((q) => q._id);
      await Module.updateMany(
        {},
        { $pull: { questionIds: { $in: questionIds } } },
      ).session(session);

      // Then delete questions from DB
      await Question.deleteMany({ active: false }).session(session);

      await session.commitTransaction();
      session.endSession();
    } catch (txnError) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw txnError;
    }

    res.json({
      success: true,
      message: "Trash emptied successfully",
    });
    triggerBackup();
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message, { cause: error });
  }
});

const getSkills = expressAsyncHandler(async (req, res) => {
  try {
    const skills = await Question.distinct("skills");
    res.json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message, { cause: error });
  }
});

// Module Controllers

const createModule = expressAsyncHandler(async (req, res) => {
  const { name, subject, questionIds, grades } = req.body || {};

  if (!name || !subject) {
    res.status(400);
    throw new Error("Please provide name and subject");
  }

  try {
    const newModule = await Module.create({
      name,
      subject,
      questionIds: questionIds || [],
      grades: grades
        ? [...new Set(grades)].filter((g) => g >= 1 && g <= 12)
        : [], // Validate grades
      isComplete: req.body.isComplete || false,
    });

    res.status(201).json({
      success: true,
      message: "Module created successfully",
      data: newModule,
    });
    triggerBackup();
  } catch (error) {
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

const getModules = expressAsyncHandler(async (req, res) => {
  try {
    const {
      subject,
      page = 1,
      limit = 10,
      search,
      grades,
      isComplete,
    } = req.body || {};
    const query = {};

    if (subject) query.subject = subject;

    // Search by name (and optionally by _id if the string is a valid ObjectId)
    if (search) {
      const orConditions = [{ name: { $regex: search, $options: "i" } }];
      // Only include _id match when the search string is a valid 24-hex ObjectId
      if (mongoose.Types.ObjectId.isValid(search) && search.length === 24) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(search) });
      }
      query.$or = orConditions;
    }

    // Filter by grades
    if (grades && grades.length > 0) {
      // Assuming module.grades is an array of numbers/strings
      // We want to find modules that satisfy ANY of the selected grades
      // If module has [1, 2] and we select [1], it should match.
      query.grades = { $in: grades.map(Number) };
    }

    // Filter by completion status
    if (isComplete !== undefined && isComplete !== "all") {
      if (isComplete === "completed") {
        query.isComplete = true;
      } else if (isComplete === "incomplete") {
        query.isComplete = false;
      }
    }

    const skip = (page - 1) * limit;

    let modulesRaw = await Module.find(query).populate("questionIds", "active");

    let modules = modulesRaw;

    // Fetch sequences for sorting if subject and grades are provided
    if (grades && grades.length > 0 && subject) {
      const sequences = await Sequence.find({
        subject,
        grade: { $in: grades.map(Number) },
      });

      // Combine sequences in the order of grades (or just collect all ordered module IDs)
      let orderedModuleIds = [];
      sequences.forEach((seq) => {
        orderedModuleIds = orderedModuleIds.concat(
          seq.modules.map((id) => id.toString()),
        );
      });

      // Sort modules based on their index in orderedModuleIds
      // Modules not in the sequence go to the end
      modules = modules.sort((a, b) => {
        const idxA = orderedModuleIds.indexOf(a._id.toString());
        const idxB = orderedModuleIds.indexOf(b._id.toString());

        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    } else {
      // Fallback sort if sequence context isn't fully narrowed down (e.g. searching all modules)
      modules = modules.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
    }

    const total = modules.length;

    // Apply pagination after sorting
    modules = modules.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      count: modules.length,
      data: modules,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message, { cause: error });
  }
});

const getModuleById = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.body;
    const module = await Module.findById(id).populate("questionIds");

    if (!module) {
      res.status(404);
      throw new Error("Module not found");
    }

    res.json({
      success: true,
      data: module,
    });
  } catch (error) {
    res.status(404);
    throw new Error(error.message, { cause: error });
  }
});

const updateModule = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.body;
    const module = await Module.findById(id);

    if (!module) {
      res.status(404);
      throw new Error("Module not found");
    }

    const updatedModule = await Module.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Module updated successfully",
      data: updatedModule,
    });
    triggerBackup();
  } catch (error) {
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

const deleteModule = expressAsyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.body;
    const module = await Module.findById(id).session(session);

    if (!module) {
      res.status(404);
      throw new Error("Module not found");
    }

    await Sequence.updateMany(
      { modules: id },
      { $pull: { modules: id } },
    ).session(session);
    await Question.updateMany(
      { modules: id },
      { $pull: { modules: id } },
    ).session(session);
    await Responses.deleteMany({ moduleId: id }).session(session);
    await Module.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Module deleted successfully",
    });
    triggerBackup();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

const deleteModuleAndQuestions = expressAsyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.body;
    const module = await Module.findById(id).session(session);

    if (!module) {
      res.status(404);
      throw new Error("Module not found");
    }

    // Soft-delete all questions associated with this module
    await Question.updateMany(
      { modules: id, active: true },
      { active: false },
    ).session(session);

    // Remove module references from sequences
    await Sequence.updateMany(
      { modules: id },
      { $pull: { modules: id } },
    ).session(session);

    // Cascade delete responses for this module
    await Responses.deleteMany({ moduleId: id }).session(session);

    // Delete the module
    await Module.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Module and associated questions deleted successfully",
    });
    triggerBackup();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

// Module Question Management

const addQuestionToModule = expressAsyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { moduleIds, questionId, moduleId } = req.body;

    if (!questionId) {
      throw new Error("Question ID is required");
    }

    // Handle backwards compatibility for single moduleId, or new moduleIds array
    const normalizedModuleIds = Array.isArray(moduleIds)
      ? moduleIds
      : moduleId
        ? [moduleId]
        : [];

    // Guard: prevent accidentally clearing all modules when no IDs are provided.
    // If intentionally removing all modules, use the updateQuestion endpoint instead.
    if (normalizedModuleIds.length === 0) {
      res.status(400);
      throw new Error("At least one moduleId is required");
    }

    const question = await Question.findById(questionId).session(session);
    if (!question) {
      res.status(404);
      throw new Error("Question not found");
    }

    const oldModules = (question.modules || []).map((m) => m.toString());
    const newModules = normalizedModuleIds.map((m) => m.toString());

    // Remove from modules that are no longer in the list
    const removedModules = oldModules.filter((m) => !newModules.includes(m));
    if (removedModules.length > 0) {
      await Module.updateMany(
        { _id: { $in: removedModules } },
        { $pull: { questionIds: question._id } },
        { session },
      );
    }

    // Add to new modules
    const addedModules = newModules.filter((m) => !oldModules.includes(m));
    if (addedModules.length > 0) {
      await Module.updateMany(
        { _id: { $in: addedModules } },
        { $addToSet: { questionIds: question._id } },
        { session },
      );
    }

    // Update question's module array
    question.modules = newModules;
    await question.save({ session, validateModifiedOnly: true });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Question modules synced successfully",
    });
    triggerBackup();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

const removeQuestionFromModule = expressAsyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { moduleId, questionId } = req.body;

    const module = await Module.findById(moduleId).session(session);
    if (!module) {
      res.status(404);
      throw new Error("Module not found");
    }

    // Remove question ID from module
    module.questionIds = module.questionIds.filter(
      (qid) => qid.toString() !== questionId,
    );
    await module.save({ session });

    // Remove module ID from question
    await Question.findByIdAndUpdate(questionId, {
      $pull: { modules: moduleId },
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Question removed from module successfully",
      data: module,
    });
    triggerBackup();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

// Student Quiz Flow

const startModule = expressAsyncHandler(async (req, res) => {
  const { moduleId } = req.body;
  const userId = req.user._id;

  if (!moduleId) {
    res.status(400);
    throw new Error("Module ID is required");
  }

  try {
    const {
      progress,
      question,
      totalQuestions,
      userResponse,
      timeTaken,
      isCorrect,
      nextQuestionId,
    } = await quizService.startModule(userId, moduleId);
    res.json({
      success: true,
      data: {
        question,
        progress,
        totalQuestions,
        currentQuestionOrder: progress.currentQuestionOrder,
        userResponse,
        timeTaken,
        isCorrect,
        nextQuestionId,
      },
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

const submitAnswer = expressAsyncHandler(async (req, res) => {
  const { questionId, answer, timeTaken, moduleId } = req.body;
  const userId = req.user._id;

  if (
    !questionId ||
    answer === undefined ||
    timeTaken === undefined ||
    !moduleId
  ) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  try {
    const result = await quizService.submitAnswer(
      userId,
      moduleId,
      questionId,
      answer,
      timeTaken,
    );

    // Award Carrots
    // Proportional awarding: scale by accuracy so partial fill-in-the-blank answers
    // earn fractional rewards (e.g. 50% accuracy → 3 of 5 carrots). For MCQ/SA,
    // result.accuracy is always 0 or 100, so this is equivalent to binary awarding.
    let carrotsAwarded = 0;
    if (result.accuracy > 0) {
      carrotsAwarded += Math.round(
        (result.accuracy / 100) * GAMIFICATION.STD_QUESTION_AWARD,
      );
    }

    // Award Carrots for Module Completion
    if (result.isModuleComplete) {
      carrotsAwarded += GAMIFICATION.MODULE_COMPLETION_AWARD;
    }

    let updatedCarrots = null;
    if (carrotsAwarded > 0) {
      const user = await User.adjustCarrots(userId, carrotsAwarded);
      if (user) updatedCarrots = user.carrots;
    }

    res.json({
      success: true,
      data: {
        ...result,
        carrotsAwarded,
        carrots: updatedCarrots, // Return latest totals
      },
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

const getModulesWithProgress = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;
  console.log(`[DEBUG] getModulesWithProgress called for user: ${req.user}`);

  try {
    if (!req.user.grade) {
      res.status(403);
      throw new Error("Profile incomplete: Grade is required");
    }

    // 0. Ensure carrot history is padded up to today and get latest user data
    const user = await User.adjustCarrots(userId, 0);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // 1. Fetch all necessary data in parallel for performance
    //    - Modules for the user's grade
    //    - User's quiz responses (to calculate accuracy)
    const modulesRaw = await Module.find({
      grades: req.user.grade,
      questionIds: { $not: { $size: 0 } },
    });

    // Fetch sequences for this user's grade to determine order
    const sequences = await Sequence.find({ grade: req.user.grade });

    const responses = await Responses.find({ userId });

    console.log(
      `[DEBUG] Fetched ${modulesRaw.length} modules, ${responses.length} responses`,
    );

    // 2. Group modules by subject to handle sequential locking per subject
    const allQuestionIds = modulesRaw.flatMap((m) => m.questionIds);
    // Filter only active questions
    const allQuestions = await Question.find({
      _id: { $in: allQuestionIds },
      active: true,
    });

    // Create a Set of active question IDs for quick lookup
    const activeQuestionIdsSet = new Set(
      allQuestions.map((q) => q._id.toString()),
    );

    // Filter module questionIds to only include active ones
    modulesRaw.forEach((module) => {
      module.questionIds = module.questionIds.filter((qId) =>
        activeQuestionIdsSet.has(qId.toString()),
      );
    });

    // Sort modules based on sequence before grouping by subject
    const modules = modulesRaw.sort((a, b) => {
      const seqA = sequences.find((s) => s.subject === a.subject);
      const seqB = sequences.find((s) => s.subject === b.subject);

      // We handle subjects independently later, but for sorting within a subject:
      if (a.subject === b.subject) {
        const seq = seqA || seqB;
        if (seq && seq.modules) {
          const idxA = seq.modules.findIndex(
            (m) => m.toString() === a._id.toString(),
          );
          const idxB = seq.modules.findIndex(
            (m) => m.toString() === b._id.toString(),
          );

          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      return a.subject.localeCompare(b.subject);
    });

    const modulesBySubject = modules.reduce((acc, module) => {
      if (!acc[module.subject]) acc[module.subject] = [];
      acc[module.subject].push(module);
      return acc;
    }, {});

    console.log(
      `[DEBUG] Modules grouped by subject:`,
      Object.keys(modulesBySubject),
    );

    let result = [];

    // 3. Process each subject independently
    for (const subject in modulesBySubject) {
      const subjectModules = modulesBySubject[subject];

      // 4. Find the "Active Index": The first module that is NOT completed.
      //    All modules before this index are completed.
      //    This module is the one the user should be working on.
      //    All modules after this index are locked.
      let activeIndex = -1;
      for (let i = 0; i < subjectModules.length; i++) {
        const module = subjectModules[i];

        // If module has no active questions, it should not be the "active" focus
        // nor should it block the sequence. Skip it for activeIndex focus.
        if (!module.questionIds || module.questionIds.length === 0) continue;

        const moduleResponses = responses.filter(
          (r) => r.moduleId && r.moduleId.toString() === module._id.toString(),
        );
        const answeredQuestionIds = new Set(
          moduleResponses
            .map((r) => (r.questionId ? r.questionId.toString() : null))
            .filter(Boolean),
        );
        const isCompleted = module.questionIds.every((qId) =>
          answeredQuestionIds.has(qId.toString()),
        );

        if (!isCompleted) {
          activeIndex = i;
          break;
        }
      }

      console.log(`[DEBUG] Subject: ${subject}, Active Index: ${activeIndex}`);

      // 5. Map through modules to attach status and accuracy
      const subjectResult = subjectModules.map((module, index) => {
        // A. Calculate Accuracy: (Correct Answers / Total Responses for this module) * 100
        const moduleResponses = responses.filter(
          (r) => r.moduleId && r.moduleId.toString() === module._id.toString(),
        );
        let accuracy = 0;
        let correctQuestionsCount = 0;
        // Sum of proportional carrots earned per question (mirrors submitAnswer awarding logic)
        let totalCarrotsForQuestions = 0;

        if (moduleResponses.length > 0) {
          const correctCount = moduleResponses
            .map((r) => {
              const question = allQuestions.find(
                (q) => q._id.toString() === r.questionId.toString(),
              );
              if (!question) return 0;

              const qAccuracy = calculateAccuracy(question, r.response);
              if (qAccuracy === 100) correctQuestionsCount++; // Count fully correct answers

              // Accumulate proportional carrots: matches the awarding formula in submitAnswer
              totalCarrotsForQuestions += Math.round(
                (qAccuracy / 100) * GAMIFICATION.STD_QUESTION_AWARD,
              );

              return qAccuracy / 100;
            })
            .reduce((a, b) => a + b, 0);

          accuracy = Math.round((correctCount / moduleResponses.length) * 100);
        }

        // Progress Calculation
        const totalQuestions = module.questionIds.length;

        // Calculate status
        const answeredQuestionIds = new Set(
          moduleResponses.map((r) => r.questionId.toString()),
        );
        const isCompleted = module.questionIds.every((qId) =>
          answeredQuestionIds.has(qId.toString()),
        );

        const isInProgress = moduleResponses.length > 0 && !isCompleted;

        let currentQuestionOrder;
        let progressPercent;

        if (isCompleted) {
          progressPercent = 100;
          currentQuestionOrder = totalQuestions;
        } else {
          // Find max index based on questionIds
          const answeredQIds = new Set(
            moduleResponses
              .map((r) => (r.questionId ? r.questionId.toString() : null))
              .filter(Boolean),
          );
          let maxIndex = -1;

          module.questionIds.forEach((qId, idx) => {
            if (answeredQIds.has(qId.toString())) {
              if (idx > maxIndex) maxIndex = idx;
            }
          });

          currentQuestionOrder = maxIndex + 1 + 1; // +1 for 0-based index, +1 for next question
          if (currentQuestionOrder > totalQuestions)
            currentQuestionOrder = totalQuestions;

          progressPercent =
            totalQuestions > 0
              ? Math.round(((currentQuestionOrder - 1) / totalQuestions) * 100)
              : 0;
        }

        let status;
        let unlocked;

        // B. Determine Status based on progress and active index
        if (isCompleted) {
          // Case 1: Module is already finished
          status = "completed";
          unlocked = true;
        } else if (activeIndex !== -1 && index === activeIndex) {
          // Case 2: This is the current active module (next in sequence)
          unlocked = true;
          status = isInProgress ? "in_progress" : "not_started";
        } else {
          // Case 3: Future module, stay locked
          status = "locked";
          unlocked = false;
        }

        // Frontend compatibility fix
        if (status === "locked" && unlocked) status = "not_started";

        console.log(
          `[DEBUG] Module: ${module.name} (${module._id}), Index: ${index}, Status: ${status}, Unlocked: ${unlocked}, Accuracy: ${accuracy}%, Progress: ${progressPercent}%`,
        );

        return {
          ...module.toObject(),
          status,
          unlocked,
          accuracy,
          progressPercent,
          currentQuestionOrder,
          totalQuestions,
          correctQuestionsCount,
          totalCarrotsForQuestions,
        };
      });

      result = [...result, ...subjectResult];
    }

    res.json({
      success: true,
      data: result,
      carrots: user.carrots,
      gamification: GAMIFICATION, // Send config to frontend
    });
  } catch (error) {
    console.error(`[DEBUG] Error in getModulesWithProgress:`, error);
    res.status(500);
    throw new Error(error.message, { cause: error });
  }
});

const getUserHistory = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Fetch all responses for the user
    const responses = await Responses.find({ userId })
      .populate("questionId")
      .populate("moduleId", "name subject")
      .sort({ createdAt: -1 });

    // 3. Group responses by module
    const historyByModule = {};

    // Helper to get module questionIds map
    const moduleMap = {};
    const moduleIds = [
      ...new Set(
        responses.map((r) => r.moduleId?._id?.toString()).filter(Boolean),
      ),
    ];
    const moduleDocs = await Module.find({ _id: { $in: moduleIds } }).select(
      "questionIds",
    );
    moduleDocs.forEach((m) => {
      moduleMap[m._id.toString()] = m.questionIds.map((q) => q.toString());
    });

    responses.forEach((r) => {
      // Handle deleted modules
      if (!r.moduleId || !r.moduleId._id) return;

      const modId = r.moduleId._id.toString();
      if (!historyByModule[modId]) {
        historyByModule[modId] = {
          moduleId: modId,
          moduleName: r.moduleId.name,
          subject: r.moduleId.subject,
          status: "in_progress",
          questions: [],
        };
      }

      // Determine correct answer for display
      let correctAnswerDisplay;
      const q = r.questionId;

      // Handle deleted questions
      if (!q) {
        historyByModule[modId].questions.push({
          questionId: null,
          questionHtml: "<p><em>Question deleted</em></p>",
          answerType: "unknown",
          options: {},
          userResponse: r.response,
          isCorrect: r.accuracy,
          correctAnswer: "Unknown",
          timeTaken: r.timeTaken,
          attemptedAt: r.createdAt,
          order: 9999, // Push to end
          responseId: r._id,
        });
        return;
      }

      if (q.answerType === "MCQ") {
        // const correctOpt = q.options.mcq.find(
        //   (o) =>
        //     o._id &&
        //     q.correctOption &&
        //     o._id.toString() === q.correctOption.toString(),
        // );
        // Find index
        const idx = q.options.mcq.findIndex(
          (o) =>
            o._id &&
            q.correctOption &&
            o._id.toString() === q.correctOption.toString(),
        );
        const labels = ["A", "B", "C", "D"];
        correctAnswerDisplay = labels[idx] || "Unknown";
      } else {
        correctAnswerDisplay = q.options.sa;
      }

      const accuracy = calculateAccuracy(q, r.response);
      let isCorrect;

      if (q.answerType === "fillInTheBlanks") {
        isCorrect = accuracy;
      } else {
        isCorrect = accuracy === 100;
      }

      // Determine order based on index in module
      let order = 0;
      const qIds = moduleMap[modId];
      if (qIds) {
        const idx = qIds.indexOf(q._id.toString());
        if (idx !== -1) order = idx + 1;
        else order = 999; // Not found in module currently
      }

      historyByModule[modId].questions.push({
        questionId: q._id,
        questionSlate: q.question.slate,
        answerType: q.answerType,
        options: q.options,
        userResponse: r.response,
        isCorrect: isCorrect,
        correctAnswer: correctAnswerDisplay,
        timeTaken: r.timeTaken,
        attemptedAt: r.createdAt,
        order: order,
        responseId: r._id,
      });
    });

    // Sort questions by calculated order for each module
    Object.values(historyByModule).forEach((module) => {
      module.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    res.status(200).json({
      success: true,
      data: Object.values(historyByModule),
    });
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Delete a user response (Admin)
 * @route   DELETE /api/quiz/admin/responses/:responseId
 * @access  Private (Admin)
 */
const deleteResponse = expressAsyncHandler(async (req, res) => {
  const { responseId } = req.params;

  try {
    const response = await Responses.findById(responseId);
    if (!response) {
      res.status(404);
      throw new Error("Response not found");
    }

    await Responses.findByIdAndDelete(responseId);

    res.status(200).json({
      success: true,
      message: "Response deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting response:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Skip/Advance to next question
 * @route   POST /api/quiz/modules/next
 * @access  Private
 */
const nextQuestion = expressAsyncHandler(async (req, res) => {
  const { moduleId, currentQuestionId } = req.body;
  const userId = req.user._id;

  if (!moduleId) {
    return res
      .status(400)
      .json({ success: false, message: "Module ID is required" });
  }

  try {
    const result = await quizService.nextQuestion(
      userId,
      moduleId,
      currentQuestionId,
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error advancing to next question:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
const saveMarathonResponse = expressAsyncHandler(async (req, res) => {
  const { userId, token, response, timeTaken, type } = req.body;

  if (!userId || !token || typeof timeTaken === "undefined") {
    res.status(400);
    throw new Error("Missing required fields (userId, token, timeTaken)");
  }

  // 1. Verify Token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(
      "[saveMarathonResponse] Decoded Token:",
      JSON.stringify(decoded, null, 2),
    );
  } catch (err) {
    res.status(401);
    throw new Error("Invalid or expired verification token", { cause: err });
  }

  let accuracy = 0;
  let correctAnswers = [];
  let explanation = decoded.explanation || null;

  // 2. Validate Accuracy (Server-Side)
  if (decoded.type === "math") {
    const evaluation = mathService.verifyAnswer(token, response);
    accuracy = evaluation.accuracy;
    correctAnswers = [evaluation.correctAnswer];
    explanation = evaluation.explanation;
  } else if (
    Array.isArray(decoded.answerHashes) &&
    decoded.answerHashes.length > 0
  ) {
    // Both Passage and Grammar now use `answerHashes` in token for uniformity.
    const correctHashes = decoded.answerHashes;
    if (decoded.type === "passage") {
      // Ordered check for Fill-in-blanks
      if (Array.isArray(response)) {
        let correctCount = 0;
        response.forEach((ans, idx) => {
          if (idx < correctHashes.length) {
            const userHash = crypto
              .createHash("sha256")
              .update(
                String(ans)
                  .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
                  .trim()
                  .toLowerCase(),
              )
              .digest("hex");
            if (userHash === correctHashes[idx]) {
              correctCount++;
            }
          }
        });
        accuracy = Math.round((correctCount / correctHashes.length) * 100);
      }
    } else {
      // Unordered check for Grammar (Select all...)
      // or Ordered?
      // Grammar questions like "Select all nouns" return a SET of answers.
      // User sends an array.
      // We check set intersection.

      const userAnswers = Array.isArray(response) ? response : [response];
      const userHashes = new Set(
        userAnswers.map((ans) =>
          crypto
            .createHash("sha256")
            .update(
              String(ans)
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
                .trim()
                .toLowerCase(),
            )
            .digest("hex"),
        ),
      );
      const correctSet = new Set(correctHashes);

      const intersection = new Set(
        [...userHashes].filter((x) => correctSet.has(x)),
      );
      const wrongSelections = new Set(
        [...userHashes].filter((x) => !correctSet.has(x)),
      );

      // Strict: Must get ALL correct and NO wrong.
      if (wrongSelections.size === 0 && intersection.size === correctSet.size) {
        accuracy = 100;
      }
    }

    // Decrypt Correct Answers to return to user (for Passage/Grammar)
    if (decoded.encryptedAnswers) {
      try {
        correctAnswers = decryptData(decoded.encryptedAnswers);
      } catch (e) {
        console.error("Failed to decrypt answers", e);
      }
    }
  } else if (
    type === "history" ||
    type === "vocabulary" ||
    decoded.type === "history" ||
    decoded.type === "vocabulary"
  ) {
    // Valid marathon type without answer hashes
  } else {
    res.status(400);
    throw new Error(
      "Invalid question token: missing answer hashes and not math/history/vocabulary",
    );
  }

  // 3. Award Carrots (Common for Math/Grammar/Passage)
  let carrotsAwarded = 0;
  let updatedCarrots = null;
  if (accuracy === 100) {
    const marathonType = type || decoded.type;
    if (marathonType === "grammar" || marathonType === "passage") {
      carrotsAwarded = GAMIFICATION.GRAMMAR_MARATHON_AWARD;
    } else if (marathonType === "history") {
      carrotsAwarded = GAMIFICATION.HISTORY_MARATHON_AWARD;
    } else if (marathonType === "vocabulary") {
      carrotsAwarded = GAMIFICATION.VOCABULARY_MARATHON_AWARD;
    } else {
      carrotsAwarded = GAMIFICATION.MARATHON_AWARD; // Default (Math goes here)
    }

    const user = await User.adjustCarrots(userId, carrotsAwarded);
    if (user) updatedCarrots = user.carrots;
  }

  // 4. Save Response (Lean)
  await Responses.create({
    userId,
    isMarathon: true,
    marathonType: type || decoded.type,
    accuracy,
    timeTaken,
    // No response/passageId saved
  });

  // 5. Elo Update — true fire-and-forget
  if (decoded.questionId || req.body.questionId) {
    const qId = decoded.questionId || req.body.questionId;
    const actualScore = accuracy / 100;
    updateEloRatings(userId, qId, actualScore).catch((err) =>
      console.error("[saveMarathonResponse] Elo update failed:", err),
    );
  } else if (decoded.passageId || req.body.passageId) {
    const pId = decoded.passageId || req.body.passageId;
    const actualScore = accuracy / 100;
    updatePassageEloRatings(userId, pId, actualScore).catch((err) =>
      console.error("[saveMarathonResponse] Passage Elo update failed:", err),
    );
  }
  const eloUpdate = null; // result not available synchronously; kept for API forward-compat

  res.json({
    success: true,
    data: {
      accuracy,
      carrotsAwarded,
      carrots: updatedCarrots, // Return latest totals
      message:
        carrotsAwarded > 0 ? `+${carrotsAwarded} Carrot!` : "Keep trying!",
      correctAnswers: correctAnswers,
      explanation: explanation, // Passed from evaluation or decoded
      elo: eloUpdate,
    },
  });
});

const getMyHistory = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // 1. Fetch all responses for the user
    // Only standard modules (isMarathon: false or missing)
    const responses = await Responses.find({
      userId,
      $or: [{ isMarathon: false }, { isMarathon: { $exists: false } }],
    })
      .populate("questionId")
      .populate("moduleId", "name subject")
      .sort({ createdAt: -1 });

    // 2. Group responses by module
    const historyByModule = {};

    // Helper to get module questionIds map
    const moduleMap = {};
    const moduleIds = [
      ...new Set(
        responses.map((r) => r.moduleId?._id?.toString()).filter(Boolean),
      ),
    ];
    const moduleDocs = await Module.find({ _id: { $in: moduleIds } }).select(
      "questionIds",
    );
    moduleDocs.forEach((m) => {
      moduleMap[m._id.toString()] = m.questionIds.map((q) => q.toString());
    });

    responses.forEach((r) => {
      if (!r.moduleId || !r.moduleId._id) return;

      const modId = r.moduleId._id.toString();
      if (!historyByModule[modId]) {
        historyByModule[modId] = {
          moduleId: modId,
          moduleName: r.moduleId.name,
          subject: r.moduleId.subject,
          status: "in_progress",
          questions: [],
          totalTimeTaken: 0,
          accuracySum: 0,
          answeredQuestionsCount: 0,
        };
      }

      let correctAnswerDisplay;
      const q = r.questionId;

      if (!q) {
        historyByModule[modId].questions.push({
          questionId: null,
          questionSlate: null,
          answerType: "unknown",
          options: {},
          userResponse: r.response,
          isCorrect: r.accuracy,
          correctAnswer: "Unknown",
          timeTaken: r.timeTaken,
          attemptedAt: r.createdAt,
          order: 9999,
          responseId: r._id,
        });
        historyByModule[modId].totalTimeTaken += r.timeTaken || 0;
        return;
      }

      if (q.answerType === "MCQ") {
        const idx = q.options.mcq.findIndex(
          (o) =>
            o._id &&
            q.correctOption &&
            o._id.toString() === q.correctOption.toString(),
        );
        const labels = ["A", "B", "C", "D", "E", "F"];
        correctAnswerDisplay = labels[idx] || "Unknown";
      } else {
        correctAnswerDisplay = q.options.sa;
      }

      const accuracy = calculateAccuracy(q, r.response);
      let isCorrect;

      if (q.answerType === "fillInTheBlanks") {
        isCorrect = accuracy;
      } else {
        isCorrect = accuracy === 100;
      }

      let order = 0;
      const qIds = moduleMap[modId];
      if (qIds) {
        const idx = qIds.indexOf(q._id.toString());
        if (idx !== -1) order = idx + 1;
        else order = 999;
      }

      historyByModule[modId].questions.push({
        questionId: q._id,
        questionSlate: q.question.slate,
        answerType: q.answerType,
        options: q.options,
        userResponse: r.response,
        isCorrect: isCorrect,
        correctAnswer: correctAnswerDisplay,
        timeTaken: r.timeTaken,
        attemptedAt: r.createdAt,
        order: order,
        responseId: r._id,
      });

      // Update aggregates
      historyByModule[modId].totalTimeTaken += r.timeTaken || 0;
      historyByModule[modId].answeredQuestionsCount++;
      if (typeof isCorrect === "number") {
        historyByModule[modId].accuracySum += isCorrect;
      } else {
        historyByModule[modId].accuracySum += isCorrect ? 100 : 0;
      }
    });

    // Calculate final status and average accuracy
    Object.values(historyByModule).forEach((module) => {
      module.questions.sort((a, b) => (a.order || 0) - (b.order || 0));

      const moduleTotalQuestions = moduleMap[module.moduleId]?.length || 0;
      const answeredUniqueQuestions = new Set(
        module.questions.map((q) => q.questionId).filter(Boolean),
      ).size;

      if (
        moduleTotalQuestions > 0 &&
        answeredUniqueQuestions >= moduleTotalQuestions
      ) {
        module.status = "completed";
      }

      module.averageAccuracy =
        module.answeredQuestionsCount > 0
          ? Math.round(module.accuracySum / module.answeredQuestionsCount)
          : 0;

      module.totalQuestions = moduleTotalQuestions;

      module.averageTimeTaken =
        module.answeredQuestionsCount > 0
          ? Math.round(module.totalTimeTaken / module.answeredQuestionsCount)
          : 0;
    });

    res.status(200).json({
      success: true,
      data: Object.values(historyByModule),
    });
  } catch (error) {
    console.error("Error fetching my history:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const getDailyAnalytics = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const query = {
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    };

    if (type === "modules") {
      query.$or = [{ isMarathon: false }, { isMarathon: { $exists: false } }];
    } else if (type === "marathons") {
      query.isMarathon = true;
    }
    // if type === "all" or omitted, do not filter by isMarathon

    const responses = await Responses.find(query).sort({ createdAt: 1 });

    if (responses.length === 0) {
      return res.json({
        success: true,
        data: { labels: [], data: [] },
      });
    }

    const oldestRecordDate = new Date(responses[0].createdAt);
    oldestRecordDate.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    let startDate = new Date(
      Math.min(sevenDaysAgo.getTime(), oldestRecordDate.getTime()),
    );

    const groupedData = {};
    responses.forEach((r) => {
      const d = new Date(r.createdAt);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split("T")[0];
      if (!groupedData[dateStr]) {
        groupedData[dateStr] = 0;
      }
      groupedData[dateStr]++;
    });

    const labels = [];
    const data = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currDate = new Date(startDate);
    while (currDate <= today) {
      const dateStr = currDate.toISOString().split("T")[0];
      const label = currDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      labels.push(label);
      data.push(groupedData[dateStr] || 0);

      currDate.setDate(currDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        labels,
        data,
      },
    });
  } catch (error) {
    console.error("Error fetching daily analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const getMarathonAnalytics = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const responses = await Responses.find({
      userId,
      isMarathon: true,
    }).sort({ createdAt: -1 });

    const groupedSessions = {};

    responses.forEach((r) => {
      // Grouping by date (YYYY-MM-DD) and marathonType
      const d = new Date(r.createdAt);
      d.setHours(d.getHours() - 3); // Account for potential session spanning slightly, basic grouping chunk
      const dateStr = d.toISOString().split("T")[0];
      const sessionKey = `${dateStr}_${r.marathonType}`;

      if (!groupedSessions[sessionKey]) {
        groupedSessions[sessionKey] = {
          sessionId: sessionKey,
          moduleName: `Marathon (${r.marathonType})`,
          subject: r.marathonType,
          totalTimeTaken: 0,
          accuracySum: 0,
          questionsCount: 0,
          createdAt: r.createdAt,
          status: "completed", // Marathons are single-run
        };
      }

      groupedSessions[sessionKey].totalTimeTaken += r.timeTaken || 0;
      groupedSessions[sessionKey].accuracySum += r.accuracy || 0;
      groupedSessions[sessionKey].questionsCount++;
    });

    const formattedData = Object.values(groupedSessions).map((session) => ({
      ...session,
      averageAccuracy:
        session.questionsCount > 0
          ? Math.round(session.accuracySum / session.questionsCount)
          : 0,
      averageTimeTaken:
        session.questionsCount > 0
          ? Math.round(session.totalTimeTaken / session.questionsCount)
          : 0,
    }));

    // Sort by most recent first
    formattedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching marathon analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const getSpeedAccuracyAnalytics = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query;

  try {
    const matchQuery = { userId };
    if (type === "modules") {
      matchQuery.$or = [
        { isMarathon: false },
        { isMarathon: { $exists: false } },
      ];
    } else if (type === "marathons") {
      matchQuery.isMarathon = true;
    }

    // Fetch responses that have a stored raw answer and a sensible timeTaken
    const responses = await Responses.find({
      ...matchQuery,
      questionId: { $exists: true, $ne: null },
      response: { $exists: true, $ne: null },
      timeTaken: { $lte: 600, $ne: null },
    }).lean();

    if (responses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Batch-load live questions so accuracy is computed against current correct answer
    const questionIds = [
      ...new Set(responses.map((r) => r.questionId.toString())),
    ];
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // Define time buckets (seconds)
    const BUCKETS = [
      { min: 0, max: 10, label: "<10s" },
      { min: 10, max: 20, label: "10-20s" },
      { min: 20, max: 30, label: "20-30s" },
      { min: 30, max: 60, label: "30-60s" },
      { min: 60, max: 120, label: "1-2m" },
      { min: 120, max: 601, label: ">2m" },
    ];

    const bucketAccumulator = {};
    BUCKETS.forEach((b) => {
      bucketAccumulator[b.label] = {
        totalAccuracy: 0,
        count: 0,
        order: BUCKETS.indexOf(b),
      };
    });

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (!question) continue;

      const accuracy = calculateAccuracy(question, resp.response);
      const t = resp.timeTaken;
      const bucket = BUCKETS.find((b) => t >= b.min && t < b.max);
      if (!bucket) continue;

      bucketAccumulator[bucket.label].totalAccuracy += accuracy;
      bucketAccumulator[bucket.label].count += 1;
    }

    const formattedData = Object.entries(bucketAccumulator)
      .filter(([, v]) => v.count > 0)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([label, { totalAccuracy, count }]) => ({
        bucket: label,
        accuracy: Math.round(totalAccuracy / count),
        count,
      }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error fetching speed accuracy analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const getFormatAnalytics = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query;

  try {
    const matchQuery = { userId };
    if (type === "modules") {
      matchQuery.$or = [
        { isMarathon: false },
        { isMarathon: { $exists: false } },
      ];
    } else if (type === "marathons") {
      matchQuery.isMarathon = true;
    }

    // Fetch raw responses (the user's actual submitted answer)
    const responses = await Responses.find({
      ...matchQuery,
      questionId: { $exists: true, $ne: null },
      response: { $exists: true, $ne: null },
    }).lean();

    // Batch-load live questions — answerType + current correct answer
    const questionIds = [
      ...new Set(responses.map((r) => r.questionId.toString())),
    ];
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // Accumulate per answer-type using dynamically computed accuracy
    const accumulator = {
      MCQ: { totalAccuracy: 0, count: 0 },
      SA: { totalAccuracy: 0, count: 0 },
      fillInTheBlanks: { totalAccuracy: 0, count: 0 },
    };

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (!question || !accumulator[question.answerType]) continue;

      const accuracy = calculateAccuracy(question, resp.response);
      accumulator[question.answerType].totalAccuracy += accuracy;
      accumulator[question.answerType].count += 1;
    }

    const result = {
      MCQ:
        accumulator.MCQ.count > 0
          ? Math.round(accumulator.MCQ.totalAccuracy / accumulator.MCQ.count)
          : 0,
      SA:
        accumulator.SA.count > 0
          ? Math.round(accumulator.SA.totalAccuracy / accumulator.SA.count)
          : 0,
      fillInTheBlanks:
        accumulator.fillInTheBlanks.count > 0
          ? Math.round(
              accumulator.fillInTheBlanks.totalAccuracy /
                accumulator.fillInTheBlanks.count,
            )
          : 0,
    };

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching format analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const getSkillsAnalytics = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query;

  try {
    // Build the filter for module vs marathon vs all
    const matchQuery = { userId };
    if (type === "modules") {
      matchQuery.$or = [
        { isMarathon: false },
        { isMarathon: { $exists: false } },
      ];
    } else if (type === "marathons") {
      matchQuery.isMarathon = true;
    }

    // 1. Fetch all relevant responses that have a stored raw response
    //    (marathon summary responses have no questionId/response, skip them)
    const responses = await Responses.find({
      ...matchQuery,
      questionId: { $exists: true, $ne: null },
      response: { $exists: true, $ne: null },
    }).lean();

    if (responses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 2. Batch-load all referenced questions (current state from DB)
    //    Using the live question means any edit to the correct answer is picked up.
    const questionIds = [
      ...new Set(responses.map((r) => r.questionId.toString())),
    ];
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // 3. Compute accuracy per response against the CURRENT correct answer,
    //    then group the results by skill.
    const skillAccumulator = {}; // { skill: { totalAccuracy: number, count: number } }

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (
        !question ||
        !Array.isArray(question.skills) ||
        question.skills.length === 0
      ) {
        continue; // question deleted or has no skills — skip
      }

      // Re-derive accuracy dynamically: this reflects the question as it stands TODAY
      const accuracy = calculateAccuracy(question, resp.response);

      for (const skill of question.skills) {
        if (!skillAccumulator[skill]) {
          skillAccumulator[skill] = { totalAccuracy: 0, count: 0 };
        }
        skillAccumulator[skill].totalAccuracy += accuracy;
        skillAccumulator[skill].count += 1;
      }
    }

    // 4. Shape into the same response format the frontend expects
    const skillsData = Object.entries(skillAccumulator)
      .map(([skill, { totalAccuracy, count }]) => ({
        skill,
        averageAccuracy: Math.round(totalAccuracy / count),
        count,
      }))
      .sort(
        (a, b) => b.averageAccuracy - a.averageAccuracy || b.count - a.count,
      );

    res.status(200).json({ success: true, data: skillsData });
  } catch (error) {
    console.error("Error fetching skills analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const getDifficultyAnalytics = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query;

  try {
    const matchQuery = { userId };
    if (type === "modules") {
      matchQuery.$or = [
        { isMarathon: false },
        { isMarathon: { $exists: false } },
      ];
    } else if (type === "marathons") {
      matchQuery.isMarathon = true;
    }

    // Fetch raw responses
    const responses = await Responses.find({
      ...matchQuery,
      questionId: { $exists: true, $ne: null },
      response: { $exists: true, $ne: null },
      timeTaken: { $ne: null },
    }).lean();

    if (responses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Batch-load live questions — need both the correct answer (for accuracy)
    // and the current rating (for ELO bucketing)
    const questionIds = [
      ...new Set(responses.map((r) => r.questionId.toString())),
    ];
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // ELO bucket definitions — must mirror what the frontend expects
    const BUCKETS = [
      { min: 0, max: 1000, label: "<1000" },
      { min: 1000, max: 1200, label: "1000-1199" },
      { min: 1200, max: 1400, label: "1200-1399" },
      { min: 1400, max: 1600, label: "1400-1599" },
      { min: 1600, max: 1800, label: "1600-1799" },
      { min: 1800, max: Infinity, label: "1800+" },
    ];

    const bucketAccumulator = {};
    BUCKETS.forEach((b, i) => {
      bucketAccumulator[b.label] = {
        totalAccuracy: 0,
        totalTimeTaken: 0,
        count: 0,
        order: i,
      };
    });

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId.toString());
      if (!question) continue;

      const accuracy = calculateAccuracy(question, resp.response);
      const rating = question.rating ?? 1200;
      const bucket = BUCKETS.find((b) => rating >= b.min && rating < b.max);
      if (!bucket) continue;

      bucketAccumulator[bucket.label].totalAccuracy += accuracy;
      bucketAccumulator[bucket.label].totalTimeTaken += resp.timeTaken;
      bucketAccumulator[bucket.label].count += 1;
    }

    const formattedData = Object.entries(bucketAccumulator)
      .filter(([, v]) => v.count > 0)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([label, { totalAccuracy, totalTimeTaken, count }]) => ({
        bucket: label,
        averageAccuracy: Math.round(totalAccuracy / count),
        averageTimeTaken: Math.round(totalTimeTaken / count),
        count,
      }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error fetching difficulty analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Bulk Import ──────────────────────────────────────────────────────────────

/**
 * @desc    Bulk import multiple questions into a module via ACID transaction
 * @route   POST /api/quiz/bulk-import
 * @access  Private (protectAdmin)
 *
 * @body {string} moduleId - Target module ObjectId
 * @body {Array} questions - Array of question objects matching Questions.model schema
 *
 * Transaction flow (mirrors createQuestion):
 * 1. Validate module exists
 * 2. Insert all questions atomically
 * 3. Push all question IDs to the module's questionIds array
 * 4. On any failure, entire transaction is rolled back automatically
 */
const bulkImportQuestions = expressAsyncHandler(async (req, res) => {
  const { moduleId, questions } = req.body;

  // ─── Input Validation ───────────────────────────────────────────────────────
  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    res.status(400);
    throw new Error("A valid moduleId is required.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    res.status(400);
    throw new Error("questions must be a non-empty array.");
  }

  if (questions.length > 50) {
    res.status(400);
    throw new Error("Maximum 50 questions can be imported at once.");
  }

  // Validate each question's structure before starting the transaction
  const validationErrors = [];
  const validAnswerTypes = ["SA", "MCQ", "fillInTheBlanks"];

  questions.forEach((q, index) => {
    // 1. General validation
    if (
      !q.question?.slate ||
      !Array.isArray(q.question.slate) ||
      q.question.slate.length === 0
    ) {
      validationErrors.push(
        `Question ${index + 1}: missing question.slate content.`,
      );
    }

    if (!validAnswerTypes.includes(q.answerType)) {
      validationErrors.push(
        `Question ${index + 1}: invalid answerType "${q.answerType}".`,
      );
      return; // Skip further type-specific validation for this question
    }

    // 2. Type-specific validation
    if (q.answerType === "MCQ") {
      if (!Array.isArray(q.options?.mcq) || q.options.mcq.length < 2) {
        validationErrors.push(
          `Question ${index + 1}: options.mcq must have at least 2 items.`,
        );
      } else {
        q.options.mcq.forEach((opt, optIdx) => {
          if (!opt.slate || !Array.isArray(opt.slate)) {
            validationErrors.push(
              `Question ${index + 1}, Option ${optIdx + 1}: missing slate content.`,
            );
          }
        });
        if (
          q.optionIndex === undefined ||
          q.optionIndex < 0 ||
          q.optionIndex >= q.options.mcq.length
        ) {
          validationErrors.push(
            `Question ${index + 1}: invalid or missing optionIndex.`,
          );
        }
      }
    } else if (q.answerType === "SA") {
      if (
        !q.options?.sa ||
        typeof q.options.sa !== "string" ||
        !q.options.sa.trim()
      ) {
        validationErrors.push(
          `Question ${index + 1}: options.sa must be a non-empty string for SA questions.`,
        );
      }
    } else if (q.answerType === "fillInTheBlanks") {
      if (
        !Array.isArray(q.options?.fillInTheBlanks) ||
        q.options.fillInTheBlanks.length === 0
      ) {
        validationErrors.push(
          `Question ${index + 1}: options.fillInTheBlanks must be a non-empty array for fillInTheBlanks questions.`,
        );
      }
    }
  });

  if (validationErrors.length > 0) {
    res.status(400);
    throw new Error(`Validation failed:\n${validationErrors.join("\n")}`);
  }

  // ─── Transaction ────────────────────────────────────────────────────────────
  const session = await mongoose.startSession();

  try {
    let createdQuestionDocs = [];
    await session.withTransaction(
      async () => {
        // 1. Verify module exists
        const targetModule = await Module.findById(moduleId).session(session);
        if (!targetModule) {
          throw new Error(`Module "${moduleId}" not found.`);
        }

        // 2. Prepare question documents with consistent structure
        const questionDocs = questions.map((q) => {
          const qId = new mongoose.Types.ObjectId();

          let formattedOptions = {};
          let correctOption = null;

          if (q.answerType === "MCQ") {
            const mcqWithIds = q.options.mcq.map((opt) => ({
              ...opt,
              _id: new mongoose.Types.ObjectId(),
              slate: opt.slate,
              html: opt.html || "",
            }));
            formattedOptions.mcq = mcqWithIds;
            correctOption = mcqWithIds[q.optionIndex]._id;
          } else if (q.answerType === "SA") {
            formattedOptions.sa = q.options.sa;
          } else if (q.answerType === "fillInTheBlanks") {
            formattedOptions.fillInTheBlanks = q.options.fillInTheBlanks;
          }

          return {
            _id: qId,
            question: q.question,
            answerType: q.answerType,
            options: formattedOptions,
            correctOption: correctOption,
            explanation: q.explanation || {
              slate: [
                {
                  type: "paragraph",
                  children: [{ text: "No explanation provided" }],
                },
              ],
            },
            modules: [new mongoose.Types.ObjectId(moduleId)],
            tags: q.tags || [],
            skills: q.skills || [],
            active: true,
          };
        });

        createdQuestionDocs = questionDocs;

        // 3. Insert all questions atomically
        await Question.create(questionDocs, { session, ordered: true });

        // 4. Update module's questionIds array
        await Module.findByIdAndUpdate(
          moduleId,
          { $push: { questionIds: { $each: questionDocs.map((q) => q._id) } } },
          { session, new: true },
        );
      },
      {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
    );
    session.endSession();

    // Fire-and-forget: finalize files for each question
    createdQuestionDocs.forEach((q) => {
      finalizeQuestionFiles({ ...q, modules: [moduleId] }).catch((err) =>
        console.error(
          `[Bulk Import] File finalization failed for ${q._id}:`,
          err,
        ),
      );
    });

    // Trigger backup
    triggerBackup();

    res.status(201).json({
      success: true,
      message: `${questions.length} question(s) imported successfully into module.`,
      count: questions.length,
    });
  } catch (error) {
    session.endSession();
    console.error("[Bulk Import] Transaction failed:", error);
    res.status(400);
    throw new Error(error.message, { cause: error });
  }
});

export default {
  // Question controllers
  createQuestion,
  getQuestions,
  getTrashQuestions,
  getQuestionById,
  getQuestionByIdForQuiz,
  updateQuestion,
  deleteQuestion,
  restoreQuestion,
  deleteQuestionPermanently,
  emptyTrash,
  getQuestionsByModuleId,
  getSkills,
  // Module controllers
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
  deleteModuleAndQuestions,
  // Module question management
  addQuestionToModule,
  removeQuestionFromModule,
  startModule,
  submitAnswer,
  getModulesWithProgress,
  // Admin User History
  getUserHistory,
  deleteResponse,
  nextQuestion,
  saveMarathonResponse,
  getMyHistory,
  getDailyAnalytics,
  getMarathonAnalytics,
  getSpeedAccuracyAnalytics,
  getFormatAnalytics,
  getSkillsAnalytics,
  getDifficultyAnalytics,
  // Bulk Import
  bulkImportQuestions,
};
