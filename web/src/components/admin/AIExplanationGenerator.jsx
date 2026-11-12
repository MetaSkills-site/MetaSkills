/**
 * @file AIExplanationGenerator.jsx
 * @description AI-powered explanation generator for question creation that analyzes questions and answers using LLMs.
 * @architecture Admin view-layer integration component connecting Slate editor inputs to backend AI explanation endpoints.
 * @agent_note Ensure Slate serialization helpers stay aligned with schema nodes (math, inline blanks, tables) when modifying.
 */

/**
 * FILE: AIExplanationGenerator.jsx
 * PURPOSE: AI-powered explanation generator for the question creator. It analyzes the question and correct answer to provide detailed step-by-step explanations.
 * DEPENDENCIES:
 * - EditorContext: provides question, options, setExplanation
 * - CommonDialog: Radix UI modal for custom prompt input
 * - styled-components: styling consistent with GeminiGenerator
 * - react-hot-toast: error notifications
 * - slateUtils: Utility for converting markdown to Slate-compatible format.
 * EXPORTS: AIExplanationGenerator (Default export)
 * INTERCONNECTIONS: Consumed by WriteExplanation.jsx to assist admins in creating content.
 */

import { useState, useCallback } from "react";
import { markdownToSlate } from "../../utils/slateUtils";
import styled, { keyframes } from "styled-components";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { IoReloadOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import CommonDialog from "../common/CommonDialog";
import { DialogButtonGroup, DialogButton } from "./AdminStyles";
import { API_ENDPOINTS } from "../../api/requestMap";
// ─── Animations ───

// Shimmer effect for the loading state of the button
const shimmer = keyframes`
  0% { filter: hue-rotate(0deg); background-position: -200% 0; }
  100% { filter: hue-rotate(45deg); background-position: 200% 0; }
`;

// Pulsing sparkle animation for the magic wand icon
const sparklePulse = keyframes`
  0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); color: white; }
  50% { transform: scale(1.3) rotate(15deg); filter: drop-shadow(0 0 8px rgba(255,255,255,1)); color: #ffeb3b; }
  100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); color: white; }
`;

// ─── Styled Components ───

const GeneratorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

// Button styled with dynamic gradients based on state (loading, regenerate, or default)
const GenerateBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => {
    if (props.$loading)
      return "linear-gradient(90deg, #ff3366, #ff7b51, #e91e63, #ff3366)";
    if (props.$regenerate)
      return "linear-gradient(135deg, #7c4dff 0%, #b388ff 100%)";
    return "linear-gradient(135deg, #ff5722 0%, #ff7043 100%)";
  }};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: ${(props) =>
    props.disabled && !props.$loading ? "not-allowed" : "pointer"};
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(props) => {
    if (props.$loading) return "0 8px 20px rgba(255, 83, 141, 0.5)";
    if (props.$regenerate) return "0 4px 10px rgba(124, 77, 255, 0.25)";
    return "0 4px 10px rgba(255, 87, 34, 0.25)";
  }};
  opacity: ${(props) =>
    props.$loading ? "1 !important" : props.disabled ? "0.6" : "1"};

  &:hover {
    transform: ${(props) =>
      props.disabled && !props.$loading ? "none" : "translateY(-2px)"};
    box-shadow: ${(props) => {
      if (props.$loading) return "0 10px 25px rgba(255, 83, 141, 0.6)";
      if (props.$regenerate) return "0 6px 14px rgba(124, 77, 255, 0.35)";
      return "0 6px 14px rgba(255, 87, 34, 0.35)";
    }};
  }

  &:active {
    transform: ${(props) =>
      props.disabled && !props.$loading ? "none" : "translateY(0)"};
  }

  background-size: 300% auto;
  animation: ${(props) => (props.$loading ? shimmer : "none")} 2s linear
    infinite;

  svg {
    font-size: 1.1em;
    animation: ${(props) => (props.$loading ? sparklePulse : "none")} 1.5s
      ease-in-out infinite;
  }
`;

const PromptTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &:focus {
    border-color: #ff5722;
    box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
  }

  &::placeholder {
    color: #aaa;
  }
`;

const HintText = styled.p`
  font-size: 13px;
  color: #888;
  margin: 0 0 12px 0;
  line-height: 1.5;
`;

// ─── Utility: Serialize Slate data to plain text ───

/**
 * Recursively extracts all text content from a Slate value tree.
 * Handles nested elements, math nodes, inline blanks, and images (skips them).
 */
const serializeSlateToText = (nodes) => {
  if (!Array.isArray(nodes)) return "";

  return nodes
    .map((node) => {
      // Leaf text node
      if (node.text !== undefined) return node.text;

      // Math node — include the LaTeX expression
      if (node.type === "math" && node.latex) return `[Math: ${node.latex}]`;

      // Inline blank — show the correct answer
      if (node.type === "inline-blank")
        return node.correctAnswer
          ? `[Blank: ${node.correctAnswer}]`
          : "[Blank]";

      // Image — skip text extraction but note its presence
      if (node.type === "image") return "[Image]";

      // Table cell — recurse
      if (node.type === "table-cell" && node.children)
        return serializeSlateToText(node.children);

      // Table row — join cells with tab
      if (node.type === "table-row" && node.children)
        return node.children
          .map((cell) => serializeSlateToText(cell.children || []))
          .join("\t");

      // Table — join rows with newline
      if (node.type === "table" && node.children)
        return node.children
          .map((row) =>
            row.children
              ? row.children
                  .map((cell) => serializeSlateToText(cell.children || []))
                  .join("\t")
              : "",
          )
          .join("\n");

      // Generic block element — recurse into children
      if (node.children) return serializeSlateToText(node.children);

      return "";
    })
    .join("\n");
};

/**
 * Extracts the first image URL from a Slate value tree (for vision mode support).
 */
const extractFirstImageUrl = (nodes) => {
  if (!Array.isArray(nodes)) return null;

  for (const node of nodes) {
    if (node.type === "image" && node.url) return node.url;

    if (node.children) {
      const found = extractFirstImageUrl(node.children);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Serializes the answer options into plain text for the AI prompt.
 * Handles both Short Answer (SA) and Multiple Choice (MCQ) formats.
 */
const serializeAnswer = (options) => {
  if (!options) return "";

  if (options.type === "MCQ" && options.mcq) {
    const labels = ["A", "B", "C", "D"];
    const correctIdx = options.mcq.correct;
    let text = "";

    labels.forEach((label) => {
      const optValue = options.mcq[label];
      if (!optValue) return;
      // Option can be raw string or rich-text Slate data
      const optText =
        typeof optValue === "string"
          ? optValue
          : Array.isArray(optValue)
            ? serializeSlateToText(optValue)
            : optValue?.slate
              ? serializeSlateToText(optValue.slate)
              : String(optValue);

      // Mark the correct option for AI context
      const marker =
        correctIdx !== null && labels[correctIdx] === label ? " ✓" : "";
      text += `${label}. ${optText}${marker}\n`;
    });

    return text.trim();
  }

  // Handle Short Answer type
  if (options.sa) {
    return typeof options.sa === "string"
      ? options.sa
      : Array.isArray(options.sa)
        ? serializeSlateToText(options.sa)
        : options.sa?.slate
          ? serializeSlateToText(options.sa.slate)
          : String(options.sa);
  }

  return "";
};

// ─── Main Component ───

/**
 * AIExplanationGenerator Component
 * Provides a Generate/Regenerate button that opens a custom prompt modal
 * and calls the backend AI explanation endpoint.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Array} props.question - Slate value array for the question content.
 * @param {Object} props.options - Answer options from EditorContext.
 * @param {Function} props.setExplanation - Setter for explanation Slate value.
 * @param {Function} [props.setIsGenerating] - Optional callback indicating generation status.
 * @returns {JSX.Element} AI explanation generator button and modal controls.
 */
const AIExplanationGenerator = ({
  question,
  options,
  setExplanation,
  setIsGenerating,
}) => {
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Generating...");

  /**
   * Orchestrates the explanation generation by serializing data and calling the backend.
   */
  const handleGenerate = useCallback(async () => {
    setModalOpen(false);
    setLoading(true);
    setIsGenerating?.(true);
    setStatusMsg("Connecting to AI...");

    try {
      // Data serialization for AI context
      const questionText = serializeSlateToText(question);
      const answerText = serializeAnswer(options);
      const imageUrl = extractFirstImageUrl(question);

      // Validation: ensure required content exists
      if (!questionText.trim()) {
        toast.error(
          "Please write a question first before generating an explanation.",
        );
        setLoading(false);
        setIsGenerating?.(false);
        return;
      }
      if (!answerText.trim()) {
        toast.error(
          "Please write an answer first before generating an explanation.",
        );
        setLoading(false);
        setIsGenerating?.(false);
        return;
      }

      // Payload construction
      const payload = {
        questionText,
        answerText,
      };
      if (imageUrl) payload.imageUrl = imageUrl;
      if (customPrompt.trim()) payload.customPrompt = customPrompt.trim();

      // We no longer manually extract token because the endpoint relies on cookies.
      // 120s timeout to accommodate DeepSeek TTFT
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const { getCsrfToken } = await import("../../services/api");
      const response = await fetch(API_ENDPOINTS.genaiExplanation.url, {
        method: API_ENDPOINTS.genaiExplanation.method || "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-xsrf-token": getCsrfToken() || "",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.message) errMsg = errData.message;
        } catch {
          /* ignore */
        }
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported.");
      }

      let reader = null;
      try {
        reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let completed = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.type === "status") {
                  setStatusMsg(parsed.message);
                } else if (parsed.type === "complete") {
                  const data = parsed.response;
                  if (data && data.success && data.explanation) {
                    const slateValue = markdownToSlate(data.explanation);
                    setExplanation(slateValue);
                    setHasGenerated(true);
                    toast.success("Explanation generated successfully!");
                    completed = true;
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

        if (buffer.trim() && !completed) {
          try {
            const parsed = JSON.parse(buffer.trim());
            if (parsed.type === "complete") {
              const data = parsed.response;
              if (data && data.success && data.explanation) {
                const slateValue = markdownToSlate(data.explanation);
                setExplanation(slateValue);
                setHasGenerated(true);
                toast.success("Explanation generated successfully!");
              }
            }
          } catch {
            /* ignore */
          }
        }
      } finally {
        if (reader) reader.cancel();
        clearTimeout(timeoutId);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        toast.error("Request aborted/timeout. It was taking too long.");
      } else {
        console.error("Explanation generation error:", err);
        toast.error(err.message || "Failed to generate explanation.");
      }
    } finally {
      setLoading(false);
      setIsGenerating?.(false);
    }
  }, [question, options, customPrompt, setExplanation, setIsGenerating]);

  // Handle trigger for opening the custom prompt modal
  const handleButtonClick = () => {
    if (loading) return;
    setModalOpen(true);
  };

  return (
    <GeneratorWrapper>
      {/* Modal for adding optional custom instructions to the AI */}
      <CommonDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        trigger={
          <GenerateBtn
            type="button"
            disabled={loading}
            $loading={loading}
            $regenerate={hasGenerated && !loading}
            onClick={handleButtonClick}
          >
            {loading ? (
              <>
                <FaWandMagicSparkles />
                {statusMsg}
              </>
            ) : hasGenerated ? (
              <>
                <IoReloadOutline />
                Regenerate
              </>
            ) : (
              <>
                <FaWandMagicSparkles />
                Generate Explanation
              </>
            )}
          </GenerateBtn>
        }
        title={
          hasGenerated
            ? "Regenerate Explanation"
            : "Generate Explanation with AI"
        }
        description="The AI will analyze the question and correct answer to generate a clear, step-by-step explanation."
      >
        <HintText>
          Optionally, add instructions to guide the AI&apos;s response (e.g.,
          &quot;Be brief&quot;, &quot;Focus on the formula&quot;, &quot;Explain
          at a grade 5 level&quot;).
        </HintText>
        <PromptTextArea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Additional instructions for the AI (optional)..."
          id="ai-custom-prompt"
        />
        <DialogButtonGroup>
          <DialogButton onClick={() => setModalOpen(false)}>
            Cancel
          </DialogButton>
          <DialogButton $primary onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </DialogButton>
        </DialogButtonGroup>
      </CommonDialog>
    </GeneratorWrapper>
  );
};

export default AIExplanationGenerator;
