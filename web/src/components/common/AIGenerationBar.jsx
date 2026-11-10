/**
 * @file AIGenerationBar.jsx
 * @description A reusable AI generation control bar that allows users to configure
 * parameters like count, difficulty, and length for AI-generated content.
 * @dependencies react, styled-components, ./GeminiGenerator, ../../styles/Flex.style
 * @exports AIGenerationBar
 * @interconnections Integrates with GeminiGenerator to trigger AI content creation based on user inputs.
 */

import { useState } from "react";
import styled from "styled-components";
import GeminiGenerator from "./GeminiGenerator";
import { Flex } from "../../styles/Flex.style";

// Styled basic input element with consistent branding
const Input = styled.input`
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #ff5722;
  }
`;

// Styled select dropdown for difficulty and length settings
const Select = styled.select`
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background-color: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #ff5722;
  }
`;

// Container for the entire generation bar
const BarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
`;

// Column layout for input fields
const InputsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
`;

// Row layout for individual labels and inputs
const InputRow = styled(Flex)`
  align-items: center;
  gap: 10px;
`;

// Standardized label text styling
const LabelText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
  min-width: ${(props) => props.$minWidth || "130px"};
  margin-left: ${(props) => props.$ml || "0"};
`;

// Extended input with dynamic width support
const ExtendedInput = styled(Input)`
  max-width: ${(props) => props.$maxWidth || "100%"};
  width: 100%;
`;

// Extended select with dynamic width support
const ExtendedSelect = styled(Select)`
  width: 100%;
  max-width: ${(props) => props.$maxWidth || "100%"};
`;

// Custom styled version of the GeminiGenerator trigger button
const StyledGeminiGenerator = styled(GeminiGenerator)`
  padding: 10px 25px;
  font-size: 14px;
  align-self: flex-end;
  font-weight: 700;
`;

/**
 * A reusable AI Generation Bar component.
 *
 * @param {string} mode - "count" for numerical generation (e.g., questions), "topic" for text-based generation (e.g., passages)
 * @param {string} apiMode - The backend prompt template identifier (e.g., "passage", "vocab")
 * @param {string} label - Display label for the primary input
 * @param {string} placeholder - Input placeholder text
 * @param {number|string} defaultValue - Initial value for the input
 * @param {function} onStream - Callback function executed for each chunk of AI response stream
 * @param {function} onComplete - Callback function executed when the AI response finishes
 * @param {function} onError - Callback function for handling generation errors
 * @param {function} onStart - Callback function executed when the generation process begins
 * @param {string} buttonText - Label for the generation button
 * @param {string} userToken - Authentication token for the AI API
 */
const AIGenerationBar = ({
  mode = "count",
  apiMode,
  label = "Generate:",
  placeholder = "",
  defaultValue,
  onStream,
  onComplete,
  onError,
  onStart,
  buttonText = "Generate with AI",
  userToken,
}) => {
  const isCount = mode === "count";
  const initialVal =
    defaultValue !== undefined ? defaultValue : isCount ? 50 : "";

  // Local state for user-adjustable parameters
  const [inputValue, setInputValue] = useState(initialVal);
  const [difficulty, setDifficulty] = useState("Medium");
  const [length, setLength] = useState("Short (~150 words)");

  // Sync input value with constraints based on mode
  const handleInputChange = (e) => {
    if (isCount) {
      const val = parseInt(e.target.value);
      // Ensure count stays within a reasonable 1-100 range
      const clamped = Math.max(1, Math.min(100, isNaN(val) ? 1 : val));
      setInputValue(clamped);
    } else {
      setInputValue(e.target.value);
    }
  };

  // Construct the payload to be sent to the AI service
  const payloadParams = isCount
    ? { count: inputValue, difficulty }
    : { topic: inputValue, difficulty, length };

  return (
    <BarContainer>
      <InputsColumn>
        {/* Primary Input Row: Count or Topic */}
        <InputRow>
          <LabelText>{label}</LabelText>
          <ExtendedInput
            type={isCount ? "number" : "text"}
            min={isCount ? "1" : undefined}
            max={isCount ? "100" : undefined}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            $maxWidth={isCount ? "80px" : "400px"}
          />
        </InputRow>

        {/* Configuration Row: Difficulty and (optional) Length */}
        <InputRow>
          <LabelText>Difficulty:</LabelText>
          <ExtendedSelect
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            $maxWidth={mode === "topic" ? "180px" : "400px"}
          >
            <option value="Very Easy">Very Easy</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Difficult">Difficult</option>
            <option value="Very Difficult">Very Difficult</option>
          </ExtendedSelect>

          {mode === "topic" && (
            <>
              <LabelText $ml="20px">Length:</LabelText>
              <ExtendedSelect
                value={length}
                onChange={(e) => setLength(e.target.value)}
                $maxWidth="180px"
              >
                <option value="Short (~150 words)">Short (~150 words)</option>
                <option value="Medium (~300 words)">Medium (~300 words)</option>
                <option value="Long (~600+ words)">Long (~600+ words)</option>
              </ExtendedSelect>
            </>
          )}
        </InputRow>
      </InputsColumn>

      {/* The component that actually handles the API call and streaming */}
      <StyledGeminiGenerator
        buttonText={buttonText}
        apiMode={apiMode}
        params={payloadParams}
        onStream={onStream}
        onComplete={onComplete}
        onError={onError}
        onStart={onStart}
        token={userToken}
      />
    </BarContainer>
  );
};

export default AIGenerationBar;
