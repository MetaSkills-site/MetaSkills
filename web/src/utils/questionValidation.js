/**
 * FILE PURPOSE: Logic for validating the multi-step question creation process
 * (Question -> Answer -> Explanation).
 *
 * DEPENDENCIES:
 * - slateUtils: Node traversal and blank extraction.
 * - react-hot-toast: Messaging for validation failures.
 *
 * EXPORTS:
 * - validateStep: Aggregator function for per-step validation (consumed by admin/AddQuestions.jsx, admin/EditQuestion.jsx).
 * - sanitizeQuestionOptions: Normalizes option structures before backend persistence.
 *
 * INTERCONNECT:
 * - Traverses Slate JSON nodes to ensure all 'inline-blank' components have assigned correct answers.
 * - Synchronizes internal state between 'blanks' in the editor and 'options' in the answer layer.
 */

import toast from "react-hot-toast";
import { extractBlanks, isEmptySlate } from "./slateUtils";

export const validateQuestionStep = (question) => {
  // question is expected to be the Slate array now
  if (isEmptySlate(question)) {
    return { isValid: false, error: "Please enter a question" };
  }

  // Validate blanks

  // But wait, validation logic regarding empty blanks inside the question content:
  // We need to traverse to find blank nodes and check their data.
  // We can reuse extractBlanks? extractBlanks returns correctAnswer strings.
  // If a blank has no correctAnswer, extractBlanks might skip it or return empty string?
  // Let's implement a specific traversal check here for robustness as before.

  let hasEmptyBlanks = false;
  /**
   * Recursive traversal of Slate nodes to find any unconfigured blank components.
   * Every 'inline-blank' must have a 'correctAnswer' defined in its data.
   */
  const checkBlanks = (nodes) => {
    for (const node of nodes) {
      if (node.type === "inline-blank" || node.type === "blank") {
        const answer = node.correctAnswer || node.data?.correctAnswer;
        if (!answer || answer.trim() === "") {
          hasEmptyBlanks = true;
        }
      }
      // Continue searching down the tree for nested blanks (e.g., in tables or quotes)
      if (node.children) {
        checkBlanks(node.children);
      }
    }
  };
  checkBlanks(question);

  if (hasEmptyBlanks) {
    return {
      isValid: false,
      error: "Please fill in all the blanks in the question editor.",
    };
  }

  return { isValid: true };
};

/**
 * Validates the Answer configuration step.
 * Ensures that either a Short Answer (SA), multiple choices (MCQ), or Fill-in-the-blanks are correctly defined.
 */
export const validateAnswerStep = (question, options, setOptions) => {
  // Extract ground truth from question content to sync with answer layer
  const extractedBlanks = extractBlanks(question);
  const hasBlanks = extractedBlanks.length > 0;

  // Determine the active answer mode based on options type or content structure
  const isFillInTheBlanks =
    options.type === "fillInTheBlanks" ||
    (options.fillInTheBlanks && options.fillInTheBlanks.length > 0) ||
    hasBlanks;

  if (!isFillInTheBlanks && options.type === "SA") {
    // Basic string check for Short Answer
    if (!options.sa || options.sa.trim() === "") {
      return { isValid: false, error: "Please enter the correct answer" };
    }
  } else if (isFillInTheBlanks) {
    let newOptions = null;
    // Auto-sync: If the editor has blanks but the answer state is outdated, update the state
    if (
      hasBlanks &&
      (!options.fillInTheBlanks ||
        JSON.stringify(options.fillInTheBlanks) !==
          JSON.stringify(extractedBlanks))
    ) {
      if (setOptions) {
        setOptions((prev) => ({
          ...prev,
          type: "fillInTheBlanks",
          fillInTheBlanks: extractedBlanks,
        }));
      }
      newOptions = {
        ...options,
        type: "fillInTheBlanks",
        fillInTheBlanks: extractedBlanks,
      };
    }

    // Ensure there is at least one blank if in this mode
    if (
      extractedBlanks.length === 0 &&
      (!options.fillInTheBlanks || options.fillInTheBlanks.length === 0)
    ) {
      return {
        isValid: false,
        error: "Please insert blanks in the question and fill them.",
      };
    }

    // Verify every blank has a non-empty answer string
    const blanksToValidate = hasBlanks
      ? extractedBlanks
      : options.fillInTheBlanks;
    if (blanksToValidate.some((ans) => !ans || ans.trim() === "")) {
      return { isValid: false, error: "Please fill in all the blanks." };
    }

    if (newOptions) {
      return { isValid: true, newOptions };
    }
  } else {
    // Multiple Choice Question (MCQ) Validation
    if (!options.mcq) {
      return { isValid: false, error: "MCQ options are missing" };
    }

    // Check if a correct option index is selected (A, B, C, or D mapped to 0, 1, 2, 3)
    if (options.mcq.correct === null || options.mcq.correct === undefined) {
      return { isValid: false, error: "Please select the correct option" };
    }
    // Ensure all four standard options have content
    const missingOptions = ["A", "B", "C", "D"].filter((key) =>
      isEmptySlate(options.mcq[key]?.slate),
    );
    if (missingOptions.length > 0) {
      return {
        isValid: false,
        error: `Please fill in all options (Missing: ${missingOptions.join(", ")})`,
      };
    }
  }
  return { isValid: true };
};

export const validateExplanationStep = (explanation) => {
  // explanation is expected to be Slate array (or object with slate?)
  // We'll update contexts to use just slate array for explanation too.
  if (isEmptySlate(explanation)) {
    return { isValid: false, error: "Please enter an explanation" };
  }
  return { isValid: true };
};

export const validateStep = (
  step,
  { question, options, explanation, setOptions },
) => {
  let result = { isValid: true };

  // Mapping for both index (0,1,2) and string keys ("question", "answer", "explanation")
  const isQuestion = step === 0 || step === "question";
  const isAnswer = step === 1 || step === "answer";
  const isExplanation = step === 2 || step === "explanation";

  if (isQuestion) {
    result = validateQuestionStep(question);
  } else if (isAnswer) {
    result = validateAnswerStep(question, options, setOptions);
  } else if (isExplanation) {
    result = validateExplanationStep(explanation);
  }

  if (!result.isValid && result.error) {
    toast.error(result.error);
  }

  return result.isValid;
};

export const sanitizeQuestionOptions = (answerType, currentOptions) => {
  // Clone to avoid mutation of top-level properties
  // However, for MCQ transformation we create a new structure
  const type = answerType || currentOptions.type;

  // Base sanitized object
  const sanitized = {
    type: type,
    sa: "",
    fillInTheBlanks: [],
    mcq: undefined, // default to undefined as per schema preference
  };

  if (type === "MCQ") {
    // Transform { A, B, C, D } to [ { ...A }, { ...B }, { ...C }, { ...D } ]
    // Ensure strictly 4 elements for A, B, C, D
    const labels = ["A", "B", "C", "D"];
    const mcqArray = labels.map((label) => {
      const opt = currentOptions.mcq?.[label];
      return {
        slate: opt?.slate || null,
        // html removed
      };
    });
    sanitized.mcq = currentOptions.mcq?.extras
      ? [...mcqArray, ...currentOptions.mcq.extras]
      : mcqArray;
    // Ensure others are empty
    sanitized.sa = "";
    sanitized.fillInTheBlanks = [];
  } else if (type === "fillInTheBlanks") {
    sanitized.fillInTheBlanks = currentOptions.fillInTheBlanks || [];
    // Ensure others are empty
    sanitized.mcq = undefined; // or null, but undefined removes key usually
    sanitized.sa = "";
  } else {
    // SA
    sanitized.sa = currentOptions.sa || "";
    // Ensure others are empty
    sanitized.mcq = undefined;
    sanitized.fillInTheBlanks = [];
  }
  return sanitized;
};
