/**
 * FILE PURPOSE: SmartBlankInput — An enhanced text input with word-bank autocomplete.
 *
 * ROLE:
 * Provides an interactive fill-in-the-blank experience. As users type, it filters
 * a provided "word bank" to suggest matches, allowing for fast, accurate entries
 * and reducing typing fatigue in mobile or high-speed marathon contexts.
 *
 * DEPENDENCIES:
 * - react hooks: useState, useRef, useEffect for state and suggestion lifecycle.
 * - styled-components: For suggestion dropdown positioning and active state highlighting.
 * - ../admin/AdminStyles: Reuses StyledBlankInput for consistent UI across the platform.
 *
 * EXPORTS:
 * - SmartBlankInput (default): The functional component with autocomplete logic.
 * - SuggestionBox/SuggestionItem/InputWrapper: For potential external layout adjustments.
 *
 * INTERCONNECTIONS:
 * - Used in Passage and Grammar renderers where a word bank is provided by the backend.
 */
import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { StyledBlankInput } from "../admin/AdminStyles";

/* ─── Styled Components ─── */

const SuggestionBox = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 150px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 5px 0;
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  background: ${(props) => (props.$active ? "#f0f4ff" : "transparent")};
  color: ${(props) => (props.$active ? "#1976d2" : "#333")};
  &:hover {
    background: #f5f5f5;
  }
`;

const InputWrapper = styled.span`
  position: relative;
  display: inline-block;
`;

/* ─── Main Component ─── */

export default function SmartBlankInput({
  value,
  onChange,
  disabled = false,
  wordBank = [],
  status,
  title = "",
  placeholder = "",
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  /**
   * SUGGESTION FILTER LOGIC
   * Triggered on value or wordBank change.
   * Filters the wordBank for words starting with the current input (case-insensitive).
   * Excludes exact matches to avoid redundant suggestions.
   */
  useEffect(() => {
    if (showSuggestions && value && wordBank.length > 0) {
      const filtered = wordBank.filter(
        (w) =>
          w.toLowerCase().startsWith(value.toLowerCase()) &&
          w.toLowerCase() !== value.toLowerCase(),
      );
      // Ensure unique suggestions to handle potential backend data duplication
      const uniqueFiltered = [...new Set(filtered)];
      setSuggestions(uniqueFiltered);
      setActiveIndex(0); // Reset selection index when list changes
    } else {
      setSuggestions([]);
    }
  }, [value, showSuggestions, wordBank]);

  /**
   * KEYBOARD NAVIGATION LOGIC
   * Handles ArrowDown, ArrowUp, Enter/Tab, and Escape for the suggestion dropdown.
   */
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault(); // Prevent cursor moving in input
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Tab" || e.key === "Enter") {
      // Confirm the currently highlighted suggestion
      e.preventDefault();
      confirmSelection(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  /**
   * confirmSelection
   * Updates parent state and manages focus lifecycle.
   */
  const confirmSelection = (word) => {
    if (!word) return;
    onChange(word);
    setShowSuggestions(false);

    // Blur then re-focus ensures mobile keyboards and screen readers handle the update correctly.
    inputRef.current?.blur();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleBlur = () => {
    // Timeout allows the onMouseDown of a SuggestionItem to fire before the box is hidden.
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <InputWrapper ref={containerRef}>
      <StyledBlankInput
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => {
          if (value) setShowSuggestions(true);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        $status={status}
        title={title}
        placeholder={placeholder}
        autoComplete="off"
      />
      {/* ─── Suggestion Dropdown ─── */}
      {showSuggestions && suggestions.length > 0 && !disabled && (
        <SuggestionBox>
          {suggestions.map((word, idx) => (
            <SuggestionItem
              key={idx}
              $active={idx === activeIndex}
              onMouseDown={(e) => {
                // Prevent input blur so click can register correctly
                e.preventDefault();
                confirmSelection(word);
              }}
            >
              {word}
            </SuggestionItem>
          ))}
        </SuggestionBox>
      )}
    </InputWrapper>
  );
}

export { SuggestionBox, SuggestionItem, InputWrapper };
