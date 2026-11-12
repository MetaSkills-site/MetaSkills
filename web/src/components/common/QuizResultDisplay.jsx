/**
 * @file QuizResultDisplay.jsx
 * @description Comprehensive post-submission feedback panel showing correctness, correct answers, and AI explanations.
 * @architecture Common assessment feedback layer integrated into quiz containers, coordinating rich text rendering and AI explanations.
 * @agent_note Handles keyboard listener for Enter key to advance to next question; disconnects when modals or inputs are focused.
 */

/**
 * FILE PURPOSE: A comprehensive feedback component displayed after a question is submitted.
 * It shows correctness (Success/Partial/Failure), the ground-truth answer, and an optional explanation.
 *
 * DEPENDENCIES:
 * - SlateRenderer: Renders rich-text (Slate) content for MCQ options and explanations.
 * - MathField: Displays LaTeX/MathQuill formatted answers for Short Answer (SA) questions.
 * - Latex: Utility for rendering basic LaTeX strings (e.g., in Marathon mode).
 * - react-icons: Visual icons for banners and buttons.
 *
 * EXPORTS:
 * - QuizResultDisplay: Default feedback view.
 *
 * INTERCONNECT:
 * - Integrated into QuizPanel.jsx (Modules) and MarathonQuiz.jsx.
 * - Listens for 'Enter' key to facilitate rapid 'next' navigation.
 */

import { useEffect, useState, useContext } from "react";
import styled from "styled-components";
import { FEEDBACK_COLORS } from "../../utils/feedbackStyles";
import Latex from "../Latex";
import SlateRenderer from "../SlateRenderer";
import MathField from "../MathField";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoReturnDownBack,
} from "react-icons/io5";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { StatBox } from "../Marathon/MarathonStyles";
import { SessionContext } from "../../context/SessionProvider";
import { API_ENDPOINTS } from "../../api/requestMap";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  width: 100%;
  max-width: 800px;
  margin: 40px auto 20px auto;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

/**
 * Banner: Top-level visual feedback bar.
 * Colors adapt based on correct, partial, or incorrect status.
 */
const Banner = styled.div`
  width: 100%;
  padding: 20px 24px;
  border-radius: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 16px;
  font-family: var(--font-primary);
  font-size: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;

  ${(props) =>
    props.$type === "correct" &&
    `
    background: ${FEEDBACK_COLORS.CORRECT.background};
    color: ${FEEDBACK_COLORS.CORRECT.color};
    border: 1px solid ${FEEDBACK_COLORS.CORRECT.border};
  `}

  ${(props) =>
    props.$type === "partial" &&
    `
    background: ${FEEDBACK_COLORS.PARTIAL.background};
    color: ${FEEDBACK_COLORS.PARTIAL.color};
    border: 1px solid ${FEEDBACK_COLORS.PARTIAL.border};
  `}
  
  ${(props) =>
    props.$type === "incorrect" &&
    `
    background: ${FEEDBACK_COLORS.INCORRECT.background};
    color: ${FEEDBACK_COLORS.INCORRECT.color};
    border: 1px solid ${FEEDBACK_COLORS.INCORRECT.border};
  `}

  svg {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }
`;

const ContentCard = styled.div`
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Header = styled.h4`
  margin: 0;
  font-family: var(--font-primary);
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(props) => (props.$color ? props.$color : "inherit")};
`;

const MathFieldWrapper = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
`;

const AnswerText = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  padding: 8px 0;
`;

const ExplanationContent = styled.div`
  font-size: 1rem;
  line-height: 1.7;
  color: #444;

  /* Ensure spacing between paragraphs in explanation */
  p {
    margin-bottom: 0.8em;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #e91e63, #ff4800);
  color: white;
  border: none;
  padding: 12px 24px;
  width: -moz-fit-content;
  width: fit-content;
  margin: 10px auto 0 auto;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: var(--font-primary);
  box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(233, 30, 99, 0.4);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 4px 10px rgba(233, 30, 99, 0.3);
  }
`;

const AIExplainButton = styled(Button)`
  background: linear-gradient(135deg, #7c4dff 0%, #b388ff 100%);
  box-shadow: 0 4px 15px rgba(124, 77, 255, 0.3);
  margin: 10px 10px 0 auto;

  &:hover {
    box-shadow: 0 8px 25px rgba(124, 77, 255, 0.4);
  }

  &:active {
    box-shadow: 0 4px 10px rgba(124, 77, 255, 0.3);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

/**
 * EnterHint: Small visual indicator showing that the 'Enter' key triggers navigation.
 */
const EnterHint = styled.span`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.8rem;

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * QuizResultDisplay post-submission feedback container.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.result - Submission outcome details including correctness and correct answer.
 * @param {Object} [props.question] - Question metadata and body.
 * @param {Function} props.onNext - Handler invoked to advance to the subsequent item.
 * @param {string} [props.nextLabel="Next Question"] - Label displayed on progression button.
 * @param {string} [props.answerType] - Question answer type ('MCQ', 'SA', etc.).
 * @param {Object} [props.options] - Available question options for label resolution.
 * @param {boolean} [props.reportModalOpen=false] - Whether error reporting dialog is active.
 * @returns {JSX.Element} Visual feedback banner, explanation view, and navigation actions.
 */
const QuizResultDisplay = ({
  result,
  question,
  onNext,
  nextLabel = "Next Question",
  answerType,
  options,
  reportModalOpen = false,
}) => {
  const { user, backendUrl } = useContext(SessionContext);
  const [aiExplanation, setAiExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState("");

  const handleExplain = async () => {
    if (!question || !user) return;
    setIsExplaining(true);
    setAiExplanation("");
    setExplainError("");

    // Fallback parsing of question text
    const qText =
      question.question ||
      question.slate ||
      question.text ||
      "Explain this question";
    const answerText = result?.correctAnswer || "the correct answer";

    try {
      const { getCsrfToken } = await import("../../services/api");
      const response = await fetch(
        `${backendUrl}${API_ENDPOINTS.genaiExplanation.url}`,
        {
          method: API_ENDPOINTS.genaiExplanation.method || "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-xsrf-token": getCsrfToken() || "",
          },
          body: JSON.stringify({
            questionText:
              typeof qText === "string" ? qText : JSON.stringify(qText),
            answerText:
              typeof answerText === "string"
                ? answerText
                : JSON.stringify(answerText),
            customPrompt:
              "Explain the solution clearly and step-by-step for a student.",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch explanation.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.type === "chunk") {
                  setAiExplanation(
                    (prev) => prev + (parsed.chunk || parsed.text || ""),
                  );
                } else if (parsed.type === "error") {
                  setExplainError(parsed.error);
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (err) {
      setExplainError(err.message || "Something went wrong.");
    } finally {
      setIsExplaining(false);
    }
  };

  /**
   * Global keyboard listener to allow users to press 'Enter' for the next question.
   * Logic prevents triggering when focusing on input fields or when reporting modals are open.
   */
  useEffect(() => {
    if (!result) return; // Only attach listener when result is shown

    const handleKeyDown = (e) => {
      if (reportModalOpen) return;

      // Disable shortcut if the user is typing in a textarea or input field (e.g. Report Error modal)
      if (
        document.activeElement &&
        ["TEXTAREA", "INPUT"].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if (e.key === "Enter") {
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, result, reportModalOpen]);

  if (!result) return null;

  const { correct, correctAnswer, explanation, accuracy, carrotsAwarded } =
    result;

  /**
   * renderCorrectAnswer: Normalizes and renders the 'correct answer' based on the question type.
   * Handles complex logic for MCQ (Object/Array formats), Short Answer (MathField), and Marathon modes.
   */
  const renderCorrectAnswer = () => {
    // 1. Module-specific rendering logic
    if (answerType) {
      if (answerType === "SA") {
        return (
          <MathFieldWrapper>
            <MathField readOnly value={correctAnswer} />
          </MathFieldWrapper>
        );
      }
      if (answerType === "MCQ" && options) {
        const mcqOptions = options.mcq || options;

        // MCQ Format A: Array of objects
        if (Array.isArray(mcqOptions)) {
          const correctOpt = mcqOptions.find(
            (opt) =>
              opt._id === correctAnswer ||
              opt.id === correctAnswer ||
              opt._id === correctAnswer?._id,
          );
          if (correctOpt) {
            return (
              <SlateRenderer
                slate={correctOpt.slate || correctOpt.html || correctOpt.text}
              />
            );
          }
          if (typeof correctAnswer === "number" && mcqOptions[correctAnswer]) {
            const opt = mcqOptions[correctAnswer];
            return <SlateRenderer slate={opt.slate || opt.html || opt.text} />;
          }
        }
        // MCQ Format B: Object with keys A, B, C, D (Legacy/Editor structure)
        else if (mcqOptions && typeof mcqOptions === "object") {
          // Attempt finding by value ID
          if (typeof correctAnswer === "string") {
            const foundOpt = Object.values(mcqOptions).find(
              (opt) =>
                opt &&
                (opt._id === correctAnswer ||
                  opt.id === correctAnswer ||
                  opt._id === correctAnswer?._id),
            );
            if (foundOpt) {
              return (
                <SlateRenderer
                  slate={
                    foundOpt.slate || foundOpt.html || foundOpt.text || foundOpt
                  }
                />
              );
            }
          }

          // Fallback: Map label (A, B, C...) or index to correct option
          const labels = ["A", "B", "C", "D"];
          let labelIndex = -1;

          if (typeof correctAnswer === "number") {
            labelIndex = correctAnswer;
          } else if (typeof correctAnswer === "string") {
            labelIndex = labels.indexOf(correctAnswer);
            if (labelIndex === -1 && !isNaN(parseInt(correctAnswer))) {
              labelIndex = parseInt(correctAnswer);
            }
          }

          if (labelIndex >= 0 && labelIndex < labels.length) {
            const key = labels[labelIndex];
            const opt = mcqOptions[key];
            if (opt) {
              return (
                <SlateRenderer
                  slate={opt.slate || opt.html || opt.text || opt}
                />
              );
            }
          }
        }
      }
    }

    // 2. Marathon-mode / Basic Fallback Logic
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.map((a, i) => (
        <div key={i}>
          <Latex>{String(a)}</Latex>
        </div>
      ));
    }
    // Handle LaTeX strings
    if (
      typeof correctAnswer === "string" &&
      (correctAnswer.includes("\\") || correctAnswer.includes("^"))
    ) {
      return <Latex>{String(correctAnswer)}</Latex>;
    }
    // Basic string/number fallback
    if (
      correctAnswer !== null &&
      correctAnswer !== undefined &&
      correctAnswer !== ""
    ) {
      return <Latex>{String(correctAnswer)}</Latex>;
    }
    return <div>No Correct Answer</div>;
  };

  /**
   * getBannerContent: Selects the appropriate icon, text, and color for the result banner.
   */
  const getBannerContent = () => {
    if (correct) {
      return {
        type: "correct",
        icon: <IoCheckmarkCircle />,
        text: "Correct Answer",
      };
    } else if (accuracy > 0) {
      return {
        type: "partial",
        icon: <IoCheckmarkCircle />,
        text: `Accuracy: ${Math.round(accuracy)}%`,
      };
    } else {
      return {
        type: "incorrect",
        icon: <IoCloseCircle />,
        text: "Incorrect Answer",
      };
    }
  };

  const banner = getBannerContent();

  return (
    <Container>
      <Banner $type={banner.type}>
        {banner.icon} {banner.text}
      </Banner>

      {/* Reward feedback: Shows carrots earned if any */}
      {carrotsAwarded > 0 && (
        <StatBox>
          <div className="value">+{carrotsAwarded}</div>
          <div className="label">Carrots</div>
        </StatBox>
      )}

      {/* Correct Answer Display: Suppressed for FITB (inline) and Correct answers */}
      {!correct &&
        correctAnswer !== undefined &&
        correctAnswer !== null &&
        answerType !== "fillInTheBlanks" && (
          <ContentCard>
            <Header $color="#2e7d32">Correct Answer:</Header>
            <AnswerText>{renderCorrectAnswer()}</AnswerText>
          </ContentCard>
        )}

      {/* Explanation Section: Renders Slate-formatted ground-truth reasoning */}
      {explanation && (
        <ContentCard>
          <Header $color="#555">Explanation:</Header>
          <ExplanationContent>
            <SlateRenderer
              slate={explanation.slate || explanation.html || explanation}
            />
          </ExplanationContent>
        </ContentCard>
      )}

      {/* AI Explanation Stream */}
      {aiExplanation && (
        <ContentCard>
          <Header $color="#7c4dff">
            <FaWandMagicSparkles /> AI Explanation
          </Header>
          <ExplanationContent style={{ whiteSpace: "pre-wrap" }}>
            {aiExplanation}
          </ExplanationContent>
        </ContentCard>
      )}
      {explainError && (
        <ContentCard
          style={{ border: "1px solid red", backgroundColor: "#ffebee" }}
        >
          <Header $color="red">Error</Header>
          <ExplanationContent>{explainError}</ExplanationContent>
        </ContentCard>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {question && !aiExplanation && !isExplaining && (
          <AIExplainButton onClick={handleExplain} disabled={isExplaining}>
            <FaWandMagicSparkles /> AI Explain
          </AIExplainButton>
        )}
        <Button
          onClick={onNext}
          style={{
            marginLeft:
              !question || aiExplanation || isExplaining ? "auto" : "0",
          }}
        >
          {nextLabel}
          <EnterHint>
            <IoReturnDownBack />
          </EnterHint>
        </Button>
      </div>
    </Container>
  );
};

export default QuizResultDisplay;
