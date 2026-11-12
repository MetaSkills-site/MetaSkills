/**
 * @file GeminiGenerator.jsx
 * @description Action button initiating AI content generation streams with visual loading feedback and error handling.
 * @architecture Common interactive utility component interfacing directly with SSE streaming endpoints for GenAI assistance.
 * @agent_note Expects an SSE response stream parsing lines for chunk or completed event states; handles abort and CSRF tokens.
 */

/**
 * FILE PURPOSE: A button component that triggers AI content generation via the Gemini API.
 * It handles real-time streaming of responses and provides visual feedback during generation.
 *
 * DEPENDENCIES:
 * - styled-components: For complex animations (shimmer, pulse) and styled UI.
 * - react-icons/fa6: Providing the magic sparkles icon.
 * - react-hot-toast: For error messaging.
 * - Fetch API: Used for connecting to the backend streaming endpoint.
 *
 * EXPORTS:
 * - GeminiGenerator: Default export.
 *
 * INTERCONNECT:
 * - Used in the Admin Editor for generating passages, questions, and explanations.
 * - Communicates with the `/api/genai/stream` backend proxy.
 */

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaWandMagicSparkles } from "react-icons/fa6";
import toast from "react-hot-toast";
import { API_ENDPOINTS } from "../../api/requestMap";

/**
 * Keyframes for the 'shimmering' loading effect on the button background.
 */
const shimmer = keyframes`
  0% { filter: hue-rotate(0deg); background-position: -200% 0; }
  100% { filter: hue-rotate(45deg); background-position: 200% 0; }
`;

/**
 * Keyframes for the pulsating animation on the magic wand icon.
 */
const sparklePulse = keyframes`
  0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); color: white; }
  50% { transform: scale(1.3) rotate(15deg); filter: drop-shadow(0 0 8px rgba(255,255,255,1)); color: #ffeb3b; }
  100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); color: white; }
`;

const GenerateButton = styled.button`
  width: -moz-fit-content;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => {
    if (props.$loading) {
      return "linear-gradient(90deg, #ff3366, #ff7b51, #e91e63, #ff3366)";
    }
    if (props.disabled) return "var(--bg-muted, #e0e0e0)";
    return "linear-gradient(135deg, #ff5722 0%, #ff7043 100%)";
  }};
  color: ${(props) =>
    props.disabled && !props.$loading ? "var(--text-faint, #9e9e9e)" : "white"};
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius-button, 12px);
  font-weight: 700;
  cursor: ${(props) =>
    props.disabled && !props.$loading ? "not-allowed" : "pointer"};
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(props) => {
    if (props.$loading) return "0 8px 20px rgba(255, 83, 141, 0.5)";
    if (props.disabled) return "none";
    return "0 4px 10px rgba(255, 87, 34, 0.25)";
  }};

  /* Prevent global disabled styles from dropping opacity when loading */
  opacity: ${(props) =>
    props.$loading ? "1 !important" : props.disabled ? "0.6" : "1"};

  &:hover {
    transform: ${(props) =>
      props.disabled && !props.$loading ? "none" : "translateY(-2px)"};
    box-shadow: ${(props) => {
      if (props.$loading) return "0 10px 25px rgba(255, 83, 141, 0.6)";
      if (props.disabled) return "none";
      return "0 6px 14px rgba(255, 87, 34, 0.35)";
    }};
  }

  &:active {
    transform: ${(props) =>
      props.disabled && !props.$loading ? "none" : "translateY(0)"};
    box-shadow: ${(props) => {
      if (props.$loading) return "0 4px 10px rgba(255, 83, 141, 0.4)";
      if (props.disabled) return "none";
      return "0 2px 4px rgba(255, 87, 34, 0.2)";
    }};
  }

  /* Shimmer effect when loading */
  background-size: 300% auto;
  animation: ${(props) => (props.$loading ? shimmer : "none")} 2s linear
    infinite;

  svg {
    /* Increase size slightly for a bolder look */
    font-size: 1.1em;
    animation: ${(props) => (props.$loading ? sparklePulse : "none")} 1.5s
      ease-in-out infinite;
  }
`;

/**
 * GeminiGenerator button component for streaming AI generations.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.apiMode - Generation mode identifier (e.g., 'passage', 'vocab', 'sentences').
 * @param {Object} props.params - Generation parameters and prompts.
 * @param {Function} [props.onStream] - Callback receiving streamed text chunks.
 * @param {Function} [props.onComplete] - Callback receiving fully assembled generated output.
 * @param {Function} [props.onError] - Callback invoked when an error occurs.
 * @param {Function} [props.onStart] - Callback invoked prior to request initiation.
 * @param {boolean} [props.disabled=false] - Whether button interaction is disabled.
 * @param {string} [props.buttonText="Generate with AI"] - Button label text.
 * @param {Object} [props.style={}] - Inline styling overrides.
 * @returns {JSX.Element} Interactive generator trigger button.
 */
const GeminiGenerator = ({
  apiMode,
  params,
  onStream,
  onComplete,
  onError,
  onStart,
  disabled = false,
  buttonText = "Generate with AI",
  style = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Generating...");

  /**
   * Orchestrates the backend request and processes the incoming stream.
   */
  const handleGenerate = async () => {
    if (!apiMode || !params) return;

    setLoading(true);
    if (onStart) onStart();
    setStatusMsg("Connecting to AI...");
    let fullText = "";
    let completed = false;

    try {
      // 1. Establish connection to streaming endpoint
      const { getCsrfToken } = await import("../../services/api");
      const response = await fetch(API_ENDPOINTS.genaiStream.url, {
        method: API_ENDPOINTS.genaiStream.method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-xsrf-token": getCsrfToken() || "",
        },
        body: JSON.stringify({
          apiMode,
          params,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || `HTTP error! status: ${response.status}`,
        );
      }

      if (!response.body) {
        throw new Error("ReadableStream not yet supported in this browser.");
      }

      // 2. Read the stream using ReadableStream API
      let reader = null;
      try {
        reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Split buffer by newline to process individual JSON messages
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line) {
              try {
                // Backend sends specific message types: status, complete, error
                const parsed = JSON.parse(line);
                if (parsed.type === "status") {
                  setStatusMsg(parsed.message);
                } else if (parsed.type === "complete") {
                  fullText = parsed.response || "";
                  completed = true;
                  if (onComplete) onComplete(fullText);
                } else if (parsed.type === "error") {
                  throw new Error(parsed.message);
                }
              } catch (e) {
                // If it's not valid JSON, treat as raw text stream chunk
                if (e.name !== "SyntaxError") throw e;
                if (!completed) {
                  fullText += line;
                  if (onStream) {
                    onStream(line);
                  }
                }
              }
            }
          }
        }

        // Final buffer flush for remaining text
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim());
            if (parsed.type === "complete" && !completed) {
              fullText = parsed.response || "";
              completed = true;
              if (onComplete) onComplete(fullText);
            }
          } catch {
            if (!completed) {
              fullText += buffer;
            }
          }
        }
      } finally {
        if (reader) {
          reader.cancel(); // Cleanup reader on finish or error
        }
      }
    } catch (err) {
      console.error("Gemini Generation Error:", err);
      if (onError) {
        onError(err);
      } else {
        toast.error(
          err.message || "An error occurred while generating AI content.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GenerateButton
      onClick={handleGenerate}
      disabled={disabled || loading}
      $loading={loading}
      style={style}
      type="button"
    >
      {loading ? (
        <>
          <FaWandMagicSparkles />
          {statusMsg}
        </>
      ) : (
        <>
          <FaWandMagicSparkles />
          {buttonText}
        </>
      )}
    </GenerateButton>
  );
};

export default GeminiGenerator;
