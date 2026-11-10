/**
 * @file math.service.js
 * @description Core business logic for the Math module handling topic hierarchy generation, question generation, and answer verification.
 * @architecture Serves as the primary controller logic for math operations, linking the MathQuestions definitions to secure JWT-based verification.
 */
/**
 * FILE PURPOSE: Core business logic for the Math module. Handles topic hierarchy generation,
 * question generation, and answer verification.
 *
 * DEPENDENCIES:
 * - services/MathQuestions.js: The source of truth for all math question definitions and generators.
 * - utils/math.utils.js: Helper functions for mathematical equality checks (numerical, algebraic, set, sequence).
 * - jsonwebtoken: Used to sign and verify tokens ensuring stateless and secure answer verification.
 * - mathjs: Used for advanced mathematical operations (via MathQuestions generators).
 *
 * EXPORTS:
 * - getTopics: Returns the directory structure of math topics.
 * - generateQuestion: Generates a question payload and a signed token.
 * - verifyAnswer: Verifies a user's answer against the signed token's payload.
 */
import jwt from "jsonwebtoken";
// eslint-disable-next-line no-unused-vars
import * as math from "mathjs";
import MathQuestions from "./MathQuestions.js";
import {
  checkNumericallyEqual,
  checkSetEqual,
  checkSequenceEqual,
  checkAlgebraicEqualWithStructure,
} from "../utils/math.utils.js";

// --- STRICT HIERARCHY MAP LOGIC ---
// Builds a navigational tree from the flat list of questions in MathQuestions.js.
// Each node in the tree can contain subtopics (folders) and/or questions (sums).
const hierarchy = new Map(); // Key: FullPath, Value: { subtopics: Map<Name, Path>, questions: Array<Question> }

// Helper to ensure a node exists in the hierarchy
const ensureNode = (path) => {
  if (!hierarchy.has(path)) {
    hierarchy.set(path, {
      subtopics: new Map(),
      questions: [],
    });
  }
  return hierarchy.get(path);
};

// Initialize Hierarchy from MathQuestions
MathQuestions.forEach((q) => {
  const parents = q.parents; // e.g., ["Math", "Arithmetic", "Addition"]

  // Traverse the path to build the folder structure
  let currentPath = "Math";
  ensureNode(currentPath); // Ensure root exists

  // Iterate through parents to build subtopics
  // Start from index 1 because "Math" is root and we are inside it
  for (let i = 1; i < parents.length; i++) {
    const childName = parents[i];
    const parentNode = ensureNode(currentPath);
    const nextPath = `${currentPath}/${childName}`;

    // Add child to parent's subtopics map
    if (!parentNode.subtopics.has(childName)) {
      parentNode.subtopics.set(childName, nextPath);
    }

    // Move down
    currentPath = nextPath;
    ensureNode(currentPath); // Ensure specific child node exists
  }

  // At the end of the loop, currentPath is the final category (lines up with last parent)
  // Add the question to this category
  const finalNode = ensureNode(currentPath);
  finalNode.questions.push({
    id: q.id,
    name: q.name,
    type: "question",
    isSum: true,
  });
});

/**
 * @desc    Retrieves the directory structure of math topics and questions.
 * @param   {string} initialPath - The base path to fetch topics for (defaults to "Math").
 * @returns {Array<Object>} An array of topic or question nodes.
 */
const getTopics = (initialPath) => {
  const currentPath = initialPath || "Math";
  const node = hierarchy.get(currentPath);

  if (!node) {
    return [];
  }

  const result = [];

  // 1. Add Subtopics (Folders)
  for (const [name, path] of node.subtopics) {
    const childNode = hierarchy.get(path);
    // "if there are no more parent topic (subtopics)... then the sum should be show"
    // This implies clicking THIS folder will open sums.
    const isSumFolder =
      childNode &&
      childNode.subtopics.size === 0 &&
      childNode.questions.length > 0;

    result.push({
      name: name,
      path: path,
      type: "category",
      containsSums: isSumFolder, // Signal to frontend that this folder contains sums (disable auto-jump)
      isSum: false,
    });
  }

  // 2. Add Questions (Sums)
  // "if there are no more parent topic... then the sum should be show"
  // Our logic places questions at the leaf of their defined path.
  // So if a path has questions, they are shown here.
  for (const q of node.questions) {
    result.push(q);
  }

  return result;
};

/**
 * @desc    Generates a question payload and a signed token for verification.
 * @param   {string} questionId - The unique ID of the question to generate.
 * @returns {Object} An object containing the signed JWT token.
 */
const generateQuestion = (questionId) => {
  const questionDef = MathQuestions.find((q) => q.id === questionId);
  if (!questionDef) {
    throw new Error("Question ID not found");
  }

  const generated = questionDef.generator.question();

  // INTERCONNECT: The generators in MathQuestions.js return data in varying formats.
  // We normalize this into a standard { values, display } structure for the frontend.
  // The "Mass Migration" comment refers to legacy generators returning raw arrays vs objects.
  let numbers, display;
  // Verify structure
  const isSingleStep = generated && generated.display && generated.values;
  const isMultiStep = generated && generated.steps && generated.context;

  if (isSingleStep) {
    numbers = generated.values;
    display = generated.display;
  } else if (isMultiStep) {
    numbers = generated; // Pass entire object for multi-step processing
    display = [];
  } else {
    // Fallback or warning
    console.warn(
      `[MathService] Question ${questionId} returned unexpected format.`,
      generated,
    );
    numbers = generated ? generated.values || generated : [];
    display = generated ? generated.display || [] : [];
  }

  let payload = {
    id: questionId,
    type: "math",
    numbers: numbers,
    question: display, // Payload field 'question' now holds the structured 'display' array
    answerFormat: questionDef.answerFormat,
    inputConfig: questionDef.inputConfig, // Include frontend config
    description: questionDef.description || "",
  };

  // Handle Multi-Step Initialization
  if (questionDef.type === "multi-step") {
    const { context, steps } = numbers; // generic name 'numbers' holds the return value
    const stepIndex = 0;
    const currentStep = steps[stepIndex];

    // Override payload with step-specific data
    payload = {
      id: questionId,
      type: "math",
      stepIndex: stepIndex,
      context: context,
      question: currentStep.display,
      numbers: currentStep.numbers || [], // Pass numbers for frontend replacement
      answerFormat: currentStep.answerFormat,
      inputConfig: currentStep.inputConfig || questionDef.inputConfig, // Fallback if needed
      description: currentStep.description || questionDef.description || "",
      // We verify against the step logic, so we need to be able to reconstruct the step.
      // Since steps are deterministic from the generator given the same random seed (or we store context),
      // storing context is enough.
    };
  }

  // Sign the payload
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });

  return { token };
};

// INTERCONNECT: Decodes the JWT token generated by generateQuestion().
// The token contains the 'id' (question ID) and 'numbers' (random seed/values) needed to
// reconstruct the question and calculate the correct answer deterministically.
/**
 * @desc    Verifies a user's answer against the signed token's payload.
 * @param   {string} token - The signed JWT token containing the question context.
 * @param   {any} userAnswer - The user's submitted answer.
 * @returns {Object} Evaluation results including correctness, accuracy, and explanation.
 */
const verifyAnswer = (token, userAnswer) => {
  if (!token) throw new Error("Token is required");

  let decoded;
  let secret;
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }
    secret = process.env.JWT_SECRET;
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      throw new Error("Invalid or expired token", { cause: err });
    }
    console.error("Error verifying answer:", err);
    throw err;
  }

  // Extract common data
  const { id } = decoded;
  const questionDef = MathQuestions.find((q) => q.id === id); // Defined in outer scope
  if (!questionDef) throw new Error("Invalid question ID in token");

  let correctAnswer;
  let format;
  let nextStepToken = null;
  let completed = false;
  let steps = null; // Defined in outer scope

  if (decoded.stepIndex !== undefined) {
    // --- MULTI-STEP LOGIC ---
    const { stepIndex, context } = decoded;

    // Re-run generator to get steps logic
    // We assume generator is pure enough regarding `context` to reproduce `steps` structure
    const dummyGen = questionDef.generator.question(context);
    steps = dummyGen.steps; // Assign to outer scope variable

    const currentStep = steps[stepIndex];

    if (!currentStep) throw new Error("Invalid step index");

    correctAnswer = currentStep.answer(context); // valid
    format = currentStep.answerFormat;

    // Determine next step or completion
    if (steps[stepIndex + 1]) {
      const nextStep = steps[stepIndex + 1];
      const nextPayload = {
        id,
        stepIndex: stepIndex + 1,
        context,
        question: nextStep.display,
        numbers: nextStep.numbers || [], // Pass numbers for frontend replacement
        answerFormat: nextStep.answerFormat,
        inputConfig: nextStep.inputConfig || questionDef.inputConfig,
        description: nextStep.description || questionDef.description || "",
      };
      nextStepToken = jwt.sign(nextPayload, secret, { expiresIn: "1h" });
    } else {
      completed = true;
    }
  } else {
    // --- SINGLE STEP LOGIC ---
    const { numbers } = decoded;
    // questionDef already found in outer scope

    correctAnswer = questionDef.generator.answer(...numbers);
    format = questionDef.answerFormat;
  }

  let isCorrect;

  if (format === "number") {
    isCorrect = checkNumericallyEqual(correctAnswer, userAnswer);
  } else if (format === "set") {
    isCorrect = checkSetEqual(correctAnswer, userAnswer);
  } else if (
    format === "sequence" ||
    format === "sequence_strict" ||
    decoded.id === "arithmetic-division"
  ) {
    isCorrect = checkSequenceEqual(correctAnswer, userAnswer);
  } else if (
    format === "string" ||
    format === "string_set" ||
    (typeof correctAnswer === "string" && correctAnswer.includes("x"))
  ) {
    const requireFactorised = decoded.id === "algebra-cubic-factorisation";
    isCorrect = checkAlgebraicEqualWithStructure(
      correctAnswer,
      userAnswer,
      requireFactorised,
    );
  } else {
    isCorrect =
      String(correctAnswer).trim().toLowerCase() ===
      String(userAnswer).trim().toLowerCase();
  }

  // --- FAIL FAST LOGIC ---
  return {
    correct: isCorrect,
    correctAnswer: String(correctAnswer),
    explanation:
      decoded.stepIndex !== undefined
        ? steps && steps[decoded.stepIndex]
          ? steps[decoded.stepIndex].explanation ||
            questionDef.explanation ||
            null
          : questionDef.explanation || null
        : questionDef.explanation || null,
    accuracy: isCorrect ? 100 : 0,
    userAnswer: userAnswer,
    nextStepToken: isCorrect ? nextStepToken : null, // Only send next token if correct
    completed: isCorrect ? completed : true, // If incorrect, it is completed (failed). If correct, it is completed only if no next step.
  };
};

export default {
  getTopics,
  generateQuestion,
  verifyAnswer,
};
