/**
 * FILE PURPOSE: MathMarathonQuiz — The primary controller for the Math Marathon practice mode.
 *
 * ROLE:
 * Orchestrates high-intensity math practice. It manages the retrieval of dynamic
 * math questions via tokens, handles multi-step problem solving through the
 * 'Decode' component, and tracks session-level metrics like accuracy and carrot rewards.
 *
 * DEPENDENCIES:
 * - SessionContext: User credentials for authenticated math API requests.
 * - Decode: The logic engine that unpacks and renders tokenized math questions.
 * - MarathonLayout: Provides the timer and progress shell for the quiz.
 * - QuizResultDisplay: Standard post-answer feedback view.
 * - ReportErrorModal: Mechanism for users to flag problematic math questions.
 *
 * EXPORTS:
 * - MathMarathonQuiz (default): The functional component managing the math practice lifecycle.
 *
 * INTERCONNECTIONS:
 * - Accessible via the /marathon/math route.
 * - Interacts with /api/math/question and /api/math/answer endpoints.
 */
import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";
import toast from "react-hot-toast";
import { SessionContext } from "../context/SessionProvider";
import SplashPage from "../pages/SplashPage";
import { QuizCard, TextContent } from "./Marathon/MarathonStyles";
import MarathonLayout from "../layouts/MarathonLayout";
import QuizResultDisplay from "./common/QuizResultDisplay";
import TokenQuestionRenderer from "./TokenQuestionRenderer";
import ReportErrorModal from "./common/ReportErrorModal";

function MathMarathonQuiz() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(SessionContext);

  /* ─── Component State ─── */
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const lastFetchedQuestionId = useRef(null);

  // Error Reporting State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);

  /**
   * fetchQuestion
   * Retrieves a new tokenized math question. Unlike standard modules,
   * marathon questions are often ephemeral and generated on-the-fly.
   */
  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setSubmitted(false);
    setResult(null);

    try {
      const res = await apiClient.get(
        `${API_ENDPOINTS.getMathQuestion.url}?id=${questionId}`,
      );

      if (res.data.success) {
        const newToken = res.data.data.token;
        setToken(newToken);
        setStartTime(Date.now()); // Reset start time for the new question instance
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load question");
      navigate("/marathon/math");
    } finally {
      setLoading(false);
    }
  }, [questionId, user, navigate]);

  /* ─── Side Effects ─── */

  useEffect(() => {
    // Only trigger fetch if token is available, questionId exists, AND we haven't fetched this ID yet.
    // This prevents re-fetching when the token refreshes after carrot rewards.
    const identityKey = `${user?._id}-${questionId}`;
    if (
      user?._id &&
      questionId &&
      lastFetchedQuestionId.current !== identityKey
    ) {
      fetchQuestion();
      lastFetchedQuestionId.current = identityKey;
    }
  }, [user?._id, questionId, fetchQuestion]);

  /**
   * handleResult
   * Processes the verification response from the 'Decode' component.
   * Updates global practice stats and rewards.
   */
  const handleResult = (res) => {
    const { carrotsAwarded, message, accuracy } = res;
    setResult(res);
    setSubmitted(true);

    if (carrotsAwarded <= 0) {
      toast(message || `Accuracy: ${accuracy}%`);
    }
  };

  /**
   * handleNextStep
   * Logic for multi-part questions. Receives a new token representing
   * the next stage of the problem while keeping the session active.
   */
  const handleNextStep = (newToken) => {
    setToken(newToken);
    setSubmitted(false); // Re-enable input for the next step
  };

  const getTimeTaken = () => {
    return startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  };

  if (loading || !token) return <SplashPage />;

  return (
    <MarathonLayout
      exitPath="/marathon/math"
      startTime={startTime}
      submitted={submitted}
      onReportClick={() => setReportModalOpen(true)}
    >
      <QuizCard>
        <TextContent>
          {token && (
            /* 
               The 'Decode' component handles the actual math rendering 
               and submission lifecycle for tokenized data. 
            */
            <TokenQuestionRenderer
              onResult={handleResult}
              onNext={fetchQuestion}
              getTimeTaken={getTimeTaken}
              isMarathon={true}
              onNextStep={handleNextStep}
              onDecode={(data) => setCurrentQuestionData(data)}
            >
              {token}
            </TokenQuestionRenderer>
          )}
        </TextContent>

        {/* Standard feedback display for correct/incorrect answers */}
        <QuizResultDisplay result={result} onNext={fetchQuestion} />
      </QuizCard>

      {/* ─── Modals ─── */}
      {currentQuestionData && (
        <ReportErrorModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          environment="Math Marathon"
        />
      )}
    </MarathonLayout>
  );
}

export default MathMarathonQuiz;
