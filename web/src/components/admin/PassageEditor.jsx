/**
 * @file PassageEditor.jsx
 * @description Passage editing form component supporting title and body inputs alongside AI-assisted topic drafting.
 * @architecture Reusable editor component within admin passage modals, coordinating AIGenerationBar with structured form state.
 * @agent_note AI generation bar is only displayed for new passages lacking an existing _id.
 */

/**
 * PassageEditor.jsx
 *
 * PURPOSE:
 * A dedicated editor component for creating and managing reading passages.
 * It features a split interface for a title and a large content area, with
 * integrated AI generation capabilities for bootstrapping passage content from a topic.
 *
 * DEPENDENCIES:
 * - styled-components: For layout and structure.
 * - AIGenerationBar: To provide AI-powered content creation features.
 * - AdminStyles: Reusable form field styling for admin pages.
 *
 * EXPORTS:
 * - PassageEditor (default): The functional component for editing passages.
 *
 * INTERCONNECTIONS:
 * - Used within the Create/Edit passage modals in the admin dashboard.
 * - Communicates changes back to parent components via the onUpdate callback.
 */

import { useState, useEffect } from "react";
import styled from "styled-components";
import { FormField, FormLabel, FormInput } from "./AdminStyles";
import AIGenerationBar from "../common/AIGenerationBar";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

/**
 * PassageEditor component for authoring reading passage titles and content.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.initialData - Initial passage data containing title and text.
 * @param {string} [props.initialData._id] - Unique identifier if editing an existing passage.
 * @param {string} [props.initialData.title] - Initial passage title.
 * @param {string|Object} [props.initialData.text] - Initial passage text or Slate document.
 * @param {Function} [props.onUpdate] - Callback receiving updated passage data { title, text }.
 * @returns {JSX.Element} Passage editor form.
 */
export default function PassageEditor({ initialData, onUpdate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  /**
   * Sync local state with initialData when the passage being edited changes.
   * Handles legacy Slate content by providing a migration notice.
   */
  useEffect(() => {
    setTitle(initialData.title || "");
    if (initialData.text && typeof initialData.text === "string") {
      setContent(initialData.text);
    } else if (initialData.text && initialData.text.slate) {
      setContent("[Legacy Content] Please migrate data.");
    }
  }, [initialData._id]); // Reset only when the unique ID of the passage changes

  /**
   * Propagates title changes to the parent state.
   */
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (onUpdate) {
      onUpdate({ title: newTitle, text: content });
    }
  };

  /**
   * Propagates content changes to the parent state.
   */
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (onUpdate) {
      onUpdate({ title, text: newContent });
    }
  };

  /**
   * Processes output from the AI generator.
   * Uses regex to parse out a structured TITLE and BODY if provided by the AI,
   * otherwise falls back to treating the entire response as the body.
   */
  const handleAIComplete = (fullText) => {
    let newTitle = title;
    let newBody = content;

    // Pattern to match "TITLE: [text]" case-insensitively across lines
    const titleMatch = fullText.match(/^TITLE:\s*(.*)$/im);
    if (titleMatch && titleMatch[1]) {
      newTitle = titleMatch[1].trim();
      setTitle(newTitle);

      // Pattern to match "BODY: [multiline text]" starting from the BODY tag
      const bodyMatch = fullText.match(/BODY:\s*(.*)$/is);
      if (bodyMatch && bodyMatch[1]) {
        newBody = bodyMatch[1].trimStart();
      } else {
        // Fallback: strip the TITLE line and take the rest as the body
        newBody = fullText
          .replace(/^TITLE:\s*(.*)(?:\r?\n|$)/im, "")
          .trimStart();
      }
    } else {
      // Fallback: AI provided unstructured text, use it entirely as the body
      newBody = fullText.trimStart();
    }

    setContent(newBody);

    if (onUpdate) {
      onUpdate({ title: newTitle, text: newBody });
    }
  };

  return (
    <Container>
      {/* 
        AI Generation bar is only shown for new passages (where _id is absent).
        It assists admins in drafting new content quickly.
      */}
      {!initialData._id && (
        <AIGenerationBar
          mode="topic"
          apiMode="passage"
          label="Passage Topic:"
          placeholder="e.g. History of Space Exploration..."
          defaultValue=""
          onComplete={handleAIComplete}
          buttonText="Generate Passage"
        />
      )}

      <FormField>
        <FormLabel>Passage Title</FormLabel>
        <FormInput
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter passage title"
        />
      </FormField>

      <FormField>
        <FormLabel>Content</FormLabel>
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Type or paste passage content here..."
          style={{
            width: "100%",
            minHeight: "300px",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "1rem",
            fontFamily: "inherit",
            lineHeight: "1.6",
            resize: "vertical",
          }}
        />
      </FormField>
    </Container>
  );
}
