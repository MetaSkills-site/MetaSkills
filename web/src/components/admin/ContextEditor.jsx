/**
 * @file ContextEditor.jsx
 * @description A specialized editor for creating and modifying context attachments (e.g., passages, case studies) that can be linked to multiple questions.
 *
 * Dependencies:
 * - styled-components: For layout and form styling.
 * - TextBox: The core Slate-based rich text editor component.
 * - axios: For fetching existing context data from the backend.
 * - AIGenerationBar: Component for generating context content using AI.
 * - slateUtils: Utilities for converting between Markdown and Slate formats.
 *
 * Exports:
 * - ContextEditor (default): The main editor component for context management.
 *
 * Interconnections:
 * - Used within the question creation wizard to provide background information or reading material.
 * - Communicates with the backend via the /api/context-attachments endpoint.
 */

import { useState, useEffect } from "react";
import styled from "styled-components";
import TextBox from "../Editor/Editor";
import toast from "react-hot-toast";
import adminApiClient from "../../services/adminApi";
import { API_ENDPOINTS } from "../../api/requestMap";
import { DialogButton } from "./AdminStyles";
import AIGenerationBar from "../common/AIGenerationBar";
import { markdownToSlate } from "../../utils/slateUtils";

/**
 * Vertical layout container for the editor.
 */
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

/**
 * Standard input grouping for labels and form fields.
 */
const InputGroup = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 14px;
    font-weight: 600;
    color: #444;
  }

  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    outline: none;

    &:focus {
      border-color: #ff5722;
    }
  }
`;

export default function ContextEditor({
  contextId,
  onDetach,
  onUpdate,
  initialData,
  hideDetach = false,
}) {
  const [loading, setLoading] = useState(true);
  const [contextData, setContextData] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState([
    { type: "paragraph", children: [{ text: "" }] },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load existing context data if an ID is provided.
  useEffect(() => {
    if (contextId) {
      // Prevent redundant fetches if the current ID matches already loaded data.
      if (contextData && contextData._id === contextId) return;

      // Use initial data if provided to avoid a network request.
      if (initialData && initialData._id === contextId) {
        setContextData(initialData);
        setTitle(initialData.title);
        setContent(initialData.text.slate);
        setLoading(false);
      } else {
        fetchContext();
      }
    }
  }, [contextId, initialData]);

  /**
   * Propagates changes to the title or content back to the parent component.
   */
  const handleUpdate = (newTitle, newContent) => {
    if (onUpdate) {
      if (!contextId && !contextData) {
        // Case: New context being created.
        onUpdate({
          title: newTitle,
          text: { slate: newContent },
        });
      } else if (contextData) {
        // Case: Existing context being updated.
        onUpdate({
          _id: contextId,
          title: newTitle,
          text: { slate: newContent },
        });
      }
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    handleUpdate(newTitle, content);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    handleUpdate(title, newContent);
  };

  /**
   * Processes the output from the AI generator, parsing out the title and body.
   */
  const handleAIComplete = (fullText) => {
    let newTitle = title;
    let newBodyText = "";

    // Regex to find "TITLE:" and "BODY:" markers in the AI response.
    const titleMatch = fullText.match(/^TITLE:\s*(.*)$/im);
    if (titleMatch && titleMatch[1]) {
      newTitle = titleMatch[1].trim();
      const bodyMatch = fullText.match(/BODY:\s*(.*)$/is);
      if (bodyMatch && bodyMatch[1]) {
        newBodyText = bodyMatch[1].trimStart();
      } else {
        // Fallback: If no BODY marker is found, use everything after the TITLE line.
        newBodyText = fullText
          .replace(/^TITLE:\s*(.*)(?:\r?\n|$)/im, "")
          .trimStart();
      }
    } else {
      // Fallback: Use the entire response as the body if no markers are found.
      newBodyText = fullText.trimStart();
    }

    // Convert the parsed Markdown body into Slate JSON format for the editor.
    const slateContent = markdownToSlate(newBodyText);
    setTitle(newTitle);
    setContent(slateContent);
    handleUpdate(newTitle, slateContent);
    setIsGenerating(false);
  };

  /**
   * Fetches context data from the backend API.
   */
  const fetchContext = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        API_ENDPOINTS.getContextAttachment.url({ id: contextId }),
      );
      setContextData(res.data.data);
      setTitle(res.data.data.title);
      setContent(res.data.data.text.slate);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load context");
    } finally {
      setLoading(false);
    }
  };

  if (loading && contextId) return <div>Loading context...</div>;

  return (
    <Container>
      {/* Detach button to remove the context link from the current question. */}
      {!hideDetach && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <DialogButton
            onClick={onDetach}
            style={{
              background: "#ffebee",
              color: "#d32f2f",
              border: "1px solid #ffcdd2",
            }}
          >
            Detach Context
          </DialogButton>
        </div>
      )}

      {/* AI generator is only available when creating a new context from scratch. */}
      {!contextId && (
        <AIGenerationBar
          mode="topic"
          apiMode="context_attachment"
          label="Context Topic:"
          placeholder="e.g. History of AI, Case Study on Renewable Energy..."
          defaultValue=""
          onStart={() => setIsGenerating(true)}
          onComplete={handleAIComplete}
          onError={() => setIsGenerating(false)}
          buttonText="Generate Context"
        />
      )}

      <InputGroup>
        <label>Title</label>
        <input value={title} onChange={handleTitleChange} />
      </InputGroup>

      <InputGroup>
        <label>Content</label>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: "6px",
            minHeight: "300px",
          }}
        >
          {/* Main rich text editor field. */}
          <TextBox
            value={content}
            onChange={handleContentChange}
            disabled={isGenerating}
          />
        </div>
      </InputGroup>
    </Container>
  );
}
