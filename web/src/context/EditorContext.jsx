/**
 * @file EditorContext.jsx
 * @description Provides a global React context for managing the state of the question editor.
 * This shares data between the Question, Answer, and Explanation editor components,
 * as well as metadata like tags, skills, and context attachments.
 *
 * @dependencies
 * - react: For createContext, useMemo, and useState hooks.
 *
 * @exports EditorContext, EditorProvider
 * @interconnections Used by WriteQuestion, WriteAnswer, WriteExplanation, and EditQuestion.
 */

import { createContext, useMemo, useState } from "react";

// Default rich text values using Slate JSON structure
const defaultQuestion = [{ type: "paragraph", children: [{ text: "" }] }];
const defaultExplanation = [
  {
    type: "paragraph",
    children: [{ text: "No explanations were added." }],
  },
];

/**
 * The Context object for the Editor.
 */
export const EditorContext = createContext({
  question: defaultQuestion,
  setQuestion: () => {},
  options: {
    type: "SA",
    sa: "",
    mcq: {
      A: "",
      B: "",
      C: "",
      D: "",
      correct: null,
      correctAnswerInExtras: false,
      originalCorrectOptionId: null,
    },
    optionIndex: null,
  },
  setOptions: () => {},
  explanation: defaultExplanation,
  setExplanation: () => {},
  skills: [],
  setSkills: () => {},
  contextAttachmentId: null,
  setContextAttachmentId: () => {},
  contextAttachment: null,
  setContextAttachment: () => {},
});

/**
 * EditorProvider Component
 * Manages all editor-related state and provides it to its descendants.
 */
export function EditorProvider({ children, initialValues = {} }) {
  // Rich text state for question and explanation
  const [question, setQuestion] = useState(
    initialValues.question || defaultQuestion,
  );
  const [explanation, setExplanation] = useState(
    initialValues.explanation || defaultExplanation,
  );

  // Answer format and correct answer state
  const [options, setOptions] = useState(
    initialValues.options || {
      type: "SA",
      sa: "",
      mcq: {
        A: "",
        B: "",
        C: "",
        D: "",
        correct: null,
        correctAnswerInExtras: false,
        originalCorrectOptionId: null,
      },
      optionIndex: null,
    },
  );

  // Metadata and attachment state
  const [questionId, setQuestionId] = useState(
    initialValues.questionId || null,
  );
  const [tags, setTags] = useState(initialValues.tags || []);
  const [skills, setSkills] = useState(initialValues.skills || []);
  const [contextAttachmentId, setContextAttachmentId] = useState(
    initialValues.contextAttachmentId || null,
  );
  const [contextAttachment, setContextAttachment] = useState(
    initialValues.contextAttachment || null,
  );

  // Memoize context value to optimize re-renders
  const value = useMemo(
    () => ({
      question,
      setQuestion,
      options,
      setOptions,
      explanation,
      setExplanation,
      questionId,
      setQuestionId,
      tags,
      setTags,
      skills,
      setSkills,
      contextAttachmentId,
      setContextAttachmentId,
      contextAttachment,
      setContextAttachment,
    }),
    [
      question,
      options,
      explanation,
      questionId,
      tags,
      skills,
      contextAttachmentId,
      contextAttachment,
    ],
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export default EditorContext;
