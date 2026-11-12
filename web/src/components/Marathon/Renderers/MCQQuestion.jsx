/**
 * @file MCQQuestion.jsx
 * @description Multiple-choice question renderer with support for audio pronunciation on target vocabulary words and passage highlights.
 * @architecture Marathon presentation renderer coordinating instructions, text passages, and option grids.
 * @agent_note Automatically extracts quoted words from instructions to wrap in AudioWord for interactive TTS pronunciation.
 */

import AudioWord from "../../AudioWord";
import OptionsGrid from "./OptionsGrid";
import HighlightedText from "../../shared/HighlightedText";
import styled from "styled-components";
import {
  InstructionText,
  PassageContainer,
  PassageContentWrapper,
} from "../MarathonStyles";

const StyledUnderline = styled.u`
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1.5px;
  text-decoration-color: inherit;
`;

/**
 * Splits an instruction string around a quoted word (e.g. "ephemeral") and
 * returns [before, word, after] so we can wrap just the word in <AudioWord>.
 * Returns null if no quoted word is found.
 */
function parseQuotedWord(instruction) {
  const match = instruction.match(/^([\s\S]*)"([^"]+)"([\s\S]*)$/);
  if (!match) return null;
  return { before: match[1], word: match[2], after: match[3] };
}

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.questionData - Question configuration containing options, instructions, and passage text.
 * @param {Array<string>} props.userAnswers - Currently selected option IDs or values.
 * @param {boolean} props.submitted - Whether the question has been submitted for evaluation.
 * @param {Function} props.handleAnswerChange - Callback triggered when an option is selected.
 * @param {Array<string>} [props.correctAnswers] - Correct answer keys used to decorate post-submission states.
 * @returns {JSX.Element} The rendered multiple choice question component.
 */
const MCQQuestion = ({
  questionData,
  userAnswers,
  submitted,
  handleAnswerChange,
  correctAnswers,
}) => {
  // Check if text has {{}} highlighting (grammar/passage questions)
  const hasHighlights =
    questionData.text &&
    questionData.text.includes("{{") &&
    questionData.text.includes("}}");

  // For vocab MCQ: text is empty but the word is quoted inside instruction
  const parsedInstruction =
    !hasHighlights && questionData.instruction
      ? parseQuotedWord(questionData.instruction)
      : null;

  return (
    <div>
      {parsedInstruction ? (
        /* Render instruction with the quoted word wrapped in <AudioWord> */
        <InstructionText>
          {parsedInstruction.before}
          <AudioWord>{parsedInstruction.word}</AudioWord>
          {parsedInstruction.after}
        </InstructionText>
      ) : (
        <InstructionText>{questionData.instruction}</InstructionText>
      )}

      {questionData.text && (
        <PassageContainer>
          <PassageContentWrapper $transparent={hasHighlights}>
            {hasHighlights ? (
              <HighlightedText
                text={questionData.text}
                HighlightComponent={StyledUnderline}
              />
            ) : (
              questionData.text
            )}
          </PassageContentWrapper>
        </PassageContainer>
      )}

      <OptionsGrid
        options={questionData.options}
        userAnswers={userAnswers}
        submitted={submitted}
        handleAnswerChange={handleAnswerChange}
        questionData={questionData}
        correctAnswers={correctAnswers}
      />
    </div>
  );
};

export default MCQQuestion;
