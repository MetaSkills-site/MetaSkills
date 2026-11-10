/**
 * @file AnswerWriter.jsx
 * @description Admin editor component for defining the correct answer for a question.
 * It acts as a wrapper for the `AnswerCreator` component, injecting the necessary context.
 *
 * @dependencies
 * - react: For useContext hook.
 * - AnswerCreator: The underlying answer definition component.
 * - EditorContext: To read and write the global answer and question state.
 *
 * @exports AnswerWriter (default)
 * @interconnections Used in the question editing suite (`EditQuestion`).
 */

import { useContext } from "react";
import AnswerCreator from "./AnswerCreator";
import { EditorContext } from "../context/EditorContext";

export default function AnswerWriter({ compact = false }) {
  // Access global options and question slate from EditorContext
  const { options, setOptions, question } = useContext(EditorContext);

  return (
    <AnswerCreator
      options={options}
      setOptions={setOptions}
      questionSlate={question}
      compact={compact}
      disableShortcuts={true}
    />
  );
}
