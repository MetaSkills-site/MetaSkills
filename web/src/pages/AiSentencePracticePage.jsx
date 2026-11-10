/**
 * FILE PURPOSE: Alternative Vocabulary Practice module with AI evaluation.
 * Similar to MarathonSentencePracticePage but utilizes a non-streaming API request pattern for sentence grading.
 *
 * DEPENDENCIES:
 * - MarathonLayout: Standardized exercise wrapper.
 * - Spell: Interactive word display component.
 * - SessionContext: Global user session and auth token provider.
 * - api.js: Service for backend communication.
 *
 * EXPORTS:
 * - AiSentencePracticePage (default): Component for the Marrc route.
 *
 * INTERCONNECT:
 * - Fetches random vocabulary words from /api/vocabulary/random.
 * - Submits user sentences to /api/genai/sentences/evaluate for batch AI feedback.
 */

import { useState, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoRefresh,
  IoHourglassOutline,
  IoHomeOutline,
  IoReturnDownBack,
} from "react-icons/io5";
import { FaPaperPlane } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { useMedia } from "react-use";
import ReactMarkdown from "react-markdown";

import api from "../services/api";
import MarathonStatusScreen from "../components/Marathon/MarathonStatusScreen";
import AudioWord from "../components/AudioWord";
import MarathonLayout from "../layouts/MarathonLayout";
import ReportErrorModal from "../components/common/ReportErrorModal";
import {
  QuizCard,
  Button,
  ResultCardStyle,
  ResultBanner,
  BaseMarathonInput,
  ActionButton,
} from "../components/Marathon/MarathonStyles";

// --- Animations ---

const shimmer = keyframes`
  0% { filter: hue-rotate(0deg); background-position: -200% 0; }
  100% { filter: hue-rotate(45deg); background-position: 200% 0; }
`;

const sparklePulse = keyframes`
  0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); color: white; }
  50% { transform: scale(1.3) rotate(15deg); filter: drop-shadow(0 0 8px rgba(255,255,255,1)); color: #ffeb3b; }
  100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); color: white; }
`;

// --- Styled Components ---

/**
 * EvaluateButton: Action button with hue-rotating shimmer effect during processing.
 */
const EvaluateButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 10px;

  ${(props) =>
    props.$isEvaluating &&
    css`
      background: linear-gradient(
        90deg,
        var(--color-primary, #ff5722),
        var(--color-accent, #ff9800),
        var(--color-secondary, #e91e63),
        var(--color-primary, #ff5722)
      );
      box-shadow: var(--shadow-lg, 0 10px 25px rgba(255, 83, 141, 0.6));
      background-size: 300% auto;
      animation: ${shimmer} 1.5s linear infinite;

      &:hover {
        box-shadow: var(--shadow-lg, 0 10px 25px rgba(255, 83, 141, 0.6));
      }

      svg {
        animation: ${sparklePulse} 1s ease-in-out infinite;
      }
    `}
`;

const WordDisplayBox = styled.div`
  background: #f0f7ff;
  border: 1px solid #cce4fc;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  margin-bottom: 30px;
`;

const WordText = styled.h2`
  font-size: 42px;
  font-weight: 800;
  color: var(--color-primary, #ff5722);
  margin: 0;
  letter-spacing: 1px;
`;

const InputSection = styled.div`
  margin-bottom: 30px;
  width: 100%;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main, #333);
  margin-bottom: 12px;
`;

/**
 * SentenceInput: Textarea for user-written sentences.
 */
const SentenceInput = styled(BaseMarathonInput).attrs({ as: "textarea" })`
  width: 100%;
  min-height: 120px;
  resize: vertical;
  text-align: left;
`;

const ErrorList = styled.ul`
  margin: 0 0 20px 0;
  padding-left: 20px;
  color: #d32f2f;
  font-weight: 500;

  li {
    margin-bottom: 8px;
  }
`;

const BetterVersionBox = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #eee;
  margin-top: 20px;

  h4 {
    margin: 0 0 10px 0;
    color: #555;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  p {
    margin: 0;
    font-size: 18px;
    color: #333;
    font-weight: 500;
  }
`;

const FeedbackText = styled.div`
  font-size: 16px;
  color: #444;
  line-height: 1.6;
`;

const NextWordButton = styled(ActionButton)`
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export default function AiSentencePracticePage() {
  const navigate = useNavigate();

  // --- Core State ---
  const [wordData, setWordData] = useState(null);
  const [isLoadingWord, setIsLoadingWord] = useState(true);
  const [sentence, setSentence] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitCount, setSubmitCount] = useState(0);

  // --- Timing State ---
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // --- Accessibility ---
  const prefersReducedMotion = useMedia("(prefers-reduced-motion: reduce)");

  /**
   * fetchRandomWord: Loads a target word for the practice session.
   */
  const fetchRandomWord = useCallback(async () => {
    setIsLoadingWord(true);
    setResult(null);
    setSentence("");
    setErrorMsg("");
    setStartTime(null);
    setElapsedTime(0);
    try {
      const response = await api.get("/api/vocabulary/random", {});

      if (response.data.success && response.data.isEmptyState) {
        setWordData("EMPTY_STATE");
      } else {
        setWordData(response.data.data);
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error("Failed to fetch word:", error);
      const errorMessage = error.response?.data?.message || "";
      setErrorMsg(
        errorMessage || "Could not load a word. Please check your connection.",
      );
    } finally {
      setIsLoadingWord(false);
    }
  }, []);

  useEffect(() => {
    // Proceed with fetching
    fetchRandomWord();
  }, [fetchRandomWord]);

  /**
   * Effect: Tracks elapsed time until submission.
   */
  useEffect(() => {
    let interval;
    if (!isLoadingWord && !result && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoadingWord, result, startTime]);

  /**
   * Effect: Keyboard listener for 'Enter' progression.
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (result && e.key === "Enter") {
        fetchRandomWord();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, fetchRandomWord]);

  /**
   * handleEvaluate: Submits the sentence for batch AI grading (non-streaming).
   */
  const handleEvaluate = async () => {
    if (!sentence.trim() || !wordData) return;

    setIsEvaluating(true);
    setErrorMsg("");

    try {
      const response = await api.post("/api/genai/sentences/evaluate", {
        word: wordData.word,
        sentence: sentence.trim(),
        timeTaken: elapsedTime,
      });

      if (response.data.success) {
        setResult(response.data.data);
        setSubmitCount((prev) => prev + 1);
      } else {
        setErrorMsg("Failed to evaluate sentence.");
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      setErrorMsg("An error occurred during evaluation. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // EMPTY_STATE view
  if (wordData === "EMPTY_STATE") {
    return (
      <MarathonStatusScreen
        icon={<IoHourglassOutline size={48} />}
        title="No Words Ready!"
        message={
          "Words appear here once you've practiced them enough in the Learn section.\n\nAlready practiced some? After you use a word in a sentence, it takes a short break so your brain has time to absorb it. Check back tomorrow!"
        }
        buttonIcon={<IoHomeOutline size={20} />}
        buttonText="Go to Learn Words"
        buttonAction={() => navigate("/marathon/english/vocabulary")}
      />
    );
  }

  return (
    <MarathonLayout
      exitPath="/marathon/english"
      startTime={startTime}
      submitted={result !== null}
      submitCount={submitCount}
      elapsedTimeOverride={elapsedTime}
      onReportClick={() => setShowErrorModal(true)}
    >
      <QuizCard>
        {isLoadingWord ? (
          <WordDisplayBox>
            <WordText style={{ color: "#aaa" }}>Loading word...</WordText>
          </WordDisplayBox>
        ) : wordData ? (
          <motion.div
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
            }
          >
            {/* Target Word Section */}
            <WordDisplayBox>
              <WordText>
                <AudioWord>{wordData.word}</AudioWord>
              </WordText>
            </WordDisplayBox>

            {/* User Input Section */}
            <InputSection>
              <InputLabel>
                Write a sentence using the word &quot;{wordData.word}&quot;:
              </InputLabel>
              <SentenceInput
                placeholder="Type your sentence here..."
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                disabled={isEvaluating || result !== null}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isEvaluating && !result && sentence.trim()) {
                      handleEvaluate();
                    }
                  }
                }}
              />
            </InputSection>

            {errorMsg && (
              <p
                style={{
                  color: "#d32f2f",
                  fontWeight: "600",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                {errorMsg}
              </p>
            )}

            {/* Submission Trigger */}
            {!result && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <EvaluateButton
                  onClick={handleEvaluate}
                  disabled={!sentence.trim() || isEvaluating}
                  $isEvaluating={isEvaluating}
                >
                  {isEvaluating ? (
                    <>
                      <FaWandMagicSparkles />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      Check Sentence <FaPaperPlane />
                    </>
                  )}
                </EvaluateButton>
              </div>
            )}

            {/* Evaluation Results Display */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 20 }
                  }
                  animate={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.95 }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.1 }
                      : { duration: 0.4, ease: "easeOut" }
                  }
                >
                  <ResultCardStyle>
                    <ResultBanner $correct={result.accuracy >= 80}>
                      {result.accuracy >= 80 ? (
                        <IoCheckmarkCircle />
                      ) : (
                        <IoCloseCircle />
                      )}
                      {result.accuracy >= 80
                        ? `Perfect Usage! (${result.accuracy}%)`
                        : `Needs Improvement (${result.accuracy}%)`}
                    </ResultBanner>

                    {!(result.accuracy >= 80) &&
                      result.errors &&
                      result.errors.length > 0 && (
                        <ErrorList>
                          {result.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ErrorList>
                      )}

                    <FeedbackText>
                      <ReactMarkdown>{result.feedback}</ReactMarkdown>
                    </FeedbackText>

                    {!(result.accuracy >= 80) && result.better_version && (
                      <BetterVersionBox>
                        <h4>Suggested Version</h4>
                        <ReactMarkdown>{result.better_version}</ReactMarkdown>
                      </BetterVersionBox>
                    )}

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <NextWordButton onClick={fetchRandomWord}>
                        Try Another Word
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: "rgba(255, 255, 255, 0.2)",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            marginLeft: "4px",
                          }}
                        >
                          <IoReturnDownBack />
                        </span>
                      </NextWordButton>
                    </div>
                  </ResultCardStyle>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <MarathonStatusScreen
              fullScreen={false}
              icon={
                <IoCloseCircle
                  style={{ color: "#d32f2f", width: 48, height: 48 }}
                />
              }
              title="Oops, something went wrong!"
              message="We failed to load your vocabulary data. Please check your connection and try again."
              buttonIcon={<IoRefresh size={20} />}
              buttonText="Retry Loading"
              buttonAction={fetchRandomWord}
            />
          </div>
        )}
      </QuizCard>

      <ReportErrorModal
        open={showErrorModal}
        onOpenChange={setShowErrorModal}
        environment="Marathon - Sentence Practice"
      />
    </MarathonLayout>
  );
}
