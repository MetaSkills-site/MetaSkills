/**
 * @file ExplanationWriter.jsx
 * @description Rich-text solution explanation editor integrated with AI explanation generation for administrative workflows.
 * @architecture Editor component connecting administrative question authoring contexts with AI generation services.
 * @agent_note Updates EditorContext state directly while disabling input during AI stream/generation cycles.
 */

/**
 * FILE PURPOSE: ExplanationWriter — A specialized rich-text editor for question explanations.
 *
 * ROLE:
 * Provides a text box for administrators to write detailed solution guides.
 * It includes an integrated AI generator that can suggest explanations
 * based on the current question and options, streamlining the content creation process.
 *
 * DEPENDENCIES:
 * - TextBox (Editor): The primary rich-text input component.
 * - EditorContext: Centralized source for question/options/explanation state.
 * - AIExplanationGenerator: Orchestrates AI prompts and updates the editor content.
 *
 * EXPORTS:
 * - ExplanationWriter (default): The functional component managing explanation inputs.
 *
 * INTERCONNECTIONS:
 * - Used in the Admin AddQuestions and EditQuestion flows.
 */
import TextBox from "./Editor/Editor";
import { useContext, useState } from "react";
import { EditorContext } from "../context/EditorContext";
import AIExplanationGenerator from "./admin/AIExplanationGenerator";

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} [props.compact=false] - Whether to render a compact variant of the rich-text editor.
 * @returns {JSX.Element} The explanation authoring panel with integrated AI generator.
 */
function ExplanationWriter({ compact = false }) {
  const { explanation, setExplanation, question, options } =
    useContext(EditorContext);

  // Track AI generation lifecycle to disable manual edits while the "robot" is writing.
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * handleAiGeneration
   * Callback for the AI generator. It updates the global context explanation.
   * Logic Note: We avoid "key bumping" or remounting here so the editor's internal
   * undo/redo stack is preserved where possible.
   */
  const handleAiGeneration = (newExplanation) => {
    setExplanation(newExplanation);
  };

  return (
    <>
      {/* ─── AI Controller ─── */}
      <AIExplanationGenerator
        question={question}
        options={options}
        setExplanation={handleAiGeneration}
        setIsGenerating={setIsGenerating}
      />

      {/* ─── Rich Text Editor ─── */}
      <TextBox
        value={explanation}
        onChange={(e) => setExplanation(e)}
        compact={compact}
        disabled={isGenerating}
      />
    </>
  );
}

export default ExplanationWriter;
