/**
 * @file AttachContext.jsx
 * @description Specialized wrapper component for the question editor that facilitates
 * linking a quiz question to a context attachment (e.g., a reading passage).
 *
 * @dependencies
 * - react: For context consumption using the useContext hook.
 * - EditorContext: Provides shared state for the question being edited, including its linked context.
 * - ContextSelector: A reusable UI component for browsing and selecting context documents.
 *
 * @exports
 * - AttachContext (default): The functional component for context selection in the editor.
 *
 * @interconnections
 * - Placed within the question creation/edit flow.
 * - Updates the global EditorContext state to reflect the selected attachment ID and object.
 */

import { useContext } from "react";
import EditorContext from "../../context/EditorContext";
import ContextSelector from "./ContextSelector";

export default function AttachContext() {
  /**
   * Destructure state setters from EditorContext.
   * These update the underlying question data being prepared for submission.
   */
  const { contextAttachmentId, setContextAttachmentId, setContextAttachment } =
    useContext(EditorContext);

  return (
    /* ContextSelector provides the searchable list and selection UI */
    <ContextSelector
      selectedId={contextAttachmentId}
      onSelect={(id, obj) => {
        // Update both the ID (for DB reference) and the object (for live preview)
        setContextAttachmentId(id);
        setContextAttachment(obj);
      }}
      hideLabel
    />
  );
}
