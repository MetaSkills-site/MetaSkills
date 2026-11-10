/**
 * @file QuestionEntryPage.jsx
 * @description Orchestrates the multi-step question creation and editing workflow using a wizard-like interface.
 *
 * Dependencies:
 * - react-router-dom: Accesses routing state for editing existing questions.
 * - EditorContext: Centralized state management for the question, options, and explanation.
 * - validateStep: Utility function to ensure data integrity before proceeding to the next step.
 * - CustomStepper: UI component for visualizing and navigating progress.
 *
 * Exports:
 * - QuestionEntryPage (default): The root component that initializes the editor provider and content.
 *
 * Interconnections:
 * - Communicates with WriteQuestion, WriteAnswer, WriteExplanation, AttachContext, and EditModule for each step.
 * - Wraps content in EditorProvider to ensure shared state across the wizard.
 */

import { useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import Stepper from "../../components/admin/CustomStepper";
import { Flex } from "../../styles/Flex.style";
import { validateStep } from "../../utils/questionValidation";

import AnswerWriter from "../../components/AnswerWriter";
import ExplanationWriter from "../../components/ExplanationWriter";
import QuestionWriter from "../../components/QuestionWriter";
import EditorContext, { EditorProvider } from "../../context/EditorContext";
import QuestionPreview from "../../components/QuestionPreview";
import AttachContext from "../../components/admin/AttachContext";
import ModuleEditor from "../../components/ModuleEditor.jsx";
import { Wrapper, PageContainer } from "../../components/admin/AdminStyles.jsx";
import AdminHeader from "../../components/admin/AdminHeader";

/**
 * Styled wrapper for the multi-step progress bar.
 */
const StepperWrapper = styled.div`
  width: 70%;
  margin: 40px auto;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2));
  > div > div > div > a {
    font-weight: 500 !important;
  }
`;

/**
 * AddQuestionsContent Component
 * @description The internal component that manages step transitions and rendering logic.
 */
function AddQuestionsContent() {
  const { question, options, explanation, setOptions } =
    useContext(EditorContext);
  let [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Labels for the header based on the current step.
  const headerTexts = [
    "Write your question here",
    "Write the correct answer here",
    "Write the explanation here",
    "Attach context (optional)",
    "Preview",
    "Select module",
  ];

  /**
   * Final submission logic triggered at the last step.
   */
  const submitQuestion = async () => {
    setIsSubmitting(true);
    console.log(question, options, explanation);
    // Note: Actual API persistence is primarily handled within the EditModule component.
    try {
      // Simulate real submission wait to prevent double-click issues.
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Advances the wizard to the next step after validation.
   */
  const handleNext = async () => {
    if (isSubmitting) return;
    // Validate the current step's input before allowing progression.
    if (
      validateStep(step, {
        question,
        options,
        explanation,
        setOptions,
      })
    ) {
      if (step === 5) await submitQuestion();
      else setStep((prev) => prev + 1);
    }
  };

  /**
   * Returns the wizard to the previous step.
   */
  const handlePrevious = () => {
    setStep((prev) => (prev > 0 ? prev - 1 : 0));
  };

  return (
    <Wrapper>
      <PageContainer>
        {/* Dynamic header based on the current creation stage. */}
        <AdminHeader
          title={headerTexts[step]}
          backPath="/admin"
          disableShortcut={step > 0}
        />
        {(() => {
          // Render the appropriate component for each step of the wizard.
          switch (step) {
            case 0:
              return <QuestionWriter />;
            case 1:
              return <AnswerWriter />;
            case 2:
              return <ExplanationWriter />;
            case 3:
              return <AttachContext />;
            case 4:
              return <QuestionPreview />;
            case 5:
              return <ModuleEditor />;
            default:
              return null;
          }
        })()}
        <Flex>
          <StepperWrapper>
            {/* Visual stepper component for navigation. */}
            <Stepper
              steps={[
                { title: "Write question" },
                { title: "Write answer" },
                { title: "Write explanation" },
                { title: "Attach context" },
                { title: "Preview" },
                { title: "Post 🎉" },
              ]}
              activeStep={step}
              activeColor="#f3522eff"
              size={20}
              circleFontSize={10}
              titleFontSize={14}
              completeBarColor="#f3522eff"
              onNext={handleNext}
              onPrev={step > 0 ? handlePrevious : undefined}
              isNextDisabled={isSubmitting}
            />
          </StepperWrapper>
        </Flex>
      </PageContainer>
    </Wrapper>
  );
}

/**
 * AddQuestions Entry Component
 * @description Handles initialization logic, especially when editing an existing question.
 */
export default function QuestionEntryPage() {
  const location = useLocation();

  let initialValues = {};
  // If editing an existing question, normalize its data structure for the editor.
  if (location.state && location.state.question) {
    const q = location.state.question;
    let options = q.options;

    // Normalize MCQ options: The backend provides an array, but the frontend editor expects an object with A, B, C, D keys.
    if (
      q.options &&
      (q.answerType === "MCQ" || q.options.type === "MCQ") &&
      Array.isArray(q.options.mcq)
    ) {
      const mcqArray = q.options.mcq;
      const labels = ["A", "B", "C", "D"];
      const mcqObject = {};
      let correctIndex = -1; // Default to -1 if no match found

      if (mcqArray.length > 4) {
        console.warn(
          `Question ${q._id} has ${mcqArray.length} options. Only the first 4 will be used in the editor.`,
        );
      }

      mcqArray.forEach((opt, index) => {
        if (index < 4) {
          mcqObject[labels[index]] = opt;
          // Identify the correct option by matching IDs.
          if (opt._id === q.correctOption) {
            correctIndex = index;
          }
        }
      });

      options = {
        ...q.options,
        mcq: {
          ...mcqObject,
          correct: correctIndex,
        },
        type: "MCQ",
      };
    }

    // Prepare the initial state for the EditorProvider.
    initialValues = {
      question: q.question?.slate || q.question,
      options: options,
      explanation: q.explanation?.slate || q.explanation,
      questionId: q._id,
      tags: q.tags || [],
      skills: q.skills || [],
      contextAttachmentId:
        q.contextAttachmentId?._id ||
        q.contextAttachmentId ||
        q.contextAttachment?._id ||
        null,
      contextAttachment:
        q.contextAttachment ||
        (typeof q.contextAttachmentId === "object"
          ? q.contextAttachmentId
          : null),
    };
  }

  return (
    <EditorProvider initialValues={initialValues}>
      <AddQuestionsContent />
    </EditorProvider>
  );
}
