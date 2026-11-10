/**
 * @file QuestionBlock.jsx
 * @description The primary component for rendering a quiz question to the user.
 * It handles multiple question formats (MCQ, SA, Fill-in-the-blanks), manages user input,
 * and displays optional context passages.
 *
 * @dependencies
 * - axios: For fetching context attachment data.
 * - dompurify: For sanitizing HTML content before rendering.
 * - react: For state and effect hooks.
 * - MathField: For mathematical input in Short Answer questions.
 * - SlateRenderer: For rendering rich text from Slate JSON.
 * - OptionsGrid: For rendering multiple-choice options.
 *
 * @exports QuestionBlock (default)
 * @interconnections Used in QuizPanel and MarathonQuiz to present questions to the student.
 */

import DOMPurify from "dompurify";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";
import { useEffect, useState, useRef, useMemo, useContext } from "react";
import MathField from "./MathField";
import styled from "styled-components";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { Flex } from "../styles/Flex.style";
import { SessionContext } from "../context/SessionProvider";
import { StyledBlankInput } from "./admin/AdminStyles";

import InlineBlankFeedback from "./shared/InlineBlankFeedback";
import SlateRenderer from "./SlateRenderer";
import OptionsGrid from "./common/OptionsGrid";

const BlockContainer = styled.div`
  width: 100%;
  font-family: var(--font-primary);
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  font-weight: 400;

  img {
    max-width: 100%;
    border-radius: 8px;
    margin: 20px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ContextContainer = styled.div`
  margin-bottom: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
`;

const ContextHeader = styled.div`
  padding: 12px 16px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #555;
  transition: background 0.2s;

  &:hover {
    background: #f1f3f5;
  }
`;

const ContextContent = styled.div`
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
  font-size: 1rem;
`;

const QuestionText = styled.div`
  margin-bottom: 30px;
  font-size: 1.2rem;
  color: #2c3e50;
  font-weight: 400;

  strong,
  b {
    font-weight: 700;
  }
`;

function QuestionBlock({
  question,
  options,
  onAnswerChange,
  selectedAnswer,
  readOnly,
  isCorrect,
  correctAnswer,
  onSubmit,
}) {
  const { user } = useContext(SessionContext);
  const [internalSelected, setInternalSelected] = useState(null);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [contextData, setContextData] = useState(null);

  // Determine if state is controlled externally or maintained internally
  const isControlled = selectedAnswer !== undefined;
  const currentSelection = isControlled ? selectedAnswer : internalSelected;

  const answerType = question?.answerType || options?.type;

  // Prepare Slate Content from various possible backend formats
  const rawContent = question?.slate || question?.question?.slate;
  let slateContent = null;

  if (typeof rawContent === "string") {
    try {
      slateContent = JSON.parse(rawContent);
    } catch (e) {
      console.error("Failed to parse slate content", e);
    }
  } else {
    slateContent = rawContent;
  }

  // Effect to fetch and populate context (passage) data if a context ID is attached to the question
  useEffect(() => {
    const fetchContext = async () => {
      if (!question?.contextAttachmentId) {
        setContextData(null);
        return;
      }

      // If data is already hydrated, use it; otherwise fetch from API
      if (typeof question.contextAttachmentId === "object") {
        setContextData(question.contextAttachmentId);
      } else if (typeof question.contextAttachmentId === "string") {
        try {
          if (user?.token) {
            const res = await apiClient.get(
              API_ENDPOINTS.getContextAttachment.url({
                id: question.contextAttachmentId,
              }),
            );
            setContextData(res.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch context attachment", error);
        }
      }
    };

    fetchContext();
  }, [question?.contextAttachmentId]);

  const mathFieldRef = useRef(null);

  /**
   * Handles changes in mathematical input (Short Answer).
   */
  const handleMathLiveChange = (value) => {
    const valStr = value === null || value === undefined ? "" : String(value);

    if (onAnswerChange) {
      onAnswerChange(valStr);
    }

    if (!isControlled) {
      setInternalSelected(valStr);
    }
  };

  /**
   * Handles option selection in MCQ mode.
   */
  const handleOptionClick = (key) => {
    if (readOnly) return;
    if (isControlled) {
      if (onAnswerChange) onAnswerChange(key);
    } else {
      setInternalSelected(key);
      if (onAnswerChange) onAnswerChange(key);
    }
  };

  /**
   * Defines custom renderers for rich text nodes, specifically for "inline-blank" types.
   * This allows the Slate renderer to inject live inputs or feedback markers into the text.
   */
  const customRenderers = useMemo(() => {
    if (!slateContent) return {};

    return {
      "inline-blank": (node) => {
        const currentBlankIndex =
          node._blankIndex !== undefined ? node._blankIndex : 0;

        const userAnswer = Array.isArray(currentSelection)
          ? currentSelection[currentBlankIndex] || ""
          : "";

        // In readOnly mode (after submission), show correct/incorrect feedback
        if (readOnly) {
          const correctAnswers = options?.fillInTheBlanks || [];
          const correctAnswer = correctAnswers[currentBlankIndex]?.trim() || "";

          return (
            <InlineBlankFeedback
              key={`feedback-${currentBlankIndex}`}
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
            />
          );
        }

        // In interactive mode, show a text input for the user to fill the blank
        return (
          <StyledBlankInput
            key={`input-${currentBlankIndex}`}
            type="text"
            value={userAnswer}
            onChange={(e) => {
              const newVal = e.target.value;
              const newAnswers = Array.isArray(currentSelection)
                ? [...currentSelection]
                : [];
              while (newAnswers.length <= currentBlankIndex)
                newAnswers.push("");
              newAnswers[currentBlankIndex] = newVal;

              if (isControlled) {
                if (onAnswerChange) onAnswerChange(newAnswers);
              } else {
                setInternalSelected(newAnswers);
                if (onAnswerChange) onAnswerChange(newAnswers);
              }
            }}
          />
        );
      },
    };
  }, [
    slateContent,
    currentSelection,
    readOnly,
    options,
    isControlled,
    onAnswerChange,
  ]);

  return (
    <BlockContainer>
      {/* Context/Passage Section */}
      {contextData && (
        <ContextContainer>
          <ContextHeader onClick={() => setContextExpanded(!contextExpanded)}>
            <Flex style={{ gap: "10px", alignItems: "center" }}>
              <span>{contextData.title}</span>
            </Flex>
            {contextExpanded ? <IoIosArrowDown /> : <IoIosArrowForward />}
          </ContextHeader>
          {contextExpanded && (
            <ContextContent>
              <SlateRenderer slate={contextData.text?.slate} />
            </ContextContent>
          )}
        </ContextContainer>
      )}

      {/* Render Question Text for non-FillInTheBlanks types (SA, MCQ) */}
      {answerType !== "fillInTheBlanks" &&
        (slateContent || question?.html || question?.question?.html) && (
          <QuestionText>
            {slateContent ? (
              <SlateRenderer slate={slateContent} />
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    question?.html || question?.question?.html || "",
                  ),
                }}
              />
            )}
          </QuestionText>
        )}

      {/* Answer Input Section: Varies based on answerType */}
      <Flex $column={!(answerType === "SA")}>
        {answerType === "SA" ? (
          <MathField
            ref={mathFieldRef}
            placeholder="\text{Enter your answer}"
            value={currentSelection || ""}
            onChange={handleMathLiveChange}
            status={
              readOnly
                ? isCorrect === true
                  ? "success"
                  : isCorrect === false
                    ? "error"
                    : undefined
                : undefined
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !readOnly && onSubmit) {
                e.preventDefault();
                onSubmit();
              }
            }}
            disabled={readOnly}
            autoFocus={!readOnly}
            style={{
              opacity: readOnly ? 0.6 : 1,
            }}
          />
        ) : answerType === "fillInTheBlanks" ? (
          <div style={{ lineHeight: "2.5", fontSize: "1.1rem" }}>
            {(() => {
              if (!slateContent) return null;

              // Pre-process the Slate tree to assign incremental indices to inline-blanks
              // so they can be mapped correctly to the answers array.
              let globalBlankIndex = 0;

              const indexBlanks = (nodes) => {
                if (!Array.isArray(nodes)) return nodes;
                return nodes.map((node) => {
                  if (!node) return node;
                  const newNode = { ...node };

                  if (newNode.type === "inline-blank") {
                    newNode._blankIndex = globalBlankIndex++;
                  }

                  if (newNode.children) {
                    newNode.children = indexBlanks(newNode.children);
                  }
                  return newNode;
                });
              };

              const contentToRender = Array.isArray(slateContent)
                ? indexBlanks(slateContent)
                : indexBlanks([slateContent]);

              return (
                <SlateRenderer
                  slate={contentToRender}
                  customRenderers={customRenderers}
                />
              );
            })()}
          </div>
        ) : (
          <Flex $column style={{ width: "100%", height: "fit-content" }}>
            <OptionsGrid
              options={options}
              selectedAnswer={currentSelection}
              correctAnswer={correctAnswer || question?.correctOption}
              readOnly={readOnly}
              isSubmitted={readOnly}
              onSelect={handleOptionClick}
            />
          </Flex>
        )}
      </Flex>
    </BlockContainer>
  );
}

export default QuestionBlock;
