/**
 * @file MarathonQuiz.jsx
 * @description Orchestrates the non-math Marathon quiz lifecycle including question fetching, format routing, and answer verification.
 * @architecture Marathon module controller managing question state, elapsed time tracking, and result submissions.
 * @agent_note Routes question formats to GrammarQuestion, MCQQuestion, or PassageQuestion and syncs awarded carrots with SessionContext.
 */

/**
 * FILE PURPOSE: MarathonQuiz — The primary controller for the non-math Marathon learning modes.
 *
 * ROLE:
 * Manages the high-intensity practice flow for English, Grammar, and Vocabulary.
 * It handles dynamic question generation, multi-format rendering (MCQ, Passage, Grammar),
 * answer verification, accuracy tracking, and error reporting.
 *
 * DEPENDENCIES:
 * - SessionContext: User authentication and token management.
 * - useQuizSubmit: Core hook for verifying answers with the backend.
 * - MarathonLayout: Provides the surrounding shell (timers, exit logic, progress).
 * - Renderers: (GrammarQuestion, MCQQuestion, PassageQuestion) specialized subject views.
 * - ReportErrorModal: Integrated feedback mechanism for specific question issues.
 *
 * EXPORTS:
 * - MarathonQuiz (default): The functional component orchestrating the quiz lifecycle.
 *
 * INTERCONNECTIONS:
 * - Accessed via /marathon/:subCategory routes.
 * - Interacts with /api/passages and /api/vocabulary endpoints.
 */
import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";
import toast from "react-hot-toast";
import { SessionContext } from "../context/SessionProvider";
import SplashPage from "../pages/SplashPage";
import { QuizCard, TextContent, Button } from "./Marathon/MarathonStyles";
import MarathonLayout from "../layouts/MarathonLayout";
import QuizResultDisplay from "./common/QuizResultDisplay";
import GrammarQuestion from "./Marathon/Renderers/GrammarQuestion";
import MCQQuestion from "./Marathon/Renderers/MCQQuestion";
import PassageQuestion from "./Marathon/Renderers/PassageQuestion";
import useQuizSubmit from "../hooks/useQuizSubmit";
import MarathonStatusScreen from "./Marathon/MarathonStatusScreen";
import ReportErrorModal from "./common/ReportErrorModal";

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {"history"|"grammar"|"vocabulary"|string} [props.subCategory="history"] - The active marathon subcategory or domain.
 * @returns {JSX.Element} The rendered marathon quiz view or status/splash screen.
 */
export default function MarathonQuiz({ subCategory = "history" }) {
  const { user, updateUser } = useContext(SessionContext);
  const navigate = useNavigate();
  const {
    submitAnswer,
    submitting,
    result: submissionResult,
    reset: resetSubmission,
  } = useQuizSubmit();

  // Extract primitive values to prevent re-render cascades when updateUser modifies non-auth fields (like carrots)
  const userId = user?._id;

  /* ─── Component State ─── */
  const [loading, setLoading] = useState(true);
  const [questionData, setQuestionData] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [wordBank, setWordBank] = useState([]);
  const [token, setToken] = useState(null);
  const [vocabId, setVocabId] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const lastFetchedCategory = useRef(null);
  const [nextAvailableTime, setNextAvailableTime] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  /**
   * fetchQuestion
   * Generates a new random question based on the current sub-category.
   * Resets all attempt-specific state (timers, answers, correctness).
   */
  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setSubmitted(false);
    resetSubmission();
    setUserAnswers([]);
    setAccuracy(0);
    setCorrectAnswers([]);

    try {
      // Endpoint resolution logic
      let endpoint = API_ENDPOINTS.getPassagesGenerate.url({ type: "passage" });
      if (subCategory === "grammar") {
        endpoint = API_ENDPOINTS.getPassagesGenerate.url({ type: "grammar" });
      } else if (subCategory === "vocabulary") {
        endpoint = API_ENDPOINTS.getVocabularyQuiz.url;
      }

      const res = await apiClient.get(endpoint);

      if (res.data.success) {
        setQuestionData(res.data.data);
        if (res.data.data.token) setToken(res.data.data.token);
        if (res.data.data.vocabId) setVocabId(res.data.data.vocabId);
        if (res.data.data.wordBank) setWordBank(res.data.data.wordBank);

        // INITIALIZE ANSWERS: Branching logic for different input formats.
        if (res.data.data.type === "grammar") {
          setUserAnswers([]); // Selected tokens array
        } else if (res.data.data.type === "mcq") {
          setUserAnswers([""]); // Single selection
        } else if (res.data.data.answers || res.data.data.wordBank) {
          // Fill-in-the-blanks: Count markers in text to size the answer array correctly.
          const blanksCount = (res.data.data.text.match(/\[_\]/g) || []).length;
          setUserAnswers(new Array(blanksCount).fill(""));
        }
        setStartTime(Date.now());
        setElapsedTime(0);
      }
    } catch (err) {
      console.error(err);
      // Handles 403 Daily Limit Reached from the backend for free-tier management.
      const errorMessage = err.response?.data?.message;
      if (
        err.response?.status === 403 &&
        errorMessage === "Daily limit reached"
      ) {
        setLimitReached(true);
        if (err.response.data.nextAvailableTime) {
          setNextAvailableTime(err.response.data.nextAvailableTime);
        }
      } else {
        toast.error("Failed to generate question");
        navigate("/marathon");
      }
    } finally {
      setLoading(false);
    }
  }, [subCategory, userId, navigate, resetSubmission]);

  /**
   * handleAnswerChange
   * Updates user state based on interaction type (Toggle for grammar, value update for input).
   */
  const handleAnswerChange = (index, value) => {
    if (submitted) return;

    if (questionData.type === "grammar") {
      const currentSelected = [...userAnswers];
      const foundIndex = currentSelected.indexOf(value);
      if (foundIndex >= 0) {
        currentSelected.splice(foundIndex, 1);
      } else {
        currentSelected.push(value);
      }
      setUserAnswers(currentSelected);
    } else {
      const newAnswers = [...userAnswers];
      newAnswers[index] = value;
      setUserAnswers(newAnswers);
    }
  };

  /**
   * handleSubmit
   * Serializes current state and communicates with verification endpoints.
   */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    clearInterval(timerInterval);

    // Route submission to correct subject-matter endpoint
    let submitUrl = API_ENDPOINTS.submitQuizResponse.url;
    if (
      subCategory === "vocabulary" ||
      (questionData && questionData.type === "vocabulary")
    ) {
      submitUrl = API_ENDPOINTS.verifyVocabulary.url;
    }

    const payload = {
      userId: userId,
      vocabId: vocabId,
      response:
        questionData?.type === "grammar"
          ? userAnswers.map((a) =>
              String(a)
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
                .trim(),
            )
          : userAnswers,
      timeTaken: elapsedTime,
      isMarathon: true,
      type: subCategory,
    };

    const result = await submitAnswer(submitUrl, payload, {
      idempotent: true,
      headers: {},
    });

    if (result.success) {
      const { accuracy, carrotsAwarded, message, correctAnswers, carrots } =
        result.data;
      setAccuracy(accuracy);
      setCorrectAnswers(correctAnswers || []);
      setSubmitted(true);

      // Sync global carrot count if returned by the backend
      if (carrots !== undefined && carrots !== null) {
        updateUser({ carrots });
      }

      if (carrotsAwarded <= 0) {
        toast(message || `Accuracy: ${accuracy}%`);
      }
    }
  }, [
    submitting,
    timerInterval,
    subCategory,
    questionData,
    userId,
    userId,
    token,
    vocabId,
    userAnswers,
    elapsedTime,
    submitAnswer,
  ]);

  /* ─── Side Effects ─── */

  useEffect(() => {
    // Only trigger initial fetch if we have a user AND we haven't fetched for this user+category yet.
    const identityKey = `${userId}-${subCategory}`;
    if (userId && lastFetchedCategory.current !== identityKey) {
      fetchQuestion();
      lastFetchedCategory.current = identityKey;
    }
  }, [userId, subCategory, fetchQuestion]);

  // TIMER LOGIC: Tracks seconds elapsed for gamification and analytics.
  useEffect(() => {
    if (!loading && !submitted && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    }
  }, [loading, submitted, startTime]);

  // WORD BANK SHUFFLE: Randomizes display order of word bank choices.
  useEffect(() => {
    if (
      questionData &&
      questionData.answers &&
      questionData.answers.length > 0
    ) {
      const bank = [...questionData.answers].sort(() => 0.5 - Math.random());
      setWordBank(bank);
    }
  }, [questionData]);

  // KEYBOARD SHORTCUTS: Support Enter for submission.
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if user is typing in a modal or input
      if (
        document.activeElement &&
        ["TEXTAREA", "INPUT"].includes(document.activeElement.tagName)
      ) {
        return;
      }
      if (reportModalOpen) return;

      if (e.key === "Enter" && !submitted && !submitting && questionData) {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitted, submitting, questionData, handleSubmit, reportModalOpen]);

  /**
   * renderText
   * Dynamic renderer switch that chooses the correct subject-specific view.
   */
  const renderText = () => {
    if (!questionData) return null;

    if (questionData.type === "grammar") {
      return (
        <GrammarQuestion
          questionData={questionData}
          userAnswers={userAnswers}
          submitted={submitted}
          handleAnswerChange={handleAnswerChange}
          onInvalidQuestion={fetchQuestion}
          accuracy={accuracy}
          correctAnswers={correctAnswers}
        />
      );
    }

    if (questionData.type === "mcq") {
      return (
        <MCQQuestion
          questionData={questionData}
          userAnswers={userAnswers}
          submitted={submitted}
          handleAnswerChange={handleAnswerChange}
          accuracy={accuracy}
          correctAnswers={correctAnswers}
        />
      );
    }

    return (
      <PassageQuestion
        questionData={questionData}
        userAnswers={userAnswers}
        submitted={submitted}
        handleAnswerChange={handleAnswerChange}
        wordBank={wordBank}
        correctAnswers={correctAnswers}
      />
    );
  };

  /* ─── Conditional Renders ─── */

  if (limitReached)
    return (
      <MarathonStatusScreen
        timeUntilNext={nextAvailableTime}
        onRefresh={() => window.location.reload()}
      />
    );

  if (loading) return <SplashPage />;

  return (
    <MarathonLayout
      exitPath="/marathon"
      startTime={startTime}
      submitted={submitted}
      elapsedTimeOverride={elapsedTime}
      onReportClick={() => setReportModalOpen(true)}
    >
      <QuizCard>
        <TextContent>{renderText()}</TextContent>

        {!submitted && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Answers"}
            </Button>
          </div>
        )}

        <QuizResultDisplay
          result={
            submissionResult
              ? {
                  ...submissionResult,
                  correct: submissionResult.accuracy === 100,
                }
              : null
          }
          onNext={fetchQuestion}
        />
      </QuizCard>

      {/* ─── Modals ─── */}
      {questionData && (
        <ReportErrorModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          environment={`Marathon - ${subCategory}`}
        />
      )}
    </MarathonLayout>
  );
}
