/**
 * @file AnswerDisplay.jsx
 * @description Displays the correct answer state across varied question formats including MCQ, fill-in-the-blanks, and math short answers.
 * @architecture Presentation component consumed by quiz result views and administrative question previews.
 * @agent_note Ensure answerType normalization accommodates legacy nested formats when adding new question variants.
 */

/**
 * FILE PURPOSE: AnswerDisplay — A versatile component for displaying the "Correct Answer" state.
 *
 * ROLE:
 * Handles the display of correct answers across multiple question formats (MCQ, Fill-in-the-Blanks,
 * Short Answer). It includes normalization logic to handle legacy data formats and various
 * backend response structures.
 *
 * DEPENDENCIES:
 * - styles/Flex: Standard flexbox alignment.
 * - Latex: Renderer for math-heavy short answers.
 * - OptionPreview: Specialized sub-component for rendering MCQ choices with "Correct" highlighting.
 *
 * EXPORTS:
 * - AnswerDisplay (default): The component that resolves and renders the answer block.
 *
 * INTERCONNECTIONS:
 * - Used in QuizResultDisplay to show the user what they missed after a submission.
 * - Consumed by Admin previews to verify question configuration.
 */
import styled from "styled-components";
import { Flex } from "../styles/Flex.style";
import Latex from "./Latex";
import OptionPreview from "./common/OptionPreview";

/* ─── Styled Components ─── */

const SaContainer = styled.div`
  padding: 20px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  strong {
    color: #666;
  }
`;

const SaMathFieldWrapper = styled.div`
  font-size: 24px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
`;

/* ─── Main Component ─── */

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.question - The question entity containing options, type, and answer criteria.
 * @returns {JSX.Element|null} The resolved correct answer presentation element or null if no question is provided.
 */
export default function AnswerDisplay({ question }) {
  if (!question) return null;

  // TYPE RESOLUTION: Normalizes the question type from various possible property paths.
  const answerType =
    question.answerType || question.options?.type || question.type;

  /* ─── MCQ BRANCH ─── */
  if (answerType === "MCQ" || answerType === "mcq") {
    // Normalization: handles both standard MCQ objects and legacy flat arrays.
    const isStandardMcq = !!question.options?.mcq;
    const mcqOptions = isStandardMcq
      ? question.options.mcq
      : question.options || question.answers;

    if (!Array.isArray(mcqOptions)) return <p>Invalid MCQ Options format</p>;

    return (
      <Flex $column style={{ gap: "10px" }}>
        {mcqOptions.map((option, index) => {
          const labels = ["A", "B", "C", "D", "E", "F"];
          const key = labels[index];

          // CORRECTNESS CHECK: Matches by MongoDB ID or label index.
          const idMatch = option._id
            ? option._id === question.correctOption
            : false;
          const labelMatch =
            !option._id &&
            question.correctOption &&
            String(question.correctOption).length === 1
              ? String(question.correctOption) === key
              : false;

          const isCorrect = isStandardMcq
            ? question.correctOption && (idMatch || labelMatch)
            : false;

          // Extract content from Slate JSON, HTML string, or raw string fallback.
          const htmlContent = option.slate || option.html || option;

          return (
            <OptionPreview
              key={key}
              optionKey={key}
              isCorrect={isCorrect}
              htmlContent={htmlContent}
            />
          );
        })}
      </Flex>
    );
  }

  /* ─── FILL-IN-THE-BLANKS / PASSAGE / GRAMMAR BRANCH ─── */
  if (
    answerType === "fillInTheBlanks" ||
    answerType === "passage" ||
    answerType === "grammar" ||
    answerType === "vocabulary"
  ) {
    // Collect answers from multiple possible paths to support varied module schemas.
    const answers =
      question.options && question.options.fillInTheBlanks
        ? question.options.fillInTheBlanks
        : question.correctAnswers || question.answers || [];

    return (
      <SaContainer>
        <strong>
          Correct Answers {answerType === "grammar" ? "" : "(in order)"}:
        </strong>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#ff5722",
            background: "white",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #ffe0b2",
            lineHeight: "1.5",
          }}
        >
          {/* Join multiple correct blanks with commas for a single readable line */}
          {answers.join(", ")}
        </div>
      </SaContainer>
    );
  }

  /* ─── SHORT ANSWER (SA) / MATH BRANCH ─── */
  if (
    answerType === "SA" ||
    question.correctAnswers?.length > 0 ||
    question.correctAnswer
  ) {
    const mainAnswer =
      question.options?.sa ||
      question.correctAnswer ||
      (question.correctAnswers && question.correctAnswers[0]);

    return (
      <SaContainer>
        <strong>Correct Answer:</strong>
        <SaMathFieldWrapper>
          {/* MATH CHECK: If answer contains LaTeX markers, use the LaTeX renderer component. */}
          {typeof mainAnswer === "string" &&
          (mainAnswer.includes("\\") || mainAnswer.includes("$")) ? (
            <Latex>{mainAnswer}</Latex>
          ) : (
            <span>{mainAnswer || "N/A"}</span>
          )}
        </SaMathFieldWrapper>
      </SaContainer>
    );
  }

  /* ─── FALLBACK ─── */
  return (
    <div style={{ padding: "20px", color: "#999", fontStyle: "italic" }}>
      No structured answer data available for type: {answerType || "unknown"}
    </div>
  );
}
