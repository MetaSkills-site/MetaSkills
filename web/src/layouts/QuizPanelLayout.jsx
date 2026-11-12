/**
 * @file QuizPanelLayout.jsx
 * @description Educational module quiz attempt layout managing question fetching, active timer, answer submission, carrot rewards, and review modes.
 * @architecture Serves as the interactive quiz runner orchestrating API calls with question components, error reporting modals, and completion transitions.
 * @agent_note Be cautious with question review state versus unsubmitted state, query cache invalidations for user performance, and timer cleanup on unmount.
 */

/**
 * FILE PURPOSE: Main orchestrator for educational module quizzes.
 * Manages question fetching, timer state, answer submission, and review modes.
 *
 * DEPENDENCIES:
 * - SessionContext: Auth context for progress tracking and secure API headers.
 * - QuestionBlock: Composite component for rendering question text and input options.
 * - QuizResultDisplay: UI component for post-submission feedback and explanations.
 * - Progress: Visual tracker for module completion percentage.
 * - ModuleCompleted: Transition screen shown after the final question of a module.
 *
 * EXPORTS:
 * - QuizPanel (default): Root layout for module attempts (consumed by src/main.jsx).
 *
 * INTERCONNECT:
 * - Implements 'Review Mode' logic by checking for existing 'userResponse' in question data.
 * - Coordinates with '/api/quiz/submit' for real-time grading and carrot awards.
 * - Manages sequential navigation between questions via module IDs.
 */

import { useEffect, useState, useContext, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";
import toast from "react-hot-toast";
import { SessionContext } from "../context/SessionProvider";
import QuestionBlock from "../components/QuestionBlock";
import Progress from "../components/Progress";
import ModuleCompleted from "../components/ModuleCompleted";
import { Flex } from "../styles/Flex.style";
import SplashPage from "../pages/SplashPage";
import QuizResultDisplay from "../components/common/QuizResultDisplay";
import Carrot from "../components/Carrot";
import ReportErrorModal from "../components/common/ReportErrorModal";
import { FaExclamationTriangle } from "react-icons/fa";

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
  font-family: "Segoe UI", sans-serif;
`;

const Nav = styled.nav`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 15px 30px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  z-index: 10;
`;

/**
 * ExitButton: Circle button for returning to the module landing page.
 */
const ExitButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background 0.2s;

  &:hover {
    background: #f0f0f0;
  }

  svg {
    width: 24px;
    height: 24px;
    fill: #666;
  }
`;

const StatsContainer = styled(Flex)`
  width: -moz-fit-content;
  width: fit-content;
  margin: auto;
  gap: 20px;
`;

/**
 * ReportButton: UI trigger for the error reporting modal.
 */
const ReportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ffe0b2;
  padding: 8px 12px;
  border-radius: 20px;
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ffe0b2;
    transform: translateY(-1px);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ProgressText = styled.span`
  font-weight: bold;
  font-size: 0.85rem;
  display: block;
  margin: auto;
  height: -moz-fit-content;
  height: fit-content;
  width: -moz-fit-content;
  width: fit-content;
  color: #888;
  text-align: right;
  font-family: var(--font-primary);
`;

const StyledProgress = styled(Progress)`
  height: 12px;
  width: 200px;
  border-radius: 5px;
  background: #eee;

  > div {
    background: linear-gradient(90deg, #ff9800, #f44336);
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(244, 67, 54, 0.3);
  }
`;

/**
 * TimeContainer: Visual indicator for elapsed time on the current question.
 */
const TimeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff3e0;
  padding: 8px 16px;
  border-radius: 20px;
  color: #e65100;
  font-weight: bold;
  font-family: var(--font-primary);

  svg {
    width: 20px;
    height: 20px;
    fill: #e65100;
  }
`;

const CarrotContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e8f5e9;
  padding: 8px 16px;
  border-radius: 20px;
  color: #2e7d32;
  font-weight: bold;
  font-family: var(--font-primary);

  svg {
    width: 20px;
    height: 20px;
  }
`;

const RightControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ContentPanel = styled.div`
  background: #ffffff;
  height: 70%;
  max-height: calc(100vh - 10px);
  padding: 40px;
  border-radius: 20px;
  overflow-y: auto;
  width: 100%;
  max-width: 1000px;
  margin: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
`;

const ActionButton = styled.button`
  background: linear-gradient(90deg, #e91e63, #ff4800);
  color: white;
  border: none;
  padding: 12px 28px;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  margin: auto;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 24px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  font-family: var(--font-primary);
  box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(233, 30, 99, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

/**
 * Quiz panel layout component that manages module progression, real-time timer tracking, and answer evaluation.
 *
 * @component
 * @returns {JSX.Element} Interactive quiz execution view with header stats, question container, and submission controls.
 */
function QuizPanelLayout() {
  const { moduleId } = useParams();
  const { user, updateUser } = useContext(SessionContext);
  const queryClient = useQueryClient();

  // --- Quiz State ---
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0); // Elapsed time in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isModuleFinished, setIsModuleFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  // --- Statistics & UI State ---
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestionOrder, setCurrentQuestionOrder] = useState(0);
  const [submitCount, setSubmitCount] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Log answer updates for debugging (Development only)
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      console.log("QuizPanel selectedAnswer updated:", selectedAnswer);
    }
  }, [selectedAnswer]);

  /**
   * Effect: Timer Lifecycle.
   * Increments 'timer' state every second while question is active and unsubmitted.
   */
  useEffect(() => {
    if (!loading && !isSubmitted && question) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, isSubmitted, question]);

  /**
   * Effect: Module Initialization.
   * Fetches the first unattempted question for the given module or resumes review.
   */
  useEffect(() => {
    const startQuiz = async () => {
      try {
        const res = await apiClient.post(API_ENDPOINTS.startModule.url, {
          moduleId,
        });
        if (res.data.success) {
          console.log("Fetched Question Data:", res.data);

          let qData = res.data.data;
          let pData = res.data.progress; // Support for legacy response formats
          let tQuestions = 0;

          // Check for consolidated data structure
          if (res.data.data && res.data.data.question) {
            qData = res.data.data.question;
            pData = res.data.data.progress;
            tQuestions = res.data.data.totalQuestions;
          }

          setQuestion(qData);
          setTotalQuestions(tQuestions);

          if (pData) {
            // Update UI position index
            if (
              res.data.data.currentQuestionOrder !== undefined &&
              res.data.data.currentQuestionOrder !== null
            ) {
              setCurrentQuestionOrder(res.data.data.currentQuestionOrder);
            } else if (
              pData &&
              pData.currentQuestionOrder !== undefined &&
              pData.currentQuestionOrder !== null
            ) {
              setCurrentQuestionOrder(pData.currentQuestionOrder);
            }

            // REVIEW MODE LOGIC: If question already answered, show results immediately
            if (pData.status === "completed") {
              setIsSubmitted(true);

              // Restore user's previous response and time recorded
              if (
                res.data.data.userResponse !== undefined &&
                res.data.data.userResponse !== null
              ) {
                setSelectedAnswer(res.data.data.userResponse);
              }
              if (res.data.data.timeTaken !== undefined) {
                setTimer(res.data.data.timeTaken);
              }

              // Mock result object to drive QuizResultDisplay component
              setResult({
                isCorrect: res.data.data.isCorrect,
                explanation: qData.explanation,
                isModuleComplete: !res.data.data.nextQuestionId,
                nextQuestionId: res.data.data.nextQuestionId,
              });
            }
          } else {
            console.warn("Progress data missing in response");
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to start quiz");
      } finally {
        setLoading(false);
      }
    };

    if (user && moduleId) {
      startQuiz();
    }
  }, [user, moduleId]);

  /**
   * formatTime: Formats raw seconds into 'M:SS' format.
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * handleSubmit: Grades the current question.
   * Stops the timer and sends user selection to the backend for real-time validation.
   */
  const handleSubmit = async () => {
    if (selectedAnswer === null || selectedAnswer === undefined) {
      toast.error("Please select an answer");
      return;
    }

    clearInterval(timerRef.current);
    setSubmitting(true);
    const toastId = toast.loading("Submitting answer...");

    try {
      const res = await apiClient.post(API_ENDPOINTS.submitQuizAnswer.url, {
        questionId: question._id,
        answer: selectedAnswer,
        timeTaken: timer,
        moduleId,
      });

      if (res.data.success) {
        setIsSubmitted(true);
        setResult(res.data);
        if (res.data.data.currentQuestionOrder != null) {
          setCurrentQuestionOrder(res.data.data.currentQuestionOrder);
        }

        // Sync global carrot count if returned by the backend
        if (
          res.data.data.carrots !== undefined &&
          res.data.data.carrots !== null
        ) {
          updateUser({ carrots: res.data.data.carrots });
        }

        // Invalidate performance cache so the dashboard progress bar updates immediately
        queryClient.invalidateQueries({ queryKey: ["user-performance"] });

        // Increment submitCount to trigger carrot component re-refresh
        setSubmitCount((prev) => prev + 1);

        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit answer", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * handleNext: Loads the next sequential question.
   * If the module is finished, redirects to completion screen.
   */
  const handleNext = async () => {
    const isComplete =
      result?.data?.isModuleComplete || result?.isModuleComplete;

    if (isComplete) {
      setIsModuleFinished(true);
      return;
    }

    const nextQId = result?.data?.nextQuestionId || result?.nextQuestionId;

    if (nextQId) {
      setLoading(true);
      setIsSubmitted(false);
      setResult(null);
      setSelectedAnswer(null);
      setTimer(0);

      try {
        const res = await apiClient.post(API_ENDPOINTS.getQuestionById.url, {
          id: nextQId,
        });
        if (res.data.success) {
          const nextQData = res.data.data;
          console.log("Next Question Data:", nextQData);

          setQuestion(nextQData);

          // Update progression index
          if (
            nextQData.currentQuestionOrder != null ||
            nextQData.order != null ||
            nextQData.question?.order != null
          ) {
            setCurrentQuestionOrder(
              nextQData.currentQuestionOrder ??
                nextQData.order ??
                nextQData.question?.order,
            );
          }

          // Handle 'Review Mode' for the next question
          if (
            nextQData.userResponse !== undefined &&
            nextQData.userResponse !== null
          ) {
            setSelectedAnswer(nextQData.userResponse);
            setIsSubmitted(true);

            if (nextQData.timeTaken !== undefined) {
              setTimer(nextQData.timeTaken);
            }

            setResult({
              isCorrect: nextQData.isCorrect,
              explanation: nextQData.explanation,
              isModuleComplete: !nextQData.nextQuestionId,
              nextQuestionId: nextQData.nextQuestionId,
            });
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load next question");
      } finally {
        setLoading(false);
      }
    }
  };

  // Rendering States
  if (loading) return <SplashPage />;
  if (isModuleFinished)
    return <ModuleCompleted subject={question?.module?.subject} />;
  if (!question) return <div>No question found</div>;

  const progressPercentage =
    totalQuestions > 0 ? (currentQuestionOrder / totalQuestions) * 100 : 0;

  // Prepare Props for Result Display
  let quizResultProps = null;
  if (isSubmitted && result) {
    const isCorrectRaw =
      result.isCorrect !== undefined
        ? result.isCorrect
        : result.data?.isCorrect;
    const accuracy =
      typeof isCorrectRaw === "number" ? isCorrectRaw : isCorrectRaw ? 100 : 0;
    const correct = accuracy === 100;

    let correctAnswer = result.correctAnswer || result.data?.correctAnswer;
    // Fallback to static question data if submission response lacks the correct answer
    if (!correctAnswer && question.options) {
      if (question.answerType === "MCQ") correctAnswer = question.correctOption;
      else correctAnswer = question.options.sa;
    }

    quizResultProps = {
      correct: correct,
      accuracy: accuracy,
      correctAnswer: correctAnswer,
      explanation: result.explanation || result.data?.explanation,
      carrotsAwarded: result.data?.carrotsAwarded || 0,
      message: result.message || result.data?.message,
    };
  }

  return (
    <Container>
      <Nav>
        <ExitButton to={`/module/${moduleId}`}>
          <svg viewBox="0 0 24 24">
            <path d="M14.121,12,18,8.117A1.5,1.5,0,0,0,15.883,6L12,9.879,8.11,5.988A1.5,1.5,0,1,0,5.988,8.11L9.879,12,6,15.882A1.5,1.5,0,1,0,8.118,18L12,14.121,15.878,18A1.5,1.5,0,0,0,18,15.878Z" />
          </svg>
        </ExitButton>

        <StatsContainer>
          <StyledProgress progress={progressPercentage} />
          <ProgressText>
            {currentQuestionOrder}/{totalQuestions}
          </ProgressText>
        </StatsContainer>

        <RightControlsContainer>
          <TimeContainer>
            <svg viewBox="0 0 24 24">
              <path d="m16.551 12a12.556 12.556 0 0 0 4.406-7.449 3.943 3.943 0 0 0 -.918-3.151 4.017 4.017 0 0 0 -3.039-1.4h-9.995a4.014 4.014 0 0 0 -3.044 1.4 3.94 3.94 0 0 0 -.917 3.158 12.522 12.522 0 0 0 4.401 7.442 12.522 12.522 0 0 0 -4.4 7.444 3.94 3.94 0 0 0 .916 3.156 4.014 4.014 0 0 0 3.044 1.4h9.995a4.017 4.017 0 0 0 3.044-1.4 3.944 3.944 0 0 0 .918-3.156 12.557 12.557 0 0 0 -4.411-7.444zm1.277 8.559a1 1 0 0 1 -.828.441h-10a1 1 0 0 1 -.928-1.374 14.856 14.856 0 0 1 4.6-5.656l.7-.559a1 1 0 0 1 1.245 0l.69.551a15.013 15.013 0 0 1 4.61 5.662 1 1 0 0 1 -.089.935zm-2.479-1.559h-6.7a14.962 14.962 0 0 1 3.271-3.462l.08-.066.071.055a15.3 15.3 0 0 1 3.278 3.473z" />
            </svg>
            <span>{formatTime(timer)}</span>
          </TimeContainer>
          <ReportButton onClick={() => setReportModalOpen(true)}>
            <FaExclamationTriangle /> Report Error
          </ReportButton>
          <CarrotContainer>
            <Carrot
              size="20px"
              showCount={true}
              token={user?.token}
              key={submitCount}
            />
          </CarrotContainer>
        </RightControlsContainer>
      </Nav>

      <ContentPanel>
        {/* Core question rendering engine */}
        <QuestionBlock
          key={question._id}
          question={question}
          options={
            isSubmitted && result && result.data && result.data.options
              ? result.data.options
              : question.options
          }
          explanation={null}
          onAnswerChange={setSelectedAnswer}
          readOnly={isSubmitted}
          selectedAnswer={selectedAnswer}
          isCorrect={
            isSubmitted && result
              ? result.isCorrect !== undefined
                ? result.isCorrect
                : result.data
                  ? result.data.isCorrect
                  : undefined
              : undefined
          }
          correctAnswer={
            isSubmitted && result
              ? result.correctAnswer || result.data?.correctAnswer
              : undefined
          }
          onSubmit={handleSubmit}
        />

        {/* Submit action shown only before grading */}
        {!isSubmitted && (
          <ActionButton
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit"}
          </ActionButton>
        )}

        {/* Result & Explanation panel shown after grading or in review mode */}
        {isSubmitted && result && (
          <QuizResultDisplay
            result={quizResultProps}
            question={question}
            answerType={question.answerType}
            options={result.options || result.data?.options || question.options}
            onNext={handleNext}
            nextLabel={
              result.isModuleComplete || result.data?.isModuleComplete
                ? "Finish Module"
                : "Next Question"
            }
          />
        )}
      </ContentPanel>

      {/* Modal for reporting inaccuracies or UI bugs */}
      {question && (
        <ReportErrorModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          environment="QuizPanel"
        />
      )}
    </Container>
  );
}

export default QuizPanelLayout;
