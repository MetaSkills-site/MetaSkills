import { useEffect } from "react";
import styled from "styled-components";
import { InstructionText, WordContainer } from "../MarathonStyles";
import { getFeedbackStyle } from "../../../utils/feedbackStyles";
import { normalizeAnswer } from "../../../utils/answerValidation";

// Styled component for the word span
const WordSpan = styled.span`
  cursor: ${(props) => (props.$submitted ? "default" : "pointer")};
  padding: 2px 10px;
  border-radius: 10px;
  background-color: ${(props) => props.$backgroundColor};
  border: none;
  color: ${(props) => props.$color};
  box-shadow: ${(props) => props.$boxShadow};
  transition: all 0.2s;
  font-size: 1rem;
  font-weight: ${(props) => (props.$isSelected ? "900" : "600")};
  display: inline-block;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;

  &:hover {
    filter: ${(props) => (!props.$submitted ? "brightness(0.95)" : "none")};
    box-shadow: ${(props) =>
      !props.$submitted ? "0 4px 8px rgba(0,0,0,0.1)" : props.$boxShadow};
    transform: ${(props) => (!props.$submitted ? "translateY(-1px)" : "none")};
  }
`;

const GrammarQuestion = ({
  questionData,
  userAnswers,
  submitted,
  handleAnswerChange,
  onInvalidQuestion,
  correctAnswers,
}) => {
  const words = questionData.text.split(" ");

  useEffect(() => {
    if (
      (!questionData.answers || questionData.answers.length === 0) &&
      !questionData.token
    ) {
      // Question might be in secure mode or broken - allow rendering anyway
    }
  }, [questionData, onInvalidQuestion]);

  return (
    <div>
      <InstructionText>{questionData.instruction}</InstructionText>
      <WordContainer>
        {words.map((word, index) => {
          const isSelectedRaw = userAnswers.includes(word);

          // Determine valid answers
          const validAnswers = correctAnswers || questionData.answers;

          // Normalize word for comparison (remove punctuation)
          const cleanWord = normalizeAnswer(word);

          // Check if this word is in the correct answers
          let isCorrect = false;
          if (validAnswers) {
            isCorrect = validAnswers.some(
              (ans) => normalizeAnswer(ans) === cleanWord,
            );
          }

          // Get feedback style based on state
          const feedbackStyle = getFeedbackStyle({
            isSelected: isSelectedRaw,
            isCorrect: submitted ? isCorrect : undefined,
            isSubmitted: submitted,
            useNeutral: true, // Grammar uses neutral default colors
          });

          // Special handling for missed correct answers (show with dashed border)
          let boxShadow = feedbackStyle.boxShadow;
          if (submitted && isCorrect && !isSelectedRaw) {
            // Missed correct answer - show with dashed border
            boxShadow = "inset 0 0 0 1px dashed #4caf50";
          }

          return (
            <WordSpan
              key={index}
              onClick={() => !submitted && handleAnswerChange(0, word)}
              $submitted={submitted}
              $backgroundColor={feedbackStyle.backgroundColor}
              $color={feedbackStyle.color}
              $boxShadow={boxShadow}
              $isSelected={isSelectedRaw}
            >
              {word}
            </WordSpan>
          );
        })}
      </WordContainer>
    </div>
  );
};

export default GrammarQuestion;
