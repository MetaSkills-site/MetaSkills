/**
 * FILE PURPOSE: QuestionPreview — Provides a high-fidelity visual preview of questions during creation.
 *
 * ROLE:
 * Allows administrators to see exactly how a question will appear to users.
 * It combines the raw editor state (Slate context) with the production
 * QuestionBlock and ResultDisplay components, simulating a "Correct Answer" state.
 *
 * DEPENDENCIES:
 * - EditorContext: Source for live question/option/explanation state.
 * - QuestionBlock: Primary question renderer.
 * - QuizResultDisplay: Standard post-answer feedback component.
 * - styled-components: For preview container containment.
 *
 * EXPORTS:
 * - QuestionPreview (default): The functional component rendering the preview pane.
 *
 * INTERCONNECTIONS:
 * - Consumed by the Admin AddQuestions interface.
 */
import { useContext } from "react";
import { EditorContext } from "../context/EditorContext";
import QuestionBlock from "./QuestionBlock";
import styled from "styled-components";
import QuizResultDisplay from "./common/QuizResultDisplay";

/* ─── Styled Components ─── */

const PreviewContainer = styled.div`
  background: #ffffff;
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 1000px;
  margin: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
`;

/* ─── Main Component ─── */

function QuestionPreview() {
  const { question, options, explanation, contextAttachment } =
    useContext(EditorContext);

  let correctAnswer = "";
  let displayCorrectAnswer = "";

  /**
   * DATA RESOLUTION LOGIC
   * Maps editor state 'options' into values expected by QuestionBlock
   * and QuizResultDisplay components. Handles MCQ vs Fill/SA types.
   */
  if (options.type === "MCQ") {
    const labels = ["A", "B", "C", "D"];
    // Safe index-to-label mapping for MCQ options.
    if (options.mcq?.correct !== null && options.mcq?.correct !== undefined) {
      correctAnswer = labels[options.mcq.correct];
      displayCorrectAnswer = options.mcq.correct; // QuizResultDisplay handles numeric index for MCQ.
    }
  } else if (options.type === "fillInTheBlanks") {
    correctAnswer = options.fillInTheBlanks;
    displayCorrectAnswer = correctAnswer;
  } else {
    correctAnswer = options.sa;
    displayCorrectAnswer = correctAnswer;
  }

  /**
   * MOCK RESULT OBJECT
   * Simulates a 100% correct response for the preview.
   */
  const resultProps = {
    correct: true,
    correctAnswer: displayCorrectAnswer,
    explanation: explanation,
    accuracy: 100,
    message: "Preview Mode",
    carrotsAwarded: 0,
  };

  return (
    <PreviewContainer>
      {/* ─── Visual Question Block ─── */}
      <QuestionBlock
        question={{
          slate: question,
          contextAttachmentId: contextAttachment,
          correctOption: correctAnswer,
        }}
        options={options}
        explanation={explanation}
        readOnly={true} // Disable user interaction in preview
        selectedAnswer={correctAnswer}
        isCorrect={true}
      />

      {/* ─── Visual Result Feedback ─── */}
      <div style={{ marginTop: "30px" }}>
        <QuizResultDisplay
          result={resultProps}
          answerType={options.type}
          options={options}
          onNext={() => {}}
          nextLabel="Preview Mode"
        />
      </div>
    </PreviewContainer>
  );
}

export default QuestionPreview;
