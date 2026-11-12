/**
 * @file PassageQuestion.jsx
 * @description Interactive fill-in-the-blank passage renderer supporting optional word banks and inline feedback.
 * @architecture Marathon presentation component parsing text with `[_]` blank placeholders and injecting smart blank inputs.
 * @agent_note Sanitizes HTML segments using DOMPurify and checks user answers against correct answer tokens after submission.
 */

import DOMPurify from "dompurify";
import { Fragment } from "react";
import SmartBlankInput from "../../shared/SmartBlankInput";
import InlineBlankFeedback from "../../shared/InlineBlankFeedback";
import {
  PassageContainer,
  PassageContentWrapper,
  WordBankWrapper,
  WordBankContainer,
  WordChip,
} from "../MarathonStyles";

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.questionData - Question configuration containing passage text with `[_]` placeholders.
 * @param {Array<string>} props.userAnswers - Array of user-provided answers matching each blank index.
 * @param {boolean} props.submitted - Whether the passage question has been submitted for verification.
 * @param {Function} props.handleAnswerChange - Callback handling answer updates for individual blank inputs.
 * @param {Array<string>} [props.wordBank] - Optional list of bank words available to assist in completing blanks.
 * @param {Array<string>} [props.correctAnswers] - Correct answer values used for inline submission evaluation.
 * @returns {JSX.Element} The rendered fill-in-the-blank passage and word bank component.
 */
const PassageQuestion = ({
  questionData,
  userAnswers,
  submitted,
  handleAnswerChange,
  wordBank,
  correctAnswers,
}) => {
  const parts = questionData.text.split("[_]");

  const wordBankContent =
    wordBank && wordBank.length > 0 ? (
      <WordBankWrapper>
        <WordBankContainer>
          {wordBank.map((word, idx) => (
            <WordChip key={idx}>{word}</WordChip>
          ))}
        </WordBankContainer>
      </WordBankWrapper>
    ) : null;

  return (
    <PassageContainer>
      {wordBankContent}
      <PassageContentWrapper>
        <div style={{ paddingTop: "15px" }}>
          {parts.map((part, index) => {
            return (
              <Fragment key={index}>
                <span
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part) }}
                />
                {index < parts.length - 1 &&
                  (submitted ? (
                    (() => {
                      const userAnswer = userAnswers[index]?.trim() || "";
                      const validAnswers =
                        correctAnswers || questionData.answers;
                      const correctAnswer = validAnswers
                        ? validAnswers[index]?.trim()
                        : null;

                      const isCorrect = correctAnswer
                        ? userAnswer.toLowerCase() ===
                          correctAnswer.toLowerCase()
                        : false;

                      if (correctAnswer) {
                        return (
                          <InlineBlankFeedback
                            userAnswer={userAnswer}
                            correctAnswer={correctAnswer}
                            isCorrect={isCorrect}
                          />
                        );
                      } else {
                        // Fallback for when we don't have the answer (should be rare)
                        return (
                          <span
                            style={{
                              color: "#666",
                              fontWeight: "bold",
                              margin: "0 4px",
                            }}
                          >
                            {userAnswer}
                          </span>
                        );
                      }
                    })()
                  ) : (
                    <SmartBlankInput
                      value={userAnswers[index] || ""}
                      onChange={(val) => handleAnswerChange(index, val)}
                      disabled={submitted}
                      status={undefined}
                      title=""
                      wordBank={wordBank}
                    />
                  ))}
              </Fragment>
            );
          })}
        </div>
      </PassageContentWrapper>
    </PassageContainer>
  );
};

export default PassageQuestion;
