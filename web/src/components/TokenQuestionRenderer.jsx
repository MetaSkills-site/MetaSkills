/**
 * @file TokenQuestionRenderer.jsx
 * @description Decodes JWT-encapsulated dynamic math questions, renders interactive math problems, and manages submission transitions.
 * @architecture Marathon presentation component decoding ephemeral question payloads and delegating interactions to MathQuestion.
 * @agent_note Unpacks JWT tokens using memoized jwtDecode and supports sequential problem chains via nextStepToken responses.
 */

/**
 * FILE PURPOSE: Decode — Decodes and renders math questions encapsulated in JWT tokens.
 *
 * ROLE:
 * Handles ephemeral question data primarily in 'Marathon' and 'Practice' contexts.
 * By using tokens, the client can render complex questions without persistent database IDs
 * for every iteration, supporting dynamic generation.
 *
 * DEPENDENCIES:
 * - jwt-decode: Unpacks question metadata from the provided token prop.
 * - MathQuestion: Sub-renderer for complex math structures and input fields.
 * - useQuizSubmit: Custom hook for managing the asynchronous answer submission lifecycle.
 *
 * EXPORTS:
 * - Decode (default): Component for token-based question rendering.
 *
 * INTERCONNECTIONS:
 * - Consumed by MathMarathonQuiz.jsx.
 * - Implements multi-step transition logic ('nextStepToken') for complex multi-part questions.
 */

import { useState, useContext, useEffect, useMemo } from "react";
import styled from "styled-components";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";

import { SessionContext } from "../context/SessionProvider";
import { Button } from "./Marathon/MarathonStyles";
import MathQuestion from "./Marathon/Renderers/MathQuestion";
import useQuizSubmit from "../hooks/useQuizSubmit";

/* ─── Styled Components ─── */

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  margin-top: 30px;
`;

const ResultMessage = styled.div`
  margin-top: 30px;
  padding: 20px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 12px;
  background: ${(props) => (props.$correct ? "#e8f5e9" : "#ffebee")};
  color: ${(props) => (props.$correct ? "#2e7d32" : "#c62828")};
  border: 1px solid ${(props) => (props.$correct ? "#c8e6c9" : "#ffcdd2")};

  svg {
    width: 24px;
    height: 24px;
  }
`;

const CorrectAnswerText = styled.div`
  margin-top: 10px;
  font-size: 14px;
  color: #666;
  text-align: center;
`;

/* ─── Main Component ─── */

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.children - JWT string encoding math question payload and metadata.
 * @param {Function} [props.onNext] - Callback to advance to the next question.
 * @param {Function} [props.getTimeTaken] - Function returning elapsed time in seconds.
 * @param {boolean} [props.isMarathon=false] - Flag indicating whether component is running in Marathon mode.
 * @param {Function} [props.onNextStep] - Callback receiving nextStepToken for multi-stage math problems.
 * @param {Function} [props.onDecode] - Callback receiving decoded question payload data.
 * @param {Function} [props.onResult] - Callback receiving question submission outcome.
 * @returns {JSX.Element} The rendered token-decoded math question and response interface.
 */
function TokenQuestionRenderer(props) {
  const { children: token, onNext, getTimeTaken } = props;
  const { updateUser } = useContext(SessionContext);
  const { submitAnswer, submitting, result, reset } = useQuizSubmit();

  const [userAnswer, setUserAnswer] = useState("");

  /**
   * Token Decoding Logic
   * Wraps jwtDecode in useMemo to prevent unnecessary re-parses when the component
   * re-renders for non-token reasons (e.g. typing).
   */
  const decoded = useMemo(() => {
    try {
      const result = token ? jwtDecode(token) : null;
      console.log("[Decode] Decoded question data:", result);
      return result;
    } catch (e) {
      console.error("Failed to decode token", e);
      return null;
    }
  }, [token]);

  /**
   * Side Effect: Notify parent of decoded data for error reporting or analytics.
   */
  useEffect(() => {
    if (decoded && props.onDecode) {
      props.onDecode(decoded);
    }
  }, [decoded, props.onDecode]);

  /**
   * Side Effect: Reset local and hook state when a new question (token) arrives.
   */
  useEffect(() => {
    setUserAnswer("");
    reset();
  }, [token, reset]);

  /**
   * Submission Lifecycle
   * Coordinates with the useQuizSubmit hook to verify the answer against the backend.
   */
  const handleSubmit = async () => {
    if (!userAnswer || submitting || !token) return;

    const payload = {
      token: token,
      response: userAnswer,
      timeTaken: getTimeTaken ? getTimeTaken() : 0,
      isMarathon: props.isMarathon || false,
    };

    const res = await submitAnswer("/api/math/answer", payload, {
      idempotent: true,
    });

    if (res.success) {
      const responseData = res.data;

      // Sync global carrot count if returned by the backend
      if (responseData.carrots !== undefined && responseData.carrots !== null) {
        updateUser({ carrots: responseData.carrots });
      }

      /**
       * MULTI-STEP TRANSITION LOGIC
       * If the backend returns a 'nextStepToken', it means the question has multiple
       * dependent parts. We trigger a local transition instead of a full completion.
       */
      if (responseData.nextStepToken) {
        toast.success("Correct! Next step...", { icon: "👏" });

        if (props.onNextStep) {
          props.onNextStep(responseData.nextStepToken);
        } else {
          console.warn(
            "Decode: Received nextStepToken but props.onNextStep is undefined",
          );
        }
      } else {
        // Standard completion: notify parent of final success/failure.
        if (props.onResult) props.onResult(responseData);
      }
    } else {
      // Error handling: hook takes care of generic error toasts.
      if (props.onResult)
        props.onResult({ success: false, error: res.error || null });
    }
  };

  const handleAnswerChange = (idx, val) => {
    setUserAnswer(val);
  };

  // Extract the correct answer from hook result for display in the failure state.
  const correctAnswers = result ? [result.correctAnswer] : [];

  console.log(
    "[Decode] Rendering. Token exists:",
    !!token,
    "Decoded exists:",
    !!decoded,
  );

  if (!decoded) return <div>Invalid Question Token</div>;

  return (
    <div>
      {/* ─── Question Renderer ─── */}
      {decoded && (
        <MathQuestion
          questionData={decoded}
          userAnswer={userAnswer}
          submitted={!!result}
          handleAnswerChange={handleAnswerChange}
          correctAnswers={correctAnswers}
          onKeyDown={(e) => {
            if (e.key === "Enter" && userAnswer && !submitting) {
              handleSubmit();
            }
          }}
        />
      )}

      {/* ─── Action / Feedback UI ─── */}
      {!result ? (
        <InputContainer>
          <Button onClick={handleSubmit} disabled={!userAnswer || submitting}>
            {submitting ? "Checking..." : "Submit Answer"}
          </Button>
        </InputContainer>
      ) : (
        /* Show result feedback only in non-marathon (practice) mode */
        !props.isMarathon && (
          <>
            <ResultMessage $correct={result.correct}>
              {result.correct ? (
                <>
                  <IoCheckmarkCircle size={24} />
                  Correct!
                </>
              ) : (
                <>
                  <IoCloseCircle size={24} />
                  Incorrect
                </>
              )}
            </ResultMessage>
            {!result.correct && (
              <CorrectAnswerText>
                Correct answer: <strong>{result.correctAnswer}</strong>
              </CorrectAnswerText>
            )}
            <InputContainer>
              <Button onClick={onNext}>Next Question</Button>
            </InputContainer>
          </>
        )
      )}
    </div>
  );
}

export default TokenQuestionRenderer;
