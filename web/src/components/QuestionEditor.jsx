/**
 * @file EditQuestion.jsx
 * @description Admin component for editing existing quiz questions.
 * It provides a comprehensive editor interface with tabs for modifying the question text,
 * options/answers, explanations, and attached context (passages).
 *
 * @dependencies
 * - react: For state and context management.
 * - EditorContext: Centralized state for the current question being edited.
 * - WriteQuestion, WriteAnswer, WriteExplanation: Sub-editors for different parts of a question.
 * - ContextEditor, ContextSelector: Admin components for managing passage attachments.
 * - axios: For updating data via the backend API.
 * - react-hot-toast: For transaction status feedback.
 * - styled-components: For layout adjustments in the modal.
 * - questionValidation: Utility functions for cross-tab data validation and sanitization.
 *
 * @exports EditQuestion (default)
 * @interconnections Used in the Admin Dashboard when a user clicks to edit a question.
 */

import { useState, useContext } from "react";
import TagInput from "./common/TagInput";
import SkillInput from "./common/SkillInput";
import { EditorProvider, EditorContext } from "../context/EditorContext";
import QuestionWriter from "./QuestionWriter";
import AnswerWriter from "./AnswerWriter";
import ExplanationWriter from "./ExplanationWriter";
import ContextEditor from "./admin/ContextEditor";
import ContextSelector from "./admin/ContextSelector";
import { DialogButtonGroup, DialogButton } from "./admin/AdminStyles";
import AdminTabs from "./admin/AdminTabs";
import toast from "react-hot-toast";
import adminApiClient from "../services/adminApi";
import { API_ENDPOINTS } from "../api/requestMap";
import styled from "styled-components";
import {
  validateQuestionStep,
  validateAnswerStep,
  validateExplanationStep,
  sanitizeQuestionOptions,
} from "../utils/questionValidation";

// Wrapper to constrain editor styles within the modal
const EditorWrapper = styled.div`
  width: 100%;

  /* Override EditorMain margins if possible, or just constrain the container */
  & > div {
    margin: 0 !important;
    width: 100% !important;
    box-shadow: none !important;
  }

  /* Fix for WriteAnswer grid if needed */
  display: flex;
  flex-direction: column;
  gap: 20px;

  /* Scale down for modal to fit better on screen */
  transform: scale(0.85);
  transform-origin: top center;
  width: 117.6%; /* 1 / 0.85 */
  height: 117.6%; /* 1 / 0.85 to counteract scale on height */
  flex: 1;
  margin-left: -8.8%; /* Center the scaled content */
  margin-top: 0px; /* Reduce top spacing */
`;

/**
 * EditQuestionContent Component
 * The internal content of the EditQuestion component, wrapped by EditorProvider.
 */
function EditQuestionContent({
  onClose,
  onSaveSuccess,
  userToken,
  initialTab = "question",
  initialContextData = null,
}) {
  const {
    question,
    options,
    explanation,
    questionId,
    tags,
    setTags,
    skills,
    setSkills,
    setOptions,
    contextAttachmentId,
    setContextAttachmentId,
  } = useContext(EditorContext);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [contextUpdates, setContextUpdates] = useState(null); // To track changes to context content

  /**
   * Validates all tabs and saves the question and its context to the backend.
   */
  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Validation across all editor parts
      const qValid = validateQuestionStep(question);
      if (!qValid.isValid) {
        toast.error(qValid.error);
        setActiveTab("question");
        setSaving(false);
        return;
      }

      const eValid = validateExplanationStep(explanation);
      if (!eValid.isValid) {
        toast.error(eValid.error);
        setActiveTab("explanation");
        setSaving(false);
        return;
      }

      const aValid = validateAnswerStep(question, options, setOptions);
      if (!aValid.isValid) {
        toast.error(aValid.error);
        setActiveTab("answer");
        setSaving(false);
        return;
      }

      let finalOptions = options;
      if (aValid.newOptions) {
        finalOptions = aValid.newOptions;
      }

      // Prepare sanitized payload using centralized logic
      const sanitizedOptions = sanitizeQuestionOptions(
        finalOptions.type,
        finalOptions,
      );

      // Derive strict optionIndex derived from raw options (before sanitization transforms mcq to array)
      let sanitizedOptionIndex = null;
      if (sanitizedOptions.type === "MCQ") {
        sanitizedOptionIndex = options.mcq?.correctAnswerInExtras
          ? options.mcq.originalCorrectOptionId
          : finalOptions.mcq?.correct;
      }

      const payload = {
        id: questionId,
        question: { slate: question },
        answerType: sanitizedOptions.type,
        options: sanitizedOptions,
        explanation: { slate: explanation },
        optionIndex: sanitizedOptionIndex,
        tags,
        skills,
        contextAttachmentId,
      };

      // 2. Update the Question data itself
      await adminApiClient.put(API_ENDPOINTS.detachQuestion.url, payload);

      // 3. Update Context Attachment if it was modified in the context tab
      // Order changed: Question update first, then context attachment update.
      if (
        contextAttachmentId &&
        contextUpdates &&
        contextUpdates._id === contextAttachmentId
      ) {
        await adminApiClient.put(
          API_ENDPOINTS.updateContextAttachment.url({
            id: contextAttachmentId,
          }),
          contextUpdates,
        );
      }
      toast.success("Question updated successfully");
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navigation tabs for switching between editor sections - Unified AdminTabs */}
      <AdminTabs
        tabs={[
          { id: "question", label: "Question" },
          { id: "answer", label: "Answer" },
          { id: "explanation", label: "Explanation" },
          { id: "context", label: "Context" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        layoutId="editQuestionTabIndicator"
        containerStyle={{
          margin: "0 0 20px 0",
          width: "100%",
          justifyContent: "flex-start",
        }}
      />

      {options.type === "MCQ" && options.mcq?.correctAnswerInExtras && (
        <div
          style={{
            padding: "10px 15px",
            backgroundColor: "#fff3cd",
            color: "#856404",
            border: "1px solid #ffeeba",
            borderRadius: "4px",
            marginBottom: "20px",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>⚠️</span>
          <span>
            The correct answer for this question is set to one of the extra
            (hidden) options. Editing the correct answer in this UI is disabled
            to prevent accidental data loss.
          </span>
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <TagInput tags={tags} setTags={setTags} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <SkillInput skills={skills} setSkills={setSkills} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "300px",
          marginBottom: "20px",
        }}
      >
        <EditorWrapper>
          {/* Render the appropriate sub-editor based on the active tab */}
          {activeTab === "question" && <QuestionWriter compact={true} />}
          {activeTab === "answer" && <AnswerWriter compact={true} />}
          {activeTab === "explanation" && <ExplanationWriter compact={true} />}
          {activeTab === "context" && (
            <div style={{ marginTop: "20px" }}>
              {contextAttachmentId ? (
                <ContextEditor
                  contextId={contextAttachmentId}
                  userToken={userToken}
                  onDetach={() => {
                    setContextAttachmentId(null);
                    setContextUpdates(null);
                  }}
                  onUpdate={setContextUpdates}
                  initialData={
                    contextAttachmentId === initialContextData?._id
                      ? initialContextData
                      : null
                  }
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <h3 style={{ color: "#555" }}>No Context Attached</h3>
                  <DialogButton
                    $primary
                    onClick={() => {}}
                    as="div"
                    style={{
                      padding: 0,
                      background: "none",
                      border: "none",
                      boxShadow: "none",
                    }}
                  >
                    <ContextSelector
                      onSelect={setContextAttachmentId}
                      hideLabel={true}
                    />
                  </DialogButton>
                </div>
              )}
            </div>
          )}
        </EditorWrapper>
      </div>

      <DialogButtonGroup>
        <DialogButton onClick={onClose}>Cancel</DialogButton>
        <DialogButton $primary onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </DialogButton>
      </DialogButtonGroup>
    </div>
  );
}

/**
 * EditQuestion Component (Default Export)
 * Wraps the content with EditorProvider to initialize state from existing question data.
 */
export default function QuestionEditor({
  questionData,
  onClose,
  onSaveSuccess,
  userToken,
}) {
  // Transformation logic to prepare complex backend data (like MCQ arrays) for the editor's flat structure
  let options = questionData.options;
  let initialTab = "question";

  // If question is MCQ, convert the options array back to the A/B/C/D format expected by CreateAnswer
  if (
    questionData.answerType === "MCQ" ||
    questionData.options.type === "MCQ"
  ) {
    initialTab = "answer";
    if (Array.isArray(questionData.options.mcq)) {
      const mcqArray = questionData.options.mcq;
      const labels = ["A", "B", "C", "D"];
      const mcqObject = {};
      let correctIndex = null;
      const extraOptions = [];

      if (mcqArray.length > 4) {
        console.warn(
          `Question ${questionData._id} has ${mcqArray.length} options, but only 4 are supported by the current UI. Extra options are preserved (stored in options.mcq.extras) but not editable in the current UI.`,
        );
      }

      mcqArray.forEach((opt, index) => {
        if (index < 4) {
          mcqObject[labels[index]] = opt; // opt contains { slate, html, _id }
        } else {
          extraOptions.push(opt);
        }

        if (opt._id === questionData.correctOption) {
          correctIndex = index;
        }
      });

      if (correctIndex === null) {
        console.warn(
          `Question ${questionData._id}: correctOption ${questionData.correctOption} not found in options array.`,
        );
        correctIndex = -1; // Safe default for missing selection
      }

      options = {
        ...questionData.options,
        mcq: {
          ...mcqObject,
          correct: correctIndex < 4 ? correctIndex : -1,
          extras: extraOptions.length > 0 ? extraOptions : undefined,
          correctAnswerInExtras: correctIndex >= 4,
          originalCorrectOptionId: questionData.correctOption,
        },
        type: "MCQ",
      };
    }
  } else if (questionData.answerType === "fillInTheBlanks") {
    initialTab = "answer";
    options = {
      ...questionData.options,
      fillInTheBlanks: questionData.options.fillInTheBlanks || [],
      type: "fillInTheBlanks",
    };
  } else {
    // Default to Short Answer if type is unknown or SA
    options = { ...questionData.options, type: "SA" };
  }

  // Determine context attachment
  const attachmentObj =
    questionData.contextAttachmentId || questionData.contextAttachment;

  // Initialize values for the EditorProvider
  const initialValues = {
    question: questionData.question?.slate || questionData.question,
    options: options,
    explanation: questionData.explanation?.slate || questionData.explanation,
    questionId: questionData._id,
    tags: questionData.tags || [],
    skills: questionData.skills || [],
    contextAttachmentId: attachmentObj
      ? typeof attachmentObj === "object"
        ? attachmentObj._id
        : attachmentObj
      : null,
  };

  const initialContextData =
    typeof attachmentObj === "object" ? attachmentObj : null;

  return (
    <EditorProvider initialValues={initialValues}>
      <EditQuestionContent
        onClose={onClose}
        onSaveSuccess={onSaveSuccess}
        userToken={userToken}
        initialTab={initialTab}
        initialContextData={initialContextData}
      />
    </EditorProvider>
  );
}
