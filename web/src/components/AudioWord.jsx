/**
 * FILE PURPOSE: AudioWord — Text-to-Speech (TTS) component for word pronunciation.
 *
 * ROLE:
 * Wraps a word or phrase and provides an interactive pronunciation feature.
 * On click, it attempts a 3-tier fallback chain for audio playback:
 *   1. AI TTS via the backend Groq Orpheus endpoint (highest quality).
 *   2. Dictionary API human audio (external, public).
 *   3. Browser SpeechSynthesis (native, always available).
 *
 * DEPENDENCIES:
 * - styled-components: For interactive dotted underlines, pulses, and tooltips.
 * - apiClient (../services/api): Communicates with POST /api/genai/tts.
 * - Dictionary API (External): Tier 2 fallback for human audio URLs.
 * - Web Speech API (Native): Tier 3 fallback for local synthesis.
 *
 * EXPORTS:
 * - AudioWord (default): Component that renders the interactive word.
 *
 * INTERCONNECTIONS:
 * - Extensively used in Passage and Vocabulary modules to aid language learning
 *   through auditory reinforcement.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import apiClient from "../services/api";

/**
 * Session-scoped audio cache — prevents redundant API calls for repeated words.
 * Capped at MAX_CACHE_SIZE entries to prevent memory bloat during long sessions
 * (each WAV base64 string can be 50-200KB).
 */
const MAX_CACHE_SIZE = 100;
const sessionCache = new Map();

/* ─── Animations ─── */
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(-50%) translateY(4px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
`;

/* ─── Styled Components ─── */
const SpellContainer = styled.span`
  position: relative;
  display: inline-block;
  line-height: inherit;
`;

/**
 * SpellWord
 * Interactive text element with dotted underline indicating clickable TTS functionality.
 */
const SpellWord = styled.span`
  border-bottom: 2px dotted
    ${(p) => {
      if (p.$hasError) return "#d32f2f";
      if (p.$speaking) return "var(--color-primary, #ff5722)";
      return "rgba(0,0,0,0.3)";
    }};
  cursor: pointer;
  display: inline;
  transition:
    border-color 0.25s ease,
    color 0.25s ease;
  color: ${(p) => {
    if (p.$hasError) return "#d32f2f";
    if (p.$speaking) return "var(--color-primary, #ff5722)";
    return "inherit";
  }};

  ${(p) =>
    p.$speaking &&
    !p.$hasError &&
    css`
      animation: ${pulse} 1.2s ease-in-out infinite;
    `}

  &:hover {
    border-bottom-color: ${(p) => {
      if (p.$hasError) return "#d32f2f";
      if (p.$speaking) return "var(--color-primary, #ff5722)";
      return "rgba(0,0,0,0.6)";
    }};
  }
`;

const Tooltip = styled.span`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: ${(p) => {
    if (p.$hasError) return "#ffebee";
    if (p.$speaking) return "var(--color-primary, #ff5722)";
    return "#ffffff";
  }};
  color: ${(p) => {
    if (p.$hasError) return "#d32f2f";
    if (p.$speaking) return "#ffffff";
    return "#555555";
  }};
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid
    ${(p) => {
      if (p.$hasError) return "#facece";
      if (p.$speaking) return "var(--color-primary, #ff5722)";
      return "#e2e8f0";
    }};
  box-shadow: ${(p) => {
    if (p.$hasError) return "0 4px 14px rgba(211, 47, 47, 0.2)";
    if (p.$speaking) return "0 4px 14px rgba(255, 87, 34, 0.3)";
    return "0 4px 12px rgba(0, 0, 0, 0.08)";
  }};
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  font-family: "quicksand", "Inter", sans-serif;
  letter-spacing: 0.3px;

  /* Caret (Arrow) */
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: ${(p) =>
        p.$speaking ? "var(--color-primary, #ff5722)" : "#e2e8f0"}
      transparent transparent transparent;
  }

  /* Reveal logic: Show on hover OR while actively speaking */
  ${SpellContainer}:hover & {
    opacity: 1;
    animation: ${fadeIn} 0.15s ease;
  }

  ${(p) =>
    p.$speaking &&
    css`
      opacity: 1;
      animation: ${fadeIn} 0.2s ease;
    `}
`;

/* ─── UI Icons ─── */
const SpeakerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 4, verticalAlign: "-1px" }}
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

/**
 * speakWordAI — Attempt TTS via backend Groq Orpheus endpoint.
 * Returns a base64 WAV string on success, or null on failure.
 */
async function speakWordAI(text, voice, signal) {
  // Check session cache first
  const cacheKey = `${voice}:${text.toLowerCase().trim()}`;
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey);
  }

  try {
    const response = await apiClient.post(
      "/api/genai/tts",
      { text, voice },
      { signal, timeout: 5000 },
    );

    if (response.data?.success && response.data.audioBase64) {
      // Evict oldest entry if cache is full (simple FIFO eviction)
      if (sessionCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = sessionCache.keys().next().value;
        sessionCache.delete(oldestKey);
      }
      sessionCache.set(cacheKey, response.data.audioBase64);
      return response.data.audioBase64;
    }
    return null;
  } catch {
    return null; // Silently fall through to next tier
  }
}

/**
 * speakWord Core Logic
 * 1. Attempts AI TTS via backend Groq Orpheus API.
 * 2. If AI fails, falls back to high-quality human pronunciation via Free Dictionary API.
 * 3. If Dictionary API fails or no audio exists, falls back to local browser SpeechSynthesis.
 */
async function speakWord(
  text,
  voice,
  onStart,
  onEnd,
  onError,
  signal,
  audioRef,
) {
  if (!text) return;

  onStart();

  const fallbackToBrowser = () => {
    if (signal?.aborted) return;
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = onEnd;
      utterance.onerror = () => {
        if (signal?.aborted) return;
        console.error("[TTS] Speech Synthesis error");
        if (onError) onError();
        else onEnd();
      };
      // Cancel ongoing speech to prevent queuing lag
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      console.error("[TTS] Web Speech SDK not supported");
      if (onError) onError();
      else onEnd();
    }
  };

  try {
    // TIER 1: AI TTS (Groq Orpheus)
    const aiBase64 = await speakWordAI(text, voice, signal);
    if (signal?.aborted) return;

    if (aiBase64) {
      const audioUrl = `data:audio/wav;base64,${aiBase64}`;
      const audio = new Audio(audioUrl);
      if (audioRef) audioRef.current = audio;

      try {
        await new Promise((resolve, reject) => {
          audio.onended = () => {
            if (signal?.aborted) return resolve();
            onEnd();
            resolve();
          };
          audio.onerror = (e) => {
            if (signal?.aborted) return resolve();
            console.warn("[TTS] AI Audio failed to play:", e);
            reject(new Error("AI audio failed"));
          };
          audio.play().catch(reject);
        });
        return; // Success, exit early
      } catch {
        console.warn(
          "[TTS] AI playback threw error, falling through to Tier 2.",
        );
      }
    }

    // TIER 2: Dictionary API Fallback
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`,
      { signal },
    );

    if (signal?.aborted) return;

    if (!res.ok) {
      throw new Error(`Dictionary API returned ${res.status}`);
    }

    const data = await res.json();
    let audioUrl = "";

    // SEARCH LOGIC: Iterate through entries and phonetics to find the first valid audio link.
    for (const entry of data) {
      if (entry.phonetics) {
        for (const phonetic of entry.phonetics) {
          if (phonetic.audio && phonetic.audio.trim().length > 0) {
            audioUrl = phonetic.audio;
            break;
          }
        }
      }
      if (audioUrl) break;
    }

    if (!audioUrl) {
      throw new Error("No audio link available in Dictionary API response");
    }

    if (signal?.aborted) return;

    // Play human audio
    const audio = new Audio(audioUrl);
    if (audioRef) audioRef.current = audio;

    audio.onended = () => {
      if (signal?.aborted) return;
      onEnd();
    };
    audio.onerror = (e) => {
      if (signal?.aborted) return;
      console.warn("[TTS] Audio failed to play media URL:", e);
      fallbackToBrowser();
    };

    await audio.play();
  } catch (err) {
    if (signal?.aborted) return;
    console.warn(
      "[TTS] REST API failed or unavailable, relying on browser fallback:",
      err.message,
    );
    fallbackToBrowser();
  }
}

/* ─── Main Component ─── */

export default function AudioWord({ children, voice = "autumn" }) {
  const [speaking, setSpeaking] = useState(false);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const controllerRef = useRef(null);
  const audioRef = useRef(null);

  // Lifecycle Cleanup: prevent memory leaks and state updates on unmounted components
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      timeoutRef.current = null;
      errorTimeoutRef.current = null;
      controllerRef.current = null;
      audioRef.current = null;
    };
  }, []);

  const handleSpell = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!children || typeof children !== "string") return;

      // Reset UI state before starting new audio
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      setHasError(false);
      controllerRef.current = new AbortController();

      speakWord(
        children,
        voice,
        () => setSpeaking(true),
        // Keep speaking state briefly after audio ends for visual consistency
        () => {
          if (controllerRef.current?.signal.aborted) return;
          timeoutRef.current = setTimeout(() => {
            if (!controllerRef.current?.signal.aborted) {
              setSpeaking(false);
            }
          }, 400);
        },
        // Show error UI state briefly if all TTS methods fail
        () => {
          if (controllerRef.current?.signal.aborted) return;
          setSpeaking(false);
          setHasError(true);
          errorTimeoutRef.current = setTimeout(() => {
            if (!controllerRef.current?.signal.aborted) {
              setHasError(false);
            }
          }, 2500);
        },
        controllerRef.current.signal,
        audioRef,
      );
    },
    [children, voice],
  );

  // Tooltip Text Resolution
  let tooltipText = "Click to hear pronunciation";
  if (speaking) tooltipText = "Speaking…";
  if (hasError) tooltipText = "Audio unavailable";

  return (
    <SpellContainer>
      <SpellWord
        $speaking={speaking}
        $hasError={hasError}
        onClick={handleSpell}
        role="button"
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleSpell(e);
          }
        }}
        aria-label={`Hear pronunciation of ${children}`}
      >
        {children}
      </SpellWord>
      <Tooltip $speaking={speaking} $hasError={hasError} aria-hidden="true">
        {speaking && !hasError && <SpeakerIcon />}
        {tooltipText}
      </Tooltip>
    </SpellContainer>
  );
}
