/**
 * @file ExplanationPreview.jsx
 * @description A component to preview the answer type for the question being edited.
 * It accesses the global EditorContext to display the current answer type (e.g., MCQ, INTEGER).
 *
 * @dependencies
 * - react: For useContext hook.
 * - Font style: For consistent typography.
 * - EditorContext: To access the current question configuration (options).
 *
 * @exports ExplanationPreview (default)
 * @interconnections Part of the question editor suite, used in WriteExplanation and other editor components.
 */

import { useContext } from "react";
import { Font } from "../styles/Font.style";
import EditorContext from "../context/EditorContext";

export default function ExplanationPreview() {
  // Access global options from EditorContext to determine the question type for preview
  const { options } = useContext(EditorContext);
  return (
    <>
      {/* Display the selected answer type from the options */}
      <Font>Answer: {options?.type}</Font>
    </>
  );
}
