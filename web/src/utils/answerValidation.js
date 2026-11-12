/**
 * @file answerValidation.js
 * @description Answer normalization and evaluation engine supporting case/punctuation-insensitive matching, multi-select penalties, and multi-blank percentage scoring.
 * @architecture Validation utility layer bridging question renderers (Marathon, QuizPanel) and client-side scoring logic against expected solution sets.
 * @agent_note Multi-select answers use penalty deduction: percentage = max(0, round((correct - incorrect) / total * 100)).
 */

/**
 * FILE PURPOSE: Centralized engine for validating user-submitted answers against ground truth.
 * Handles normalization, multi-blank grading, and partial scoring for various question types.
 *
 * DEPENDENCIES:
 * - None (Pure utility functions)
 *
 * EXPORTS:
 * - normalizeAnswer: Idempotent string transformation for robust comparison.
 * - isEmptyAnswer: Utility to check for null or whitespace-only answers.
 * - validateAnswer: Core comparison logic for SA/MCQ (consumed by Marathon renderers).
 * - validateFillInTheBlanks: Percentage-based grading for multi-blank questions.
 *
 * INTERCONNECT:
 * - Used by Marathon renderers to provide real-time feedback and score calculation.
 * - Used by quiz components to determine correctness of user input.
 * - Implements punctuation-agnostic and case-insensitive matching by default.
 */

/**
 * Normalize an answer for comparison
 * Removes punctuation, extra whitespace, and converts to lowercase
 *
 * @param {string|number} answer - The answer to normalize
 * @returns {string} Normalized answer
 */
export function normalizeAnswer(answer) {
  if (answer === null || answer === undefined) {
    return "";
  }

  const str = String(answer);

  // Remove common punctuation marks while preserving alphanumeric characters and spaces
  // This ensures that "hello!" matches "hello" and "St. Louis" matches "St Louis"
  const withoutPunctuation = str.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

  // Trim leading/trailing whitespace, convert to lowercase for case-insensitivity,
  // and collapse multiple internal spaces into a single space for consistency.
  return withoutPunctuation.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Check if an answer is considered empty
 *
 * @param {string|number} answer - The answer to check
 * @returns {boolean} True if answer is empty
 */
export function isEmptyAnswer(answer) {
  if (answer === null || answer === undefined) {
    return true;
  }
  return normalizeAnswer(answer) === "";
}

/**
 * Validate a single answer against correct answer(s)
 *
 * @param {string|number|array} userAnswer - The user's answer
 * @param {array|string} correctAnswers - Array of correct answers or single correct answer
 * @param {Object} [questionData] - Optional question data for fallback
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.caseSensitive=false] - Whether to match case-sensitively
 * @param {boolean} [options.exactMatch=false] - Whether to require exact match (no normalization)
 * @returns {Object} Validation result { isCorrect, validAnswers, hasValidation }
 */
export function validateAnswer(
  userAnswer,
  correctAnswers,
  questionData = null,
  options = {},
) {
  const { caseSensitive = false, exactMatch = false } = options;

  // Determine valid answers (from correctAnswers param or fallback to questionData)
  let validAnswers = correctAnswers;

  // Fallback to questionData.answers if no correctAnswers provided
  if (!validAnswers && questionData?.answers) {
    validAnswers = questionData.answers;
  }

  // If still no valid answers, we can't validate
  if (
    !validAnswers ||
    (Array.isArray(validAnswers) && validAnswers.length === 0)
  ) {
    return {
      isCorrect: undefined,
      validAnswers: null,
      hasValidation: false,
    };
  }

  // Ensure validAnswers is an array
  const validAnswersArray = Array.isArray(validAnswers)
    ? validAnswers
    : [validAnswers];

  // Handle multiple user answers (e.g., grammar question with multiple selected words)
  if (Array.isArray(userAnswer)) {
    // For arrays, apply normalization settings to both user answers and valid answers
    const normalizedUserAnswers = userAnswer.map((a) =>
      exactMatch ? a : caseSensitive ? String(a).trim() : normalizeAnswer(a),
    );
    const normalizedValidAnswers = validAnswersArray.map((a) =>
      exactMatch ? a : caseSensitive ? String(a).trim() : normalizeAnswer(a),
    );

    // Calculate partial score based on (correct - incorrect) formula
    // This penalizes selecting wrong options while rewarding correct ones
    const correctCount = normalizedUserAnswers.filter((ua) =>
      normalizedValidAnswers.includes(ua),
    ).length;
    const incorrectCount = normalizedUserAnswers.filter(
      (ua) => !normalizedValidAnswers.includes(ua),
    ).length;

    // Percentage: (correct - incorrect) / total * 100, clamped at floor 0.
    // Example: If 2 correct needed, 1 correct/1 incorrect selected -> (1-1)/2 = 0%
    const percentage = Math.max(
      0,
      Math.round(
        ((correctCount - incorrectCount) / normalizedValidAnswers.length) * 100,
      ),
    );

    return {
      isCorrect: percentage,
      validAnswers: validAnswersArray,
      hasValidation: true,
    };
  }

  // Single answer validation: Apply normalization and check against the set of valid options
  const normalizedUserAnswer = exactMatch
    ? userAnswer
    : caseSensitive
      ? String(userAnswer || "").trim()
      : normalizeAnswer(userAnswer);

  const isCorrect = validAnswersArray.some((validAns) => {
    const normalizedValid = exactMatch
      ? validAns
      : caseSensitive
        ? String(validAns).trim()
        : normalizeAnswer(validAns);
    return normalizedUserAnswer === normalizedValid;
  });

  return {
    isCorrect,
    validAnswers: validAnswersArray,
    hasValidation: true,
  };
}

/**
 * Validate fill-in-the-blank answers
 * Returns percentage correctness
 *
 * @param {array} userAnswers - Array of user's answers for each blank
 * @param {array} correctAnswers - Array of correct answers for each blank
 * @param {Object} [options] - Validation options
 * @returns {number} Percentage correct (0-100)
 */
export function validateFillInTheBlanks(
  userAnswers,
  correctAnswers,
  options = {},
) {
  if (!Array.isArray(userAnswers) || !Array.isArray(correctAnswers)) {
    return 0;
  }

  if (correctAnswers.length === 0) {
    return userAnswers.length === 0 ? 100 : 0;
  }

  let correctCount = 0;
  const totalBlanks = correctAnswers.length;

  for (let i = 0; i < totalBlanks; i++) {
    const validation = validateAnswer(
      userAnswers[i] || "",
      correctAnswers[i],
      null,
      options,
    );
    if (validation.isCorrect === true) {
      correctCount++;
    }
  }

  return Math.round((correctCount / totalBlanks) * 100);
}
