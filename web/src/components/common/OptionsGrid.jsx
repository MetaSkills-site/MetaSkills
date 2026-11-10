/**
 * FILE PURPOSE: A high-level layout component that normalizes multiple question formats
 * (Marathon vs. Modules) into a uniform options grid for MCQ questions.
 *
 * DEPENDENCIES:
 * - OptionCard: Individual option display component for each MCQ choice.
 * - styled-components: For responsive grid layout styling.
 *
 * EXPORTS:
 * - OptionsGrid: Grid container for question options (consumed by QuestionBlock.jsx, Marathon renderers).
 *
 * INTERCONNECT:
 * - Normalizes data from various formats (Marathon strings vs. Module Slate objects).
 * - Implements bidirectional correctness logic (handles labels like 'A' and unique IDs).
 * - Manages selection states and visual feedback (correct/incorrect) post-submission.
 */

import styled from "styled-components";
import OptionCard from "./OptionCard";

/**
 * GridContainer: Handles the responsive layout of the options.
 * Switches between 1 and 2 columns based on the 'layout' prop and screen width.
 */
const GridContainer = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: ${(props) =>
    props.$layout === "list" ? "1fr" : "1fr 1fr"};
  gap: 20px;
  margin: 20px auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OptionsGrid = ({
  options,
  selectedAnswer,
  correctAnswer,
  isSubmitted,
  onSelect,
  readOnly,
  layout = "grid", // 'grid' | 'list'
  checkIsCorrect, // Optional: (option, correctAnswer) => boolean
}) => {
  // 1. Data Normalization: Converge different data structures into a unified format
  let normalizedOptions = [];
  const labels = ["A", "B", "C", "D", "E", "F"];

  if (!options) return null;

  if (Array.isArray(options)) {
    // Check if it's an Array of Strings (Marathon) or Objects (Modules)
    if (typeof options[0] === "string" || typeof options[0] === "number") {
      // Marathon Format: Simple array of strings
      normalizedOptions = options.map((opt, index) => ({
        id: `opt-${index}-${typeof opt === "string" ? opt.substring(0, 8) : index}`, // Generate unique ID
        label: labels[index], // Map index to A, B, C...
        content: opt,
        originalValue: opt,
      }));
    } else {
      // Module Format: Complex array of objects containing Slate/HTML content
      normalizedOptions = options.map((opt, index) => ({
        id: opt._id || opt.id || labels[index], // Prefer database ID, fallback to label
        label: labels[index],
        content: opt.slate || opt.html || opt.text,
        originalValue: opt,
      }));
    }
  } else if (typeof options === "object") {
    // Module/Editor Format: Object with keys { A: ..., B: ... } or { mcq: [...] }
    const rawOptions = options.mcq || options;

    if (Array.isArray(rawOptions)) {
      // Handle nested array inside 'mcq' key
      if (typeof rawOptions[0] === "string") {
        normalizedOptions = rawOptions.map((opt, index) => ({
          id: opt,
          label: labels[index],
          content: opt,
          originalValue: opt,
        }));
      } else {
        normalizedOptions = rawOptions.map((opt, index) => ({
          id: opt._id || opt.id || labels[index],
          label: labels[index],
          content: opt.slate || opt.html || opt.text,
          originalValue: opt,
        }));
      }
    } else {
      // Direct object keys (e.g., options.A, options.B)
      const keys = labels.filter((k) => rawOptions[k]);
      normalizedOptions = keys.map((key) => {
        const opt = rawOptions[key];
        return {
          id: opt._id || opt.id || key,
          label: key,
          content: opt.slate || opt.html || opt.text || opt,
          originalValue: opt,
        };
      });
    }
  }

  // 2. Rendering: Map normalized options to OptionCard components
  return (
    <GridContainer $layout={layout}>
      {normalizedOptions.map((option) => {
        // Selection Logic: Matches by ID, Label (A/B), or original value
        const isSelected =
          selectedAnswer === option.id ||
          selectedAnswer === option.label ||
          selectedAnswer === option.originalValue;

        // Status Logic: Determines if the card should show correct/incorrect styling
        let status = "neutral";
        if (isSubmitted || readOnly) {
          let isCorrectOption = false;

          if (checkIsCorrect) {
            // Use custom validator if provided
            isCorrectOption = checkIsCorrect(option, correctAnswer);
          } else {
            // Default Logic: Handle both array and single value correct answers
            if (Array.isArray(correctAnswer)) {
              isCorrectOption =
                correctAnswer.includes(option.id) ||
                correctAnswer.includes(option.originalValue);
            } else {
              isCorrectOption =
                correctAnswer === option.id ||
                correctAnswer === option.originalValue ||
                correctAnswer === option.label;
            }
          }

          if (isCorrectOption) {
            status = "correct";
          } else if (isSelected) {
            status = "incorrect";
          }
        }

        return (
          <OptionCard
            key={option.id}
            label={option.label}
            content={option.content}
            selected={isSelected}
            status={status}
            isSubmitted={isSubmitted}
            readOnly={readOnly || isSubmitted}
            onClick={() => onSelect(option.label || option.id, option)} // Emit label or ID for parent state management
            layout={layout}
          />
        );
      })}
    </GridContainer>
  );
};

export default OptionsGrid;
