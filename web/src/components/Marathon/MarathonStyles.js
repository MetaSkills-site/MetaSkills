/**
 * @file MarathonStyles.js
 * @description A comprehensive collection of styled-components used across various
 * Marathon-style learning modules. It defines the layout for quiz cards, timer indicators,
 * result displays, input fields, and specialized interactive elements like the Word Bank.
 *
 * @dependencies
 * - styled-components: For generating themed and responsive CSS-in-JS.
 *
 * @exports
 * - Layout: Container, QuizCard, Header, RightControlsContainer.
 * - Stats: TimerContainer, CarrotContainer, StatBox.
 * - Interactive: Button, ActionButton, OptionButton, WordChip.
 * - Feedback: ResultCardStyle, ResultBanner, LoadingSpinner.
 * - Inputs: BaseMarathonInput, WordBankWrapper.
 *
 * @interconnections
 * - Imported by MarathonLayout and individual marathon quiz pages (Math, English, etc.).
 */

import styled, { keyframes } from "styled-components";

// --- Layout Components ---

/** The main centered wrapper for marathon content */
export const Container = styled.div`
  padding: 40px;
  width: 80%;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 95%;
    padding: 20px;
  }
`;

/** Card-style container for individual quiz questions or steps */
export const QuizCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
  margin-bottom: 40px;
  position: relative;
  display: flex;
  flex-direction: column;
`;

/** Top-level header within a quiz module */
export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
`;

// --- Stats & Indicators ---

/** Visual container for the real-time session timer */
export const TimerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f4ff;
  color: #1976d2;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-family: monospace;
  font-size: 16px;
`;

/** Container for the user's reward currency (Carrots) */
export const CarrotContainer = styled.div`
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

/** Right-aligned container for timer, rewards, and report buttons */
export const RightControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

export const TextContent = styled.div`
  font-size: 1.2rem;
  line-height: 2.5;
  color: #333;
  margin-bottom: 40px;
`;

// --- Buttons & Interactions ---

/** Generic primary button for marathon interactions */
export const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(90deg, #2196f3, #00bcd4);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: old;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// --- Result & Feedback Components ---

/** Card wrapper for displaying quiz results after submission */
export const ResultCardStyle = styled.div`
  margin-top: 30px;
  padding: 25px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

/** Colored banner indicating if a specific answer was correct or wrong */
export const ResultBanner = styled.div`
  width: 100%;
  padding: 25px 20px;
  border-radius: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-family: var(--font-primary);
  font-size: 1.2rem;

  ${(props) =>
    props.$correct
      ? `
    background: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #4caf50;
  `
      : `
    background: #ffebee;
    color: #c62828;
    border: 1px solid #f44336;
  `}

  svg {
    width: 28px;
    height: 28px;
  }
`;

/** Standardized CTA button for taking action on results (e.g., "Next Question") */
export const ActionButton = styled.button`
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

export const ResultContainer = styled.div`
  margin-top: 30px;
  text-align: center;
`;

export const ScoreText = styled.div`
  margin-bottom: 15px;
  font-weight: bold;
  color: ${(props) => (props.$perfect ? "#2e7d32" : "#ef6c00")};
  font-size: 1.2rem;
`;

export const ResultActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
`;

export const ResultActionSecondary = styled(ActionButton)`
  background: white;
  color: #333;
  border: 1px solid #ddd;
  box-shadow: none;

  &:hover {
    background: #f5f5f5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const CorrectAnswerContainer = styled.div`
  margin-top: 15px;
  margin-bottom: 15px;
`;

export const CorrectAnswerHeader = styled.h4`
  margin-bottom: 5px;
  color: #2e7d32;
`;

export const AnswerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const AnswerItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const AnswerNumber = styled.span`
  font-weight: bold;
  color: #888;
`;

export const AnswerText = styled.span`
  font-weight: bold;
  color: #2e7d32;
`;

export const InstructionText = styled.div`
  margin-bottom: 20px;
  font-size: 1.1rem;
  color: #555;
  font-weight: 600;
`;

export const WordContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  line-height: 2;
`;

export const PassageContainer = styled.div`
  position: relative;
  margin-bottom: 30px;
  width: 100%;
`;

export const PassageContentWrapper = styled.div`
  font-size: 1.4rem;
  line-height: 1.6;
  background: transparent;
  padding: ${(props) => (props.$transparent ? "0" : "15px")};
  border-radius: 8px;
`;

export const HighlightSpan = styled.span`
  text-decoration: underline;
  text-decoration-color: #ff5722;
  font-weight: bold;
  color: #333;
`;

// --- Question Options ---

export const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/** Button for selecting an answer option, supporting various states (correct, wrong, default) */
export const OptionButton = styled.button`
  padding: 15px;
  font-size: 16px;
  border-radius: 10px;
  border: 2px solid ${(props) => props.$borderColor};
  background: ${(props) => props.$bg};
  color: ${(props) => props.$color};
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};
  font-weight: 400;
  text-align: left;
  transition: all 0.2s;
  opacity: 1;

  &:hover {
    transform: ${(props) => (!props.disabled ? "translateY(-2px)" : "none")};
    box-shadow: ${(props) =>
      !props.disabled ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "none"};
  }

  &:disabled {
    opacity: 1;
    color: ${(props) => props.$color};
    background: ${(props) => props.$bg};
    border-color: ${(props) => props.$borderColor};
  }
`;

// --- Word Bank Components ---

/** Sticky wrapper that stays visible while scrolling through long passages */
export const WordBankWrapper = styled.div`
  position: sticky;
  top: 20px;
  z-index: 1000;
  width: 100%;
  background: #ffffffc9;
  backdrop-filter: blur(8px);
  padding: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  margin-bottom: 15px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  margin-left: 0;
  margin-right: 0;
  transition:
    box-shadow 0.2s ease,
    background 0.2s ease;
  will-change: box-shadow;
`;

export const WordBankContainer = styled.div`
  display: grid;
  grid-template: max-content / repeat(15, auto);
  gap: 5px;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  height: -moz-fit-content;
  height: fit-content;
  padding: 8px;
  justify-items: start;

  scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  &scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  ::-webkit-scrollbar {
    height: 5px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
`;

/** Individual word chip in the word bank, with a "used" state toggle */
export const WordChip = styled.div`
  display: inline-block;
  padding: 5px 12px;
  background: ${(props) =>
    props.$used ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.9)"};
  color: ${(props) => (props.$used ? "#999" : "#333")};
  border: 1px solid
    ${(props) => (props.$used ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.15)")};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: default;
  transition: all 0.3s ease;
  text-decoration: ${(props) => (props.$used ? "line-through" : "none")};
  white-space: nowrap;
  height: 36px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: ${(props) => (!props.$used ? "translateY(-2px)" : "none")};
    box-shadow: ${(props) =>
      !props.$used ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none"};
  }
`;

// --- Input & Form Elements ---

/** Base input field for marathon quiz answers */
export const BaseMarathonInput = styled.input`
  padding: 12px 16px;
  font-size: 18px;
  border: 2px solid ${(props) => props.$borderColor || "#e0e0e0"};
  border-radius: 10px;
  text-align: center;
  outline: none;
  transition: all 0.2s;
  font-family: var(--font-primary);

  &:focus {
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  &:disabled {
    background: #f9f9f9;
    cursor: not-allowed;
  }

  /* Hide numeric spinners for a cleaner look */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;

export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

// --- Loading & State Indicators ---

export const loadingPulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
`;

/** Container for the loading state during data fetching or AI processing */
export const LoadingContainer = styled.div`
  background: #fdfdfd;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
`;

export const LoadingSpinner = styled.div`
  color: #ff5722;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  animation: ${loadingPulse} 1.5s ease-in-out infinite;
`;

export const LoadingText = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #444;
  font-family: var(--font-primary);
`;

/** Small box for displaying session statistics (e.g., questions solved) */
export const StatBox = styled.div`
  background: white;
  padding: 15px 25px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #eee;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  min-width: 120px;

  .value {
    font-size: 1.8rem;
    font-weight: 800;
    color: #ff9800;
    margin-bottom: 4px;
    line-height: 1;
  }

  .label {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #888;
  }
`;
