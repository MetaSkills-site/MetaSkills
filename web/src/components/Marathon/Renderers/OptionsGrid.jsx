/**
 * @file OptionsGrid.jsx
 * @description Renders marathon choice options by bridging common option grids with marathon-specific fuzzy validation logic and dynamic layouts.
 * @architecture Marathon presentation component calculating layout strategies (list vs grid) based on option content length.
 * @agent_note Adapts answer evaluation via validateAnswer to support text tolerance and percentage thresholds.
 */

/**
 * Proxies to Common/OptionsGrid while injecting Marathon-specific validation and layout logic.
 *
 * DEPENDENCIES:
 * - CommonOptionsGrid: Core UI component for rendering grids of choice.
 * - answerValidation: Logic for checking correctness with fuzzy-match support.
 *
 * EXPORTS:
 * - OptionsGrid: Specialized option renderer (consumed by Decode.jsx).
 *
 * INTERCONNECT:
 * - Implements dynamic layout detection ('grid' vs 'list') based on average content length.
 * - Bridges 'CommonOptionsGrid' with 'validateAnswer' for subject-agnostic grading.
 */
import CommonOptionsGrid from "../../common/OptionsGrid";
import { validateAnswer } from "../../../utils/answerValidation";

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {Array<string|Object>} props.options - Array of answer choices.
 * @param {Array<string>} props.userAnswers - Currently selected answers array.
 * @param {boolean} props.submitted - Whether the current choice has been submitted.
 * @param {Function} props.handleAnswerChange - Callback handling answer choice updates.
 * @param {Object} props.questionData - Complete question configuration schema.
 * @param {Array<string>} [props.correctAnswers] - Explicit correct answer tokens for post-submission verification.
 * @returns {JSX.Element|null} The rendered options grid or list layout.
 */
const OptionsGrid = ({
  options,
  userAnswers,
  submitted,
  handleAnswerChange,
  questionData,
  correctAnswers,
}) => {
  if (!Array.isArray(options) || options.length === 0) return null;

  // Custom validation logic for Marathon (Text/Fuzzy matching)
  const checkIsCorrect = (option, correctAnswer) => {
    // option is the standardized object from CommonOptionsGrid
    const validation = validateAnswer(
      option.originalValue,
      correctAnswer,
      questionData,
    );

    return validation.isCorrect === true || validation.isCorrect >= 100;
  };

  // Determine layout based on content length?
  // For now, let's default to 'list' as Marathon often has sentences/definitions.
  // If we want grid for short words, we could check average length.
  const avgLength =
    options.reduce(
      (acc, opt) => acc + (typeof opt === "string" ? opt.length : 0),
      0,
    ) / options.length;
  const layout = avgLength < 20 ? "grid" : "list";

  return (
    <CommonOptionsGrid
      options={options}
      selectedAnswer={userAnswers?.[0]}
      correctAnswer={correctAnswers || questionData?.answers}
      isSubmitted={submitted}
      readOnly={submitted}
      onSelect={(val, option) => {
        if (!submitted) {
          handleAnswerChange(0, option.originalValue);
        }
      }}
      layout={layout}
      checkIsCorrect={checkIsCorrect}
    />
  );
};

export default OptionsGrid;
