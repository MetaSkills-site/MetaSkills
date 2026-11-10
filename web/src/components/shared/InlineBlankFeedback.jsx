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
