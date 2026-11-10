/**
 * @file OptionPreview.jsx
 * @description A read-only preview component for question options, typically used in
 * answer keys or result displays to show correctness and content.
 * @dependencies styled-components, ../admin/AdminUtils, react-icons/io5, dompurify
 * @exports OptionPreview, AnswerOptionContainer, AnswerLabel
 * @interconnections Used by QuizResultDisplay and other review screens to visualize individual options.
 */

import styled from "styled-components";
import { HtmlContent } from "../../utils/adminUtils";
import { IoCheckmarkOutline, IoCloseOutline } from "react-icons/io5";
import DOMPurify from "dompurify";
import { FEEDBACK_COLORS } from "../../utils/feedbackStyles";

// Icons for indicating correctness status
const StyledCheckmark = styled(IoCheckmarkOutline)`
  color: #4caf50;
`;

const StyledClose = styled(IoCloseOutline)`
  color: #f44336;
`;

// Container for the option preview with dynamic border and background based on correctness
export const AnswerOptionContainer = styled.div`
  padding: 15px;
  border: ${(props) =>
    props.$isCorrect
      ? `2px solid ${FEEDBACK_COLORS.CORRECT.border}`
      : props.$isIncorrectSelection
        ? `2px solid ${FEEDBACK_COLORS.INCORRECT.border}`
        : `1px solid ${FEEDBACK_COLORS.DEFAULT.border}`};
  border-radius: 12px;
  background: ${(props) =>
    props.$isCorrect
      ? FEEDBACK_COLORS.CORRECT.background
      : props.$isIncorrectSelection
        ? FEEDBACK_COLORS.INCORRECT.background
        : FEEDBACK_COLORS.DEFAULT.background};
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: ${(props) => props.$mb || "0px"};
`;

// Label (e.g., A, B, C) with dynamic colors matching the container status
export const AnswerLabel = styled.span`
  font-weight: 900;
  color: ${(props) =>
    props.$isCorrect
      ? FEEDBACK_COLORS.CORRECT.color
      : props.$isIncorrectSelection
        ? FEEDBACK_COLORS.INCORRECT.color
        : FEEDBACK_COLORS.DEFAULT.color};
  background: ${(props) =>
    props.$isCorrect
      ? FEEDBACK_COLORS.CORRECT.labelBg
      : props.$isIncorrectSelection
        ? FEEDBACK_COLORS.INCORRECT.labelBg
        : FEEDBACK_COLORS.DEFAULT.labelBg};
  padding: 5px 10px;
  border-radius: 8px;
  min-width: 30px;
  text-align: center;
`;

/**
 * Main OptionPreview component.
 * @param {string} optionKey - The key label (e.g., "A", "B").
 * @param {boolean} isCorrect - Whether this option is the correct answer.
 * @param {boolean} isIncorrectSelection - Whether this was incorrectly selected by the user.
 * @param {string} htmlContent - The content of the option (supports HTML).
 * @param {string} mb - Bottom margin.
 */
export default function OptionPreview({
  optionKey,
  isCorrect,
  isIncorrectSelection,
  htmlContent,
  mb = "0px",
}) {
  // logic: Ensure content is sanitized before rendering as HTML to prevent XSS
  const safeContent =
    typeof htmlContent === "string"
      ? DOMPurify.sanitize(htmlContent)
      : htmlContent;

  return (
    <AnswerOptionContainer
      $isCorrect={isCorrect}
      $isIncorrectSelection={isIncorrectSelection}
      $mb={mb}
    >
      <AnswerLabel
        $isCorrect={isCorrect}
        $isIncorrectSelection={isIncorrectSelection}
      >
        {optionKey}
      </AnswerLabel>
      <HtmlContent
        style={{ flex: 1 }}
        html={safeContent}
        imageStyle={{ maxHeight: "150px", width: "auto" }}
      />
      {/* Show appropriate status icon based on correctness/selection */}
      {isCorrect && (
        <StyledCheckmark size={24} role="img" aria-label="Correct option" />
      )}
      {isIncorrectSelection && !isCorrect && (
        <StyledClose size={24} role="img" aria-label="Incorrect option" />
      )}
    </AnswerOptionContainer>
  );
}
