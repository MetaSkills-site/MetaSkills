/**
 * @file InlineBlankFeedback.jsx
 * @description Inline feedback component rendering correctness styles and diff arrows for fill-in-the-blank questions.
 * @architecture Shared UI element within question exercise renderers for inline post-submission evaluation.
 * @agent_note Defaults to case-insensitive comparison if the isCorrect boolean override is not explicitly passed.
 */

/**
 * FILE PURPOSE: InlineBlankFeedback — Displays visual feedback for fill-in-the-blank questions.
 *
 * ROLE:
 * Provides immediate, granular feedback on user input for specific blanks.
 * Shows correct answers in green (underlined) and incorrect attempts in red (strikethrough)
 * with the correct alternative following an arrow.
 *
 * DEPENDENCIES:
 * - ../../utils/feedbackStyles: Centralized utility for color/text decoration constants.
 *
 * EXPORTS:
 * - InlineBlankFeedback (default): The component rendering the colored feedback span.
 *
 * INTERCONNECTIONS:
 * - Extensively used by question renderers (Grammar, Passage) to show results
 *   after submission without reloading the entire question block.
 */
import { getInlineFeedbackStyle } from "../../utils/feedbackStyles";

/**
 * InlineBlankFeedback component rendering inline result feedback.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} [props.userAnswer] - User submitted answer string.
 * @param {string} [props.correctAnswer] - Expected canonical answer string.
 * @param {boolean} [props.isCorrect] - Explicit correctness flag override.
 * @returns {JSX.Element} Color-coded inline feedback span.
 */
export default function InlineBlankFeedback({
  userAnswer,
  correctAnswer,
  isCorrect,
}) {
  // Normalize inputs for comparison
  const userAns = (userAnswer || "").trim();
  const correctAns = (correctAnswer || "").trim();

  // Determine correctness logic
  // Case-insensitive comparison is the default if no explicit 'isCorrect' override is provided.
  const isAnswerCorrect =
    isCorrect !== undefined
      ? isCorrect
      : userAns.toLowerCase() === correctAns.toLowerCase();

  if (isAnswerCorrect) {
    // SUCCESS STATE: Show only the correct answer with "correct" styling (green + underline).
    return (
      <span
        style={{
          ...getInlineFeedbackStyle(true),
          margin: "0 4px",
        }}
      >
        {correctAns}
      </span>
    );
  }

  // FAILURE STATE: Show the user's attempt (red + strikethrough) followed by the correct answer.
  return (
    <span style={{ margin: "0 4px" }}>
      <span style={getInlineFeedbackStyle(false)}>{userAns || "(empty)"}</span>
      <span style={{ marginLeft: "6px", marginRight: "2px" }}>→</span>
      <span
        style={{
          ...getInlineFeedbackStyle(true),
          marginLeft: "2px",
        }}
      >
        {correctAns}
      </span>
    </span>
  );
}
