/**
 * @file WriteQuestion.jsx
 * @description A high-level editor component for inputting question text.
 * It acts as a wrapper for the `TextBox` (Slate editor) and synchronizes with the `EditorContext`.
 *
 * @dependencies
 * - TextBox (Editor): The underlying Slate-based rich text editor.
 * - react: For useContext hook.
 * - EditorContext: To read and write the global question state.
 *
 * @exports WriteQuestion (default)
 * @interconnections Core part of the question editing suite; used in `EditQuestion`.
 */

import TextBox from "./Editor/Editor";
import { useContext } from "react";
import { EditorContext } from "../context/EditorContext";

function QuestionWriter({ compact = false }) {
  // Bind the editor to the global question state in EditorContext
  const { question, setQuestion } = useContext(EditorContext);

  /**
   * Updates the global question state when the editor content changes.
   * @param {Array} value - The Slate JSON array representing the rich text.
   */
  const handleQuestion = (value) => {
    setQuestion(value);
  };

  return (
    <TextBox
      value={question || ""}
      onChange={handleQuestion}
      compact={compact}
    />
  );
}

export default QuestionWriter;
