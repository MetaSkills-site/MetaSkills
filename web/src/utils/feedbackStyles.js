/**
 * @file feedbackStyles.js
 * @description Theme tokens and utility functions for calculating visual state styling (correct, incorrect, partial, selected) across quiz options and input fields.
 * @architecture UI presentation utility layer consumed by OptionCard, QuestionBlock, and Marathon quiz components for consistent answer feedback styling.
 * @agent_note Supports both boolean and percentage-based accuracy scoring; neutral mode is available for word-token selectors.
 */

/**
 * FILE PURPOSE: Centralized utility for defining and retrieving visual feedback styles.
 * Manages color schemes and CSS properties for different answer states (correct, incorrect, partial, etc.).
 *
 * DEPENDENCIES:
 * - None (Pure styling constants and logic)
 *
 * EXPORTS:
 * - FEEDBACK_COLORS: Constant object defining color schemes for various states.
 * - getFeedbackStyle: Logic to derive specific styles based on answer correctness and selection state.
 * - getInlineFeedbackStyle: Simple styles for inline text feedback (e.g., in Fill-in-the-blanks).
 *
 * INTERCONNECT:
 * - Consumed by OptionCard, QuestionBlock, and Marathon quiz components to provide visual cues.
 */

/**
 * Color constants for feedback states
 * Defines background, text color, border, and shadows for consistent UI.
 */
export const FEEDBACK_COLORS = {
  CORRECT: {
    background: "#e8f5e9",
    color: "#2e7d32",
    border: "#4caf50",
    boxShadow: "inset 0 0 0 1px #4caf50, 0 2px 6px rgba(76, 175, 80, 0.2)",
    labelBg: "#4caf50",
    labelColor: "#ffffff",
  },
  INCORRECT: {
    background: "#ffebee",
    color: "#c62828",
    border: "#f44336",
    boxShadow: "0 2px 6px rgba(211, 47, 47, 0.2)",
    labelBg: "#f44336",
    labelColor: "#ffffff",
  },
  PARTIAL: {
    background: "#fff3e0",
    color: "#ef6c00",
    border: "#ff9800",
    boxShadow: "0 2px 6px rgba(255, 152, 0, 0.2)",
    labelBg: "#ff9800",
    labelColor: "#ffffff",
  },
  SELECTED: {
    background: "#e0e0e0ff",
    color: "#616161",
    border: "#616161",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
    labelBg: "#616161",
    labelColor: "#ffffff",
  },
  DEFAULT: {
    background: "white",
    color: "#333",
    border: "#e0e0e0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    labelBg: "#f5f5f5",
    labelColor: "#666666",
  },
  NEUTRAL: {
    background: "rgba(131, 131, 131, 0.07)",
    color: "#656565ff",
    border: "#ddd",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    labelBg: "#eeeeee",
    labelColor: "#777777",
  },
};

/**
 * Get feedback styles based on answer state
 *
 * @param {Object} state - The answer state
 * @param {boolean} state.isSelected - Whether the answer is selected by user
 * @param {boolean|number} state.isCorrect - Correctness: true/false or percentage (0-100)
 * @param {boolean} state.isSubmitted - Whether the answer has been submitted
 * @param {boolean} [state.useNeutral=false] - Use neutral styling for default (e.g., Marathon grammar words)
 * @returns {Object} Style object with backgroundColor, color, borderColor, boxShadow
 */
export function getFeedbackStyle(state) {
  const { isSelected, isCorrect, isSubmitted, useNeutral = false } = state;

  // Not submitted - show selection state only
  if (!isSubmitted) {
    if (isSelected) {
      return {
        backgroundColor: FEEDBACK_COLORS.SELECTED.background,
        color: FEEDBACK_COLORS.SELECTED.color,
        borderColor: FEEDBACK_COLORS.SELECTED.border,
        boxShadow: FEEDBACK_COLORS.SELECTED.boxShadow,
        labelBg: FEEDBACK_COLORS.SELECTED.labelBg,
        labelColor: FEEDBACK_COLORS.SELECTED.labelColor,
      };
    }
    // Default unselected state
    const defaultStyle = useNeutral
      ? FEEDBACK_COLORS.NEUTRAL
      : FEEDBACK_COLORS.DEFAULT;
    return {
      backgroundColor: defaultStyle.background,
      color: defaultStyle.color,
      borderColor: defaultStyle.border,
      boxShadow: defaultStyle.boxShadow,
      labelBg: defaultStyle.labelBg,
      labelColor: defaultStyle.labelColor,
    };
  }

  // Submitted - show correctness feedback

  // Handle percentage-based correctness (fill-in-the-blanks)
  if (typeof isCorrect === "number") {
    if (isCorrect === 100) {
      return {
        backgroundColor: FEEDBACK_COLORS.CORRECT.background,
        color: FEEDBACK_COLORS.CORRECT.color,
        borderColor: FEEDBACK_COLORS.CORRECT.border,
        boxShadow: FEEDBACK_COLORS.CORRECT.boxShadow,
        labelBg: FEEDBACK_COLORS.CORRECT.labelBg,
        labelColor: FEEDBACK_COLORS.CORRECT.labelColor,
      };
    } else if (isCorrect > 0) {
      return {
        backgroundColor: FEEDBACK_COLORS.PARTIAL.background,
        color: FEEDBACK_COLORS.PARTIAL.color,
        borderColor: FEEDBACK_COLORS.PARTIAL.border,
        boxShadow: FEEDBACK_COLORS.PARTIAL.boxShadow,
        labelBg: FEEDBACK_COLORS.PARTIAL.labelBg,
        labelColor: FEEDBACK_COLORS.PARTIAL.labelColor,
      };
    } else {
      return {
        backgroundColor: FEEDBACK_COLORS.INCORRECT.background,
        color: FEEDBACK_COLORS.INCORRECT.color,
        borderColor: FEEDBACK_COLORS.INCORRECT.border,
        boxShadow: FEEDBACK_COLORS.INCORRECT.boxShadow,
        labelBg: FEEDBACK_COLORS.INCORRECT.labelBg,
        labelColor: FEEDBACK_COLORS.INCORRECT.labelColor,
      };
    }
  }

  // Boolean correctness
  if (isCorrect === true) {
    return {
      backgroundColor: FEEDBACK_COLORS.CORRECT.background,
      color: FEEDBACK_COLORS.CORRECT.color,
      borderColor: FEEDBACK_COLORS.CORRECT.border,
      boxShadow: FEEDBACK_COLORS.CORRECT.boxShadow,
      labelBg: FEEDBACK_COLORS.CORRECT.labelBg,
      labelColor: FEEDBACK_COLORS.CORRECT.labelColor,
    };
  } else if (isCorrect === false && isSelected) {
    // Only highlight as incorrect if user selected this wrong answer
    return {
      backgroundColor: FEEDBACK_COLORS.INCORRECT.background,
      color: FEEDBACK_COLORS.INCORRECT.color,
      borderColor: FEEDBACK_COLORS.INCORRECT.border,
      boxShadow: FEEDBACK_COLORS.INCORRECT.boxShadow,
      labelBg: FEEDBACK_COLORS.INCORRECT.labelBg,
      labelColor: FEEDBACK_COLORS.INCORRECT.labelColor,
    };
  }

  // Fallback to default
  const defaultStyle = useNeutral
    ? FEEDBACK_COLORS.NEUTRAL
    : FEEDBACK_COLORS.DEFAULT;
  return {
    backgroundColor: defaultStyle.background,
    color: defaultStyle.color,
    borderColor: defaultStyle.border,
    boxShadow: defaultStyle.boxShadow,
    labelBg: defaultStyle.labelBg,
    labelColor: defaultStyle.labelColor,
  };
}

/**
 * Get inline text styles for correct/incorrect feedback
 * Used for inline blank answers
 *
 * @param {boolean} isCorrect - Whether the answer is correct
 * @returns {Object} Style object for inline text
 */
export function getInlineFeedbackStyle(isCorrect) {
  if (isCorrect) {
    return {
      color: "#2e7d32",
      fontWeight: "bold",
      textDecoration: "underline",
    };
  }
  return {
    color: "#c62828",
    textDecoration: "line-through",
  };
}
