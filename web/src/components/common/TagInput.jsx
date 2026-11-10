/**
 * FILE PURPOSE: A multi-tag input component that allows users to type and manage a list of tags.
 *
 * DEPENDENCIES:
 * - Tag: Sub-component for displaying individual tags.
 * - styled-components: For input field and wrapper styling.
 * - FormLabel, TagInputContainer: Shared UI components for consistent form appearance.
 *
 * EXPORTS:
 * - TagInput: Default export.
 *
 * INTERCONNECT:
 * - Used in EditQuestion, EditModule, and other admin forms to manage categories or skills.
 * - Directly updates the 'tags' state in the parent component via the 'setTags' prop.
 */

import { useState } from "react";
import Tag from "./Tag";
import { FormLabel } from "../admin/AdminStyles";
import { TagInputContainer } from "../../styles/Form.styles";
import styled from "styled-components";

const TagInputWrapper = styled.div`
  margin-bottom: 20px;
`;

const TagInputField = styled.input`
  border: none;
  outline: none;
  flex: 1;
  min-width: 120px;
  font-size: 14px;
  background: transparent;
  color: #333;
  padding: 4px;
`;

export default function TagInput({
  tags,
  setTags,
  placeholder = "Type tag and press Enter",
}) {
  const [inputVal, setInputVal] = useState("");

  /**
   * Listens for the 'Enter' key to commit the typed value as a new tag.
   * Prevents duplicates and empty strings.
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = inputVal.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]); // Add new tag to the parent's state
        setInputVal(""); // Clear local input
      }
    }
  };

  /**
   * Removes a tag from the list based on its index.
   */
  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <TagInputWrapper>
      <FormLabel>Tags</FormLabel>
      <TagInputContainer>
        {/* Render the current list of tags as removable chips */}
        {tags.map((tag, index) => (
          <Tag
            key={index}
            label={tag}
            onDelete={() => removeTag(index)}
            active
          />
        ))}
        {/* Invisible input field that follows the tags */}
        <TagInputField
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </TagInputContainer>
    </TagInputWrapper>
  );
}
