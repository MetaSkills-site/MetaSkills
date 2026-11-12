/**
 * @file MathQuestion.jsx
 * @description Specialized renderer for marathon math questions handling structured LaTeX/text token arrays and dynamic input delegates.
 * @architecture Marathon question renderer delegating mathematical input capture to InputFactory and expressions to LaTeX viewers.
 * @agent_note Uses QuestionDisplay memoization to prevent expensive LaTeX re-rendering cycles on keystroke updates.
 */

/**
 * FILE PURPOSE: Specialized renderer for mathematical questions within the Marathon module.
 *
 * DEPENDENCIES:
 * - InputFactory: Dynamically selects the appropriate input method (MathLive, Text, etc.).
 * - Latex: Renders LaTeX-coded math expressions.
 *
 * EXPORTS:
 * - MathQuestion: Main renderer for math-heavy questions (consumed by Decode.jsx).
 *
 * INTERCONNECT:
 * - Handles the 'New Structured Format' where questions are arrays of { type, value }.
 * - Uses React.memo for 'QuestionDisplay' to optimize rendering performance by isolating static content.
 */

import { memo } from "react";
import styled from "styled-components";
import InputFactory from "../Inputs/InputFactory";
import Latex from "../../Latex";

const QuestionText = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 40px;
  color: #333;
  line-height: 1.6;
`;

const DescriptionText = styled.div`
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 20px;
  font-style: italic;
`;

// Isolated component to render the math text, preventing rerenders when userAnswer changes
const QuestionDisplay = memo(({ question }) => {
  // console.log("[QuestionDisplay] Received props:", { question });

  if (!question) {
    return null;
  }

  // New Structured Format: question is an array of { type, value }
  if (Array.isArray(question)) {
    return (
      <QuestionText>
        {question.map((part, index) => {
          const style =
            part.layout === "block"
              ? { display: "block", margin: "10px 0" }
              : {};
          if (part.type === "text") {
            return (
              <span key={index} style={style}>
                {part.value}
              </span>
            );
          } else if (part.type === "math") {
            return (
              <span key={index} style={{ ...style, fontSize: "inherit" }}>
                <Latex>{part.value}</Latex>
              </span>
            );
          }
          return null;
        })}
      </QuestionText>
    );
  }

  return null;
});

QuestionDisplay.displayName = "QuestionDisplay";

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.questionData - Question configuration containing math/text token arrays, descriptions, and input options.
 * @param {string} props.userAnswer - Current user input value for the math question.
 * @param {boolean} props.submitted - Whether the answer has been submitted for evaluation.
 * @param {Function} props.handleAnswerChange - Callback function updating user answer.
 * @param {Function} [props.onKeyDown] - Optional keydown handler for enter-to-submit behavior.
 * @returns {JSX.Element} The rendered math question display and input interface.
 */
const MathQuestion = ({
  questionData,
  userAnswer,
  submitted,
  handleAnswerChange,
  onKeyDown,
}) => {
  console.log("[MathQuestion] Rendered with data:", questionData);
  const { question, numbers } = questionData || {};

  const handleOnChange = (value) => {
    handleAnswerChange(0, value);
  };

  return (
    <div>
      <QuestionDisplay question={question} numbers={numbers} />

      {questionData?.description && (
        <DescriptionText>{questionData.description}</DescriptionText>
      )}

      <InputFactory
        questionData={questionData}
        value={userAnswer}
        onChange={handleOnChange}
        disabled={submitted}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

MathQuestion.displayName = "MathQuestion";

export default MathQuestion;
