/**
 * @file QuestionDisplayTabs.jsx
 * @description A multi-tabbed interface for previewing question content, including the question text, correct answers, explanations, and attached context.
 *
 * Dependencies:
 * - styled-components: For layout and container styling.
 * - AdminStyles & AdminUtils: Shared admin UI components and utilities.
 * - AnswerDisplay: Component for rendering non-MCQ answers.
 * - OptionPreview: Component for rendering individual MCQ options with highlighting.
 * - Latex: Utility for rendering mathematical notation.
 *
 * Exports:
 * - QuestionDisplayTabs (default): The main functional component for the tabbed question viewer.
 *
 * Interconnections:
 * - Used within ViewAllQuestions and ErrorReports to provide a detailed look at question data.
 */

import { useState } from "react";
import styled from "styled-components";
import AdminTabs from "./AdminTabs";
import { HtmlContent } from "../../utils/adminUtils";
import AnswerDisplay from "../AnswerDisplay";
import OptionPreview from "../common/OptionPreview";
import Latex from "../Latex";

/**
 * Container for the active tab's content.
 */
const DetailViewContainer = styled.div`
  min-height: 200px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: white;
`;

export default function QuestionDisplayTabs({
  question,
  user,
  userResponse,
  showContext = true,
}) {
  const [activeTab, setActiveTab] = useState("question");

  if (!question) return null;

  /**
   * Internal helper to render the answer section based on the question type (MCQ vs. Open-ended).
   */
  const renderAnswer = () => {
    const answerType =
      question.answerType || question.options?.type || question.type;

    // Logic for rendering Multiple Choice Questions (MCQ)
    if (
      (answerType === "MCQ" || answerType === "mcq") &&
      ((question.options?.mcq && Array.isArray(question.options.mcq)) ||
        (question.options && Array.isArray(question.options)) ||
        (question.answers && Array.isArray(question.answers)))
    ) {
      const isStandardMcq = !!question.options?.mcq;
      const mcqOptions = isStandardMcq
        ? question.options.mcq
        : question.options || question.answers;

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {mcqOptions.map((option, index) => {
            const labels = ["A", "B", "C", "D", "E", "F"];
            const key = labels[index];

            // Determine if the current option is correct based on different data formats.
            const isMarathonCorrect =
              question.correctAnswers &&
              Array.isArray(question.correctAnswers) &&
              typeof htmlContent === "string"
                ? question.correctAnswers.includes(htmlContent) ||
                  question.correctAnswers.includes(option)
                : false;

            const isCorrect = isStandardMcq
              ? option._id === question.correctOption ||
                question.correctOption === key ||
                question.correctOption === index ||
                String(question.correctOption) === String(index)
              : isMarathonCorrect;

            // Check if this specific option was selected by the user in a report context.
            let isUserSelection = false;
            if (userResponse !== undefined && userResponse !== null) {
              if (Array.isArray(userResponse)) {
                isUserSelection =
                  userResponse.includes(option._id) ||
                  userResponse.includes(key);
              } else {
                isUserSelection =
                  userResponse === option._id ||
                  String(userResponse) === String(key) ||
                  String(userResponse) === String(index);
              }
            }

            const isIncorrectSelection = isUserSelection && !isCorrect;
            const htmlContent = option?.slate || option?.html || option;

            return (
              <OptionPreview
                key={key}
                optionKey={key}
                isCorrect={isCorrect}
                isIncorrectSelection={isIncorrectSelection}
                htmlContent={htmlContent}
                mb="10px"
              />
            );
          })}
        </div>
      );
    }

    // Default rendering for non-MCQ (e.g., Short Answer, Vocabulary)
    return (
      <>
        <AnswerDisplay question={question} />
        {/* If user response data is provided (e.g., in an error report), display it below the correct answer. */}
        {userResponse !== undefined && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "#f9f9f9",
            }}
          >
            <h4
              style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}
            >
              User&apos;s Submitted Response:
            </h4>
            {userResponse === null ||
            userResponse === "" ||
            (Array.isArray(userResponse) && userResponse.length === 0) ? (
              <span style={{ fontStyle: "italic", color: "#999" }}>
                The user did not submit a response before reporting this error.
              </span>
            ) : (
              <div
                style={{
                  fontSize: "15px",
                  color: "#d32f2f",
                  fontWeight: "bold",
                }}
              >
                {Array.isArray(userResponse)
                  ? userResponse.join(", ")
                  : String(userResponse)}

                {(question.accuracy !== undefined ||
                  question.isCorrect !== undefined) && (
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      color:
                        question.accuracy === 100 || question.isCorrect
                          ? "#2e7d32"
                          : "#d32f2f",
                      fontWeight: "bold",
                    }}
                  >
                    Result:{" "}
                    {question.accuracy !== undefined
                      ? `${question.accuracy}% Accuracy`
                      : question.isCorrect
                        ? "Correct"
                        : "Incorrect"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Navigation tabs for switching between question views. */}
      {/* Unified AdminTabs for question detail navigation */}
      <AdminTabs
        tabs={[
          { id: "question", label: "Question" },
          { id: "answer", label: "Answer" },
          { id: "explanation", label: "Explanation" },
          ...(showContext && question.context
            ? [{ id: "context", label: "Context" }]
            : []),
          ...(user ? [{ id: "user", label: "User Details" }] : []),
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        layoutId="questionDetailTabIndicator"
        containerStyle={{
          margin: "0 0 20px 0",
          width: "100%",
          justifyContent: "flex-start",
        }}
      />

      {/* Main content area for the active tab. */}
      <DetailViewContainer>
        <div style={{ width: "100%" }}>
          {activeTab === "question" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <HtmlContent
                html={
                  question.question?.slate ||
                  question.question?.html ||
                  (typeof question.question === "string"
                    ? question.question
                    : null) ||
                  question.text ||
                  ""
                }
              />
              {/* Logic for rendering hybrid math/text question parts. */}
              {Array.isArray(question.question) && (
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    lineHeight: "1.6",
                    color: "#333",
                  }}
                >
                  {question.question.map((part, index) => {
                    if (part.type === "text") {
                      return <span key={index}>{part.value}</span>;
                    } else if (part.type === "math") {
                      return (
                        <span key={index} style={{ margin: "0 4px" }}>
                          <Latex>{part.value}</Latex>
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
              {/* Render Word Bank for relevant question types. */}
              {(() => {
                const answerType =
                  question.answerType ||
                  question.options?.type ||
                  question.type;
                if (
                  answerType === "fillInTheBlanks" ||
                  question.type === "passage" ||
                  question.wordBank ||
                  question.type === "vocabulary" ||
                  question.type === "grammar"
                ) {
                  const wordBank =
                    question.wordBank ||
                    (question.type !== "grammar" && question.type !== "mcq"
                      ? question.answers
                      : null);
                  if (
                    wordBank &&
                    Array.isArray(wordBank) &&
                    wordBank.length > 0
                  ) {
                    return (
                      <div style={{ marginTop: "10px" }}>
                        <strong style={{ color: "#555" }}>Word Bank:</strong>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginTop: "8px",
                          }}
                        >
                          {wordBank.map((word, i) => (
                            <span
                              key={i}
                              style={{
                                padding: "6px 12px",
                                background: "#e3f2fd",
                                color: "#1976d2",
                                borderRadius: "16px",
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                }

                return null;
              })()}
            </div>
          )}
          {activeTab === "answer" && renderAnswer()}
          {activeTab === "explanation" &&
            (question.explanation ? (
              <HtmlContent
                html={
                  question.explanation.slate ||
                  question.explanation.html ||
                  question.explanation
                }
              />
            ) : (
              <div
                style={{
                  fontStyle: "italic",
                  color: "#999",
                  padding: "20px",
                }}
              >
                No explanation available for this question.
              </div>
            ))}
          {activeTab === "context" &&
            showContext &&
            (() => {
              const attachment =
                question.contextAttachment || question.contextAttachmentId;
              return attachment ? (
                <div>
                  <h3 style={{ marginBottom: "10px", color: "#555" }}>
                    {attachment?.title}
                  </h3>
                  <HtmlContent
                    html={
                      attachment?.text?.slate ?? attachment?.text?.html ?? ""
                    }
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    fontStyle: "italic",
                    color: "#999",
                  }}
                >
                  No context attached.
                </div>
              );
            })()}
          {activeTab === "user" && user && (
            <div
              style={{
                padding: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px 0",
                  color: "#333",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "5px",
                }}
              >
                User Information
              </h3>
              {/* Grid layout for displaying detailed reporter information. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 1fr",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <strong style={{ color: "#666" }}>User ID:</strong>
                <div>{user._id || "N/A"}</div>
                <strong style={{ color: "#666" }}>Name:</strong>
                <div>{user.fullname || user.name || "N/A"}</div>
                <strong style={{ color: "#666" }}>Email:</strong>
                <div>{user.email || "N/A"}</div>
                {user.role && (
                  <>
                    <strong style={{ color: "#666" }}>Role:</strong>
                    <div style={{ textTransform: "capitalize" }}>
                      {user.role}
                    </div>
                  </>
                )}
                {user.grade && (
                  <>
                    <strong style={{ color: "#666" }}>Grade:</strong>
                    <div>{user.grade}</div>
                  </>
                )}
                {user.createdAt && (
                  <>
                    <strong style={{ color: "#666" }}>Joined:</strong>
                    <div>{new Date(user.createdAt).toLocaleString()}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DetailViewContainer>
    </>
  );
}
