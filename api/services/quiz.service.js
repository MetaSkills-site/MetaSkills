/**
 * @file quiz.service.js
 * @description Logic for module and quiz progression, state tracking, and answer submission.
 * @architecture Handles data persistence and flow logic for user quiz modules, utilizing Elo updates and accuracy calculation.
 */
import mongoose from "mongoose";
import { calculateAccuracy } from "../utils/accuracy.js";
import Module from "../models/Module.model.js";
import Question from "../models/Questions.model.js";
import { updateEloRatings } from "../utils/elo.js";
import Sequence from "../models/Sequence.model.js";

import Responses from "../models/Responses.model.js";
import User from "../models/user.model.js";

/**
 * @desc    Helper to determine active module for a subject
 * @param   {string} userId - ID of the user.
 * @param   {string} subject - Subject to check.
 * @param   {string} grade - User's grade.
 * @returns {Promise<Object|null>} The active module document or null if all completed.
 */
const getActiveModuleForSubject = async (userId, subject, grade) => {
  // Fetch all modules for this subject/grade
  let modulesRaw = await Module.find({ subject, grades: grade });

  // Fetch sequence for this user's grade/subject to determine order
  const sequence = await Sequence.findOne({ subject, grade: grade });

  // Sort modules based on sequence or createdAt fallback
  const modules = modulesRaw.sort((a, b) => {
    if (sequence && sequence.modules) {
      const idxA = sequence.modules.findIndex(
        (m) => m.toString() === a._id.toString(),
      );
      const idxB = sequence.modules.findIndex(
        (m) => m.toString() === b._id.toString(),
      );

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const responses = await Responses.find({ userId });

  for (const module of modules) {
    // Fetch active questions for this module to ensure we only check active ones
    const activeQuestions = await Question.find({
      _id: { $in: module.questionIds },
      active: true,
    }).select("_id");
    const activeQuestionIdsSet = new Set(
      activeQuestions.map((q) => q._id && q._id.toString()).filter(Boolean),
    );

    // Filter module questions
    const relevantQuestionIds = module.questionIds.filter(
      (id) => id && activeQuestionIdsSet.has(id.toString()),
    );

    // If module has no active questions, skip it entirely for sequencing/locking
    if (relevantQuestionIds.length === 0) continue;

    // Check if module is completed (using only active questions)
    const moduleResponses = responses.filter(
      (r) => r.moduleId && r.moduleId.toString() === module._id.toString(),
    );

    // Get unique question IDs answered
    const answeredQuestionIds = new Set(
      moduleResponses
        .map((r) => r.questionId && r.questionId.toString())
        .filter(Boolean),
    );

    const isCompleted = relevantQuestionIds.every((qId) =>
      answeredQuestionIds.has(qId.toString()),
    );

    if (!isCompleted) {
      return module;
    }
  }
  return null; // All completed
};

/**
 * @desc    Start or resume a module for a user. Checks if module is unlocked and returns the current question.
 * @param   {string} userId - ID of the user.
 * @param   {string} moduleId - ID of the module.
 * @returns {Promise<Object>} Contains progress, question, and module metadata.
 */
const startModule = async (userId, moduleId) => {
  const module = await Module.findById(moduleId);
  if (!module) throw new Error("Module not found");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Strict Locking Check:
  // Find the active module for this subject.
  // If the requested module is NOT the active one, block it UNLESS it is already completed.
  const activeModule = await getActiveModuleForSubject(
    userId,
    module.subject,
    user.grade,
  );

  // Check if module is completed
  const responses = await Responses.find({ userId, moduleId });

  // Filter for active questions:
  const activeQuestions = await Question.find({
    _id: { $in: module.questionIds },
    active: true,
  }).select("_id");
  const activeQuestionIdsSet = new Set(
    activeQuestions.map((q) => q._id && q._id.toString()).filter(Boolean),
  );

  // Use ONLY active question IDs for this module's logic
  const activeModuleQuestionIds = module.questionIds.filter(
    (id) => id && activeQuestionIdsSet.has(id.toString()),
  );

  // Get unique question IDs answered
  const answeredQuestionIds = new Set(
    responses
      .map((r) => r.questionId && r.questionId.toString())
      .filter(Boolean),
  );

  const isCompleted =
    activeModuleQuestionIds.length > 0 &&
    activeModuleQuestionIds.every((qId) =>
      answeredQuestionIds.has(qId.toString()),
    );

  // If module is completed, allow access (Review Mode)
  if (isCompleted) {
    // Find the first question ID in the module
    const firstQuestionId = activeModuleQuestionIds[0];
    const firstQuestion = await Question.findById(firstQuestionId).populate(
      "contextAttachmentId",
    );

    // Construct progress object for frontend compatibility
    const progressObj = {
      userId,
      moduleId,
      status: "completed",
      currentQuestionId: firstQuestion._id,
      currentQuestionOrder: 1, // Visual order
      unlocked: true,
      completedAt: responses[responses.length - 1]?.createdAt || new Date(), // Approx
    };

    // Sanitize question
    const sanitizedQuestion = firstQuestion.toObject();

    // Fetch user's response for this question
    const response = await Responses.findOne({
      userId,
      questionId: firstQuestion._id,
      moduleId,
    });

    let userResponse = null;
    let timeTaken = 0;
    let isCorrect = null;

    if (response) {
      userResponse = response.response;
      timeTaken = response.timeTaken;

      // Use the shared accuracy utility instead of manual trim
      const accuracy = calculateAccuracy(sanitizedQuestion, userResponse);
      isCorrect =
        sanitizedQuestion.answerType === "fillInTheBlanks"
          ? accuracy
          : accuracy === 100;
    }

    // Fetch next question ID from module array
    const currentIndex = activeModuleQuestionIds.findIndex(
      (qid) => qid.toString() === firstQuestion._id.toString(),
    );
    const nextQuestionId =
      currentIndex !== -1 && currentIndex < activeModuleQuestionIds.length - 1
        ? activeModuleQuestionIds[currentIndex + 1]
        : null;

    return {
      progress: progressObj,
      question: sanitizedQuestion,
      totalQuestions: activeModuleQuestionIds.length,
      userResponse,
      timeTaken,
      isCorrect,
      nextQuestionId: nextQuestionId,
    };
  } else {
    // Normal flow: Check locking
    if (!activeModule) {
      // All modules completed? Then this one should be accessible if it is completed (handled above).
      // If we are here, it means it's NOT completed, but getActiveModule returned null?
      // This implies all modules are completed, but we just calculated this one is NOT.
      // This is a contradiction or edge case (maybe new questions added to a completed module).
      // If new questions added, it becomes incomplete. So it should be the active module.
      // So getActiveModule should have returned it.
      // If getActiveModule returned null, it means it thinks all are completed.
      // But we found this one is not.
      // Re-check getActiveModule logic.
      // It iterates modules in order.
      // If this module is incomplete, getActiveModule should return it (if previous are done).
      // So if activeModule is null, it means THIS module is also considered completed by getActiveModule?
      // Or maybe we are accessing a module that is NOT the active one (e.g. future one).

      // If activeModule is null, it means user finished everything.
      // But we established this module is NOT finished.
      // So this block is theoretically unreachable if logic is consistent.
      // However, if we are accessing a module that is NOT in the subject/grade list?
      // Let's assume strict locking:
      throw new Error(
        "All modules for this subject are completed, but this one is incomplete? Please contact support.",
      );
    } else if (activeModule._id.toString() !== moduleId.toString()) {
      console.log(
        "LOCK ERROR: Active:",
        activeModule._id,
        "Requested:",
        moduleId,
      );
      throw new Error("Module is locked.");
    }
  }

  // Determine current question
  // Check which questions from the module have been answered
  // module.questionIds is the ordered list
  let currentQuestionId = null;
  let currentQuestionOrder = 1;

  for (let i = 0; i < activeModuleQuestionIds.length; i++) {
    const qId = activeModuleQuestionIds[i];
    if (!answeredQuestionIds.has(qId.toString())) {
      currentQuestionId = qId;
      currentQuestionOrder = i + 1;
      break;
    }
  }

  // If all answered but not marked completed (edge case), take the last one or error?
  // We handled isCompleted check earlier.
  if (!currentQuestionId && activeModuleQuestionIds.length > 0) {
    // Maybe user answered all but process didn't catch up? Or module extended?
    // Just take the last one? Or first?
    // Let's take the first unanswered if any, else the first one (review style).
    // But we are in "Normal flow".
    currentQuestionId = activeModuleQuestionIds[0];
  }

  const question = await Question.findById(currentQuestionId).populate(
    "contextAttachmentId",
  );

  if (!question) throw new Error("No available questions in this module");
  currentQuestionId = question._id;

  const progressObj = {
    userId,
    moduleId,
    status: "in_progress",
    currentQuestionId,
    currentQuestionOrder,
    unlocked: true,
    lastActivityAt: new Date(),
  };

  const sanitizedQuestion = question.toObject();
  if (sanitizedQuestion.answerType === "MCQ") {
    sanitizedQuestion.correctOption = undefined;
  } else if (sanitizedQuestion.answerType === "SA") {
    sanitizedQuestion.options.sa = undefined;
  } else if (sanitizedQuestion.answerType === "fillInTheBlanks") {
    sanitizedQuestion.options.fillInTheBlanks = undefined;
  }
  sanitizedQuestion.explanation = undefined;

  // Fetch next question ID for navigation
  const currentIndex = activeModuleQuestionIds.findIndex(
    (qid) => qid.toString() === question._id.toString(),
  );
  const nextQuestionId =
    currentIndex !== -1 && currentIndex < activeModuleQuestionIds.length - 1
      ? activeModuleQuestionIds[currentIndex + 1]
      : null;

  return {
    progress: progressObj,
    question: sanitizedQuestion,
    totalQuestions: activeModuleQuestionIds.length,
    userResponse: null,
    timeTaken: 0,
    isCorrect: null,
    nextQuestionId: nextQuestionId,
  };
};

/**
 * @desc    Advance progress to the next question. Can be used internally or as a standalone action.
 * @param   {string} userId - ID of the user.
 * @param   {string} moduleId - ID of the module.
 * @param   {string} currentQuestionId - ID of the current question.
 * @returns {Promise<Object>} The next question details and completion status.
 */
const advanceToNextQuestion = async (userId, moduleId, currentQuestionId) => {
  const module = await Module.findById(moduleId);
  if (!module) throw new Error("Module not found");

  const activeQuestions = await Question.find({
    _id: { $in: module.questionIds },
    active: true,
  }).select("_id");
  const activeQuestionIdsSet = new Set(
    activeQuestions.map((q) => q._id && q._id.toString()).filter(Boolean),
  );
  const activeModuleQuestionIds = module.questionIds.filter(
    (id) => id && activeQuestionIdsSet.has(id.toString()),
  );

  const currentIdx = activeModuleQuestionIds.findIndex(
    (qid) => qid.toString() === currentQuestionId.toString(),
  );

  let nextQuestionId = null;
  let isModuleComplete = false;
  let nextQuestion = null;
  // let currentQuestionOrder = currentIdx + 1; // unused

  if (currentIdx !== -1 && currentIdx < activeModuleQuestionIds.length - 1) {
    nextQuestionId = activeModuleQuestionIds[currentIdx + 1];
    nextQuestion = await Question.findById(nextQuestionId).populate(
      "contextAttachmentId",
    );
  } else {
    isModuleComplete = true;
  }

  return {
    nextQuestionId,
    isModuleComplete,
    currentQuestionOrder: nextQuestion ? currentIdx + 2 : currentIdx + 1, // Next visual order
    nextQuestion,
  };
};

/**
 * @desc    Submit an answer and advance.
 * @param   {string} userId - ID of the user.
 * @param   {string} moduleId - ID of the module.
 * @param   {string} questionId - ID of the question.
 * @param   {any} answer - The user's submitted answer.
 * @param   {number} timeTaken - Time taken in milliseconds.
 * @returns {Promise<Object>} Result payload containing correctness, accuracy, and next question details.
 */
const submitAnswer = async (
  userId,
  moduleId,
  questionId,
  answer,
  timeTaken,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // ── Domain-level idempotency guard ──
    // Defense-in-depth: even without the middleware, prevent duplicate submissions
    // for the same user + question + module trio.
    const existingResponse = await Responses.findOne({
      userId,
      questionId,
      moduleId,
    }).session(session);

    if (existingResponse) {
      await session.abortTransaction();

      // Re-derive the result from the existing response rather than re-processing
      const question = await Question.findById(questionId);
      if (!question) {
        // Question was deleted after the original submission — mirror the normal path's
        // "Question not found" throw so callers handle it consistently.
        throw new Error("Question not found");
      }
      const accuracy = calculateAccuracy(question, existingResponse.response);
      const advanceResult = await advanceToNextQuestion(
        userId,
        moduleId,
        questionId,
      );
      return {
        isCorrect:
          question.answerType === "fillInTheBlanks"
            ? accuracy
            : accuracy === 100,
        explanation: question.explanation,
        nextQuestionId: advanceResult.nextQuestionId,
        isModuleComplete: advanceResult.isModuleComplete,
        currentQuestionOrder: advanceResult.currentQuestionOrder,
        correctAnswer:
          question.answerType === "MCQ"
            ? question.correctOption
            : question.answerType === "fillInTheBlanks"
              ? question.options.fillInTheBlanks
              : question.options.sa,
        answerType: question.answerType,
        options: question.options,
        accuracy,
        elo: null, // Elo was already applied on the original submission
        _deduplicated: true, // Signal to caller (diagnostic only, not user-facing)
      };
    }

    const question = await Question.findById(questionId);
    if (!question) throw new Error("Question not found");

    // Verify Answer
    let accuracy = calculateAccuracy(question, answer);
    let isCorrect = accuracy === 100;

    // Save Response — only the raw `response` (what the user answered) is stored.
    // Accuracy is intentionally NOT persisted here: it is computed dynamically at
    // read-time by comparing the stored response against the question's CURRENT
    // correct answer. This means analytics remain accurate even if a teacher later
    // edits or corrects the question's answer.
    await Responses.create(
      [
        {
          userId,
          questionId,
          moduleId,
          response: answer,
          timeTaken,
        },
      ],
      { session },
    );

    // Advance to next question
    const advanceResult = await advanceToNextQuestion(
      userId,
      moduleId,
      questionId,
    );

    await session.commitTransaction();

    // Elo Update - Fire and forget (outside transaction)
    const actualScore = accuracy / 100;
    const eloUpdate = await updateEloRatings(userId, questionId, actualScore);

    return {
      isCorrect:
        question.answerType === "fillInTheBlanks" ? accuracy : isCorrect,
      explanation: question.explanation,
      nextQuestionId: advanceResult.nextQuestionId,
      isModuleComplete: advanceResult.isModuleComplete,
      currentQuestionOrder: advanceResult.currentQuestionOrder,
      correctAnswer:
        question.answerType === "MCQ"
          ? question.correctOption
          : question.answerType === "fillInTheBlanks"
            ? question.options.fillInTheBlanks
            : question.options.sa,
      answerType: question.answerType,
      options: question.options, // Needed to find MCQ label if only ID is returned, or just return full options
      accuracy, // Return the calculated accuracy
      elo: eloUpdate, // Include Elo update block if frontend wants to animate it
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Standalone next question (skip/advance).
 * @param   {string} userId - ID of the user.
 * @param   {string} moduleId - ID of the module.
 * @param   {string} currentQuestionId - ID of the current question.
 * @returns {Promise<Object>} The advanced question state payload.
 */
const nextQuestion = async (userId, moduleId, currentQuestionId) => {
  const result = await advanceToNextQuestion(
    userId,
    moduleId,
    currentQuestionId,
  );

  // Sanitize question if returning it
  let sanitizedNextQuestion = null;
  if (result.nextQuestion) {
    sanitizedNextQuestion = result.nextQuestion.toObject();
    if (sanitizedNextQuestion.answerType === "MCQ") {
      sanitizedNextQuestion.correctOption = undefined;
    } else if (sanitizedNextQuestion.answerType === "SA") {
      sanitizedNextQuestion.options.sa = undefined;
    } else if (sanitizedNextQuestion.answerType === "fillInTheBlanks") {
      sanitizedNextQuestion.options.fillInTheBlanks = undefined;
    }
    sanitizedNextQuestion.explanation = undefined;
  }

  return {
    ...result,
    nextQuestion: sanitizedNextQuestion,
  };
};

/**
 * @desc    List all modules with user progress status.
 * @param   {string} userId - ID of the user.
 * @returns {Promise<Array<Object>>} A list of modules annotated with progress and completion status.
 */
const listModulesWithProgress = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const modules = await Module.find({ grades: user.grade }).sort({
    createdAt: 1,
  });
  const responses = await Responses.find({ userId });

  // Fetch all questions for these modules to calculate accuracy dynamically
  const allQuestionIds = modules.flatMap((m) => m.questionIds);
  const allQuestions = await Question.find({ _id: { $in: allQuestionIds } });

  // Group by subject
  const modulesBySubject = modules.reduce((acc, module) => {
    if (!acc[module.subject]) acc[module.subject] = [];
    acc[module.subject].push(module);
    return acc;
  }, {});

  let result = [];

  for (const subject in modulesBySubject) {
    const subjectModules = modulesBySubject[subject];

    // Find active index (first non-completed)
    let activeIndex = -1;
    for (let i = 0; i < subjectModules.length; i++) {
      const module = subjectModules[i];

      const moduleResponses = responses.filter(
        (r) => r.moduleId.toString() === module._id.toString(),
      );
      const answeredQuestionIds = new Set(
        moduleResponses.map((r) => r.questionId.toString()),
      );
      const isCompleted =
        module.questionIds.length > 0 &&
        module.questionIds.every((qId) =>
          answeredQuestionIds.has(qId.toString()),
        );

      if (!isCompleted) {
        activeIndex = i;
        break;
      }
    }

    // If all completed, activeIndex remains -1.

    const subjectResult = subjectModules.map((module, index) => {
      // Calculate accuracy
      const moduleResponses = responses.filter(
        (r) => r.moduleId.toString() === module._id.toString(),
      );

      let accuracy = 0;
      if (moduleResponses.length > 0) {
        const correctCount = moduleResponses
          .filter((r) => {
            const question = allQuestions.find(
              (q) => q._id.toString() === r.questionId.toString(),
            );
            if (!question) return false;

            const accuracy = calculateAccuracy(question, r.response);
            // For module list precision, we count a question as 'correct' it's 100% or based on fill-in-blanks fractional accuracy
            return question.answerType === "fillInTheBlanks"
              ? accuracy / 100
              : accuracy === 100
                ? 1
                : 0;
          })
          .reduce(
            (acc, val) => acc + (typeof val === "number" ? val : val ? 1 : 0),
            0,
          );

        accuracy = Math.round((correctCount / moduleResponses.length) * 100);
      }

      // Calculate Status
      const answeredQuestionIds = new Set(
        moduleResponses.map((r) => r.questionId.toString()),
      );
      const isCompleted =
        module.questionIds.length > 0 &&
        module.questionIds.every((qId) =>
          answeredQuestionIds.has(qId.toString()),
        );

      const isInProgress = moduleResponses.length > 0 && !isCompleted;

      let status;
      let unlocked;

      if (isCompleted) {
        status = "completed";
        unlocked = true;
      } else if (activeIndex !== -1 && index === activeIndex) {
        // This is the active module
        unlocked = true;
        status = isInProgress ? "in_progress" : "not_started";
      } else {
        // Locked (future modules)
        status = "locked";
        unlocked = false;
      }

      // Frontend fix
      if (status === "locked" && unlocked) status = "not_started";

      return {
        ...module.toObject(),
        status,
        unlocked,
        accuracy,
      };
    });

    result = [...result, ...subjectResult];
  }

  return result;
};

export const createQuestion = async (
  inputData,
  { withTransaction, questionRepo, moduleRepo },
) => {
  const {
    question,
    options,
    explanation,
    modules,
    optionIndex,
    tags,
    skills,
    contextAttachmentId,
  } = inputData;

  if (!question || !options || !modules || !explanation) {
    throw new Error("Please provide all required fields");
  }

  const questionObj = {
    _id: new mongoose.Types.ObjectId(),
    question,
    answerType: options.type,
    options: {
      ...options,
      mcq: Array.isArray(options.mcq)
        ? options.mcq.map((opt) => ({
            _id: new mongoose.Types.ObjectId(),
            ...opt,
          }))
        : options.mcq
          ? Object.values({
              A: { _id: new mongoose.Types.ObjectId(), ...options.mcq.A },
              B: { _id: new mongoose.Types.ObjectId(), ...options.mcq.B },
              C: { _id: new mongoose.Types.ObjectId(), ...options.mcq.C },
              D: { _id: new mongoose.Types.ObjectId(), ...options.mcq.D },
            })
          : undefined,
      fillInTheBlanks: options.fillInTheBlanks || [],
    },
    explanation: explanation || {
      slate: [
        {
          type: "paragraph",
          children: [{ text: "No explanation provided" }],
        },
      ],
    },
    modules,
    skills: skills ? [...new Set(skills)] : [],
    tags: tags ? [...new Set(tags)] : [],
    contextAttachmentId: contextAttachmentId || null,
  };

  const finalQuestion = {
    ...questionObj,
    correctOption:
      questionObj.answerType === "MCQ"
        ? questionObj.options.mcq[optionIndex]?._id || null
        : null,
  };

  await withTransaction(async (sessionContext) => {
    await questionRepo.create([finalQuestion], sessionContext);

    if (modules && modules.length > 0) {
      await moduleRepo.updateMany(
        { _id: { $in: modules } },
        { $addToSet: { questionIds: questionObj._id } },
        sessionContext,
      );
    }
  });

  return {
    success: true,
    data: questionObj,
    events: [
      { type: "FINALIZE_FILES", payload: { questionObj, module: modules[0] } },
      { type: "TRIGGER_BACKUP" },
    ],
  };
};

export default {
  startModule,
  submitAnswer,
  listModulesWithProgress,
  nextQuestion,
  advanceToNextQuestion,
  createQuestion,
};
