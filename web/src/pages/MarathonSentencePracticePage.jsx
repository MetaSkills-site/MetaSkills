/**
 * FILE PURPOSE: Interactive vocabulary practice module using Generative AI.
 * Prompt users to write original sentences for specific vocabulary words and provides real-time AI evaluation.
 *
 * DEPENDENCIES:
 * - MarathonLayout: Standardized container for marathon-style exercises with timers and exit controls.
 * - Spell: Visual utility to highlight the target word.
 * - ReportErrorModal: Bug/Content reporting utility.
 * - framer-motion: Used for smooth transitions between word loading, evaluation, and result display.
 * - api.js: Service for fetching random vocabulary and submitting sentences to the AI endpoint.
 *
 * EXPORTS:
 * - MarathonSentencePracticePage (default): Component for the /marathon/english/sentence-practice route.
 *
 * INTERCONNECT:
 * - Uses Server-Sent Events (SSE) style streaming for AI evaluation statuses ("Connecting", "Analyzing", etc.).
 * - Integrates with the carrot awarding system on successful high-accuracy submissions.
 */

import { useState, useEffect, useContext, useCallback, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoRefresh,
  IoHourglassOutline,
  IoHomeOutline,
  IoReturnDownBack,
  IoAlertCircleOutline,
} from "react-icons/io5";
import { FaPaperPlane } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import api from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";
import { SessionContext } from "../context/SessionProvider";
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
  LoadingContainer,
  LoadingSpinner,
  LoadingText,
  StatBox,
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
 * EvaluateButton: High-emphasis action button with special animations during AI processing.
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
 * SentenceInput: Extended textarea for long-form user sentence entry.
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
/**
 * UI components for word limits
 */
const WordCountWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
`;

const WordLimitBadge = styled.div`
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 10px;
  transition: all 0.2s ease;
  background: ${(props) =>
    props.$isOverLimit ? "rgba(235, 54, 54, 0.1)" : "rgba(0, 0, 0, 0.05)"};
  color: ${(props) => (props.$isOverLimit ? "#eb3636" : "#777")};
  border: 1px solid
    ${(props) =>
      props.$isOverLimit ? "rgba(235, 54, 54, 0.2)" : "transparent"};
`;

const WordLimitWarning = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #eb3636;
  font-size: 13px;
  font-weight: 600;
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

export default function MarathonSentencePracticePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useContext(SessionContext);

  // --- Logic State ---
  const [wordData, setWordData] = useState(null);
  const [isLoadingWord, setIsLoadingWord] = useState(true);
  const [sentence, setSentence] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("Connecting to AI...");
  const initialFetchDone = useRef(false);

  // --- Timer State ---
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // --- Helpers ---
  const getWordCount = (text) => {
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  };

  const wordCount = getWordCount(sentence);
  const isOverLimit = wordCount > 30;

  /**
   * fetchRandomWord: Retrieves a random word that the user is currently learning.
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

      // Handle cases where the user has no words ready for practice
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
  }, []); // Removed token from dependencies

  // Initial fetch on component mount
  useEffect(() => {
    // Only trigger initial fetch if we have a user AND we haven't fetched yet.
    if (user && !initialFetchDone.current) {
      fetchRandomWord();
      initialFetchDone.current = true;
    }
  }, [user, fetchRandomWord]);

  /**
   * Effect: Timer Lifecycle.
   * Tracks time taken from word display until user triggers evaluation.
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
   * Effect: Keyboard listener for 'Enter' shortcut.
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Trigger 'Next Word' if user presses Enter on the result screen
      if (result && e.key === "Enter") {
        fetchRandomWord();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, fetchRandomWord]);

  /**
   * handleEvaluate: Orchestrates the AI feedback process.
   * Uses native 'fetch' to support ReadableStream for real-time progress updates.
   */
  const handleEvaluate = async () => {
    if (!sentence.trim() || !wordData) return;

    setIsEvaluating(true);
    setErrorMsg("");
    setStatusMsg("Connecting to AI...");

    let timeoutId;
    let reader = null;

    try {
      const controller = new AbortController();
      // Generative AI endpoints can be slow; 90s timeout allows for backend model failovers
      timeoutId = setTimeout(() => controller.abort(), 90000);

      const { getCsrfToken } = await import("../services/api");
      const response = await fetch(
        API_ENDPOINTS.genaiSentenceEvaluate.url,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-xsrf-token": getCsrfToken() || "",
          },
          body: JSON.stringify({
            word: wordData.word,
            sentence: sentence.trim(),
            timeTaken: elapsedTime,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.message) errMsg = errData.message;
        } catch {
          /* ignore parsing err */
        }
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported.");
      }

      try {
        reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        // Process the incoming byte stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          // Extract JSON chunks delimited by newlines (NDJSON format)
          while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.type === "status") {
                  // Status updates show progress in the loading UI
                  setStatusMsg(parsed.message);
                } else if (parsed.type === "complete") {
                  // Final graded response from AI
                  setResult(parsed.response);
                  if (parsed.response.carrots) {
                    updateUser({ carrots: parsed.response.carrots });
                  }
                } else if (parsed.type === "error") {
                  throw new Error(parsed.message);
                }
              } catch (e) {
                if (e.name !== "SyntaxError") throw e;
              }
            }
          }
        }

        // Handle any trailing data in the buffer
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim());
            if (parsed.type === "complete") {
              setResult(parsed.response);
              if (parsed.response.carrots) {
                updateUser({ carrots: parsed.response.carrots });
              }
            }
          } catch {
            /* ignore */
          }
        }
      } finally {
        if (reader) reader.cancel();
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("Evaluation request aborted/timeout.");
        setStatusMsg("Request aborted/timeout...");
        setErrorMsg("Request taking too long. It was aborted.");
      } else {
        console.error("Evaluation error:", err);
        setErrorMsg(
          err.message ||
            "An error occurred during evaluation. Please try again.",
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setIsEvaluating(false);
    }
  };

  // EMPTY_STATE: Displayed when user has no words pending practice
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Target Word Section */}
            <WordDisplayBox>
              <WordText>
                <AudioWord>{wordData.word}</AudioWord>
              </WordText>
            </WordDisplayBox>

            {/* Input Area */}
            <InputSection>
              <InputLabel htmlFor="sentence-input">
                Write a sentence using the word &quot;{wordData.word}&quot;:
              </InputLabel>
              <SentenceInput
                id="sentence-input"
                placeholder="Type your sentence here..."
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                disabled={isEvaluating || result !== null}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (
                      !isEvaluating &&
                      !result &&
                      sentence.trim() &&
                      !isOverLimit
                    ) {
                      handleEvaluate();
                    }
                  }
                }}
              />
              <WordCountWrapper>
                <AnimatePresence>
                  {isOverLimit && (
                    <WordLimitWarning
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <IoAlertCircleOutline size={18} />
                      Limit: 30 words max
                    </WordLimitWarning>
                  )}
                </AnimatePresence>
                <WordLimitBadge $isOverLimit={isOverLimit}>
                  {wordCount} / 30 words
                </WordLimitBadge>
              </WordCountWrapper>
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

            {!result && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <EvaluateButton
                  onClick={handleEvaluate}
                  disabled={!sentence.trim() || isEvaluating || isOverLimit}
                  $isEvaluating={isEvaluating}
                >
                  Check Sentence <FaPaperPlane />
                </EvaluateButton>
              </div>
            )}

            {/* Real-time Evaluation Progress */}
            <AnimatePresence>
              {isEvaluating && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  style={{ overflow: "hidden" }}
                >
                  <LoadingContainer>
                    <LoadingSpinner>
                      <FaWandMagicSparkles />
                    </LoadingSpinner>
                    <LoadingText>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={statusMsg}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: "inline-block" }}
                        >
                          {statusMsg}
                        </motion.span>
                      </AnimatePresence>
                    </LoadingText>
                  </LoadingContainer>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Grading Result */}
            <AnimatePresence>
              {result && (
                <ResultCardStyle>
                  <ResultBanner $correct={result.accuracy > 60}>
                    {result.accuracy === 100 ? (
                      <IoCheckmarkCircle />
                    ) : result.accuracy > 60 ? (
                      <IoCheckmarkCircle />
                    ) : (
                      <IoCloseCircle />
                    )}

                    {result.accuracy === 100
                      ? `Flawless Usage! (100%)`
                      : result.accuracy >= 80
                        ? `Great Usage! (${result.accuracy}%)`
                        : result.accuracy > 60
                          ? `Good Usage! (${result.accuracy}%)`
                          : `Needs Improvement (${result.accuracy}%)`}
                  </ResultBanner>

                  {result.carrotsAwarded > 0 && (
                    <StatBox style={{ marginTop: "15px", marginBottom: "5px" }}>
                      <div className="value">+{result.carrotsAwarded}</div>
                      <div className="label">Carrots</div>
                    </StatBox>
                  )}

                  {!(result.accuracy > 60) &&
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

                  {/* Show corrected version for low-accuracy attempts */}
                  {!(result.accuracy > 60) && result.better_version && (
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
