/**
 * @file SkillInput.jsx
 * @description A specialized tagging input component for selecting and adding targeted skills.
 * Fetches existing skills from the backend and provides an autocomplete dropdown.
 * @dependencies react, styled-components, axios, ../admin/AdminStyles, ./Tag, ../InfoTooltip, ../../styles/Form.styles
 * @exports SkillInput
 * @interconnections Used in administrative forms to associate specific skills with questions or modules.
 */

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import adminApiClient from "../../services/adminApi";
import { API_ENDPOINTS } from "../../api/requestMap";
import { FormLabel } from "../admin/AdminStyles";
import Tag from "./Tag";
import InfoTooltip from "../InfoTooltip";
import { DropdownMenuShell, TagInputContainer } from "../../styles/Form.styles";
import { useAdminAuth } from "../admin/AdminAuthProvider";

// Scrollable container for the skill suggestion dropdown
const SelectScrollContainer = styled(DropdownMenuShell)`
  max-height: 200px;
  overflow-y: auto;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  z-index: 10;
  margin-top: 5px;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

const SkillInputWrapper = styled.div`
  margin-bottom: 20px;
`;

const LabelWithTooltip = styled(FormLabel)`
  display: flex;
  align-items: center;
`;

const InputRowWrapper = styled.div`
  display: flex;
  flex: 1;
  min-width: 200px;
  align-items: center;
  gap: 10px;
`;

// Minimalist text input for typing new skills or filtering existing ones
const CustomInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  font-size: 14px;
  background: transparent;
  color: #333;
  padding: 4px;
`;

// Styling for individual skill options in the dropdown
const SelectOption = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: background 0.2s;
  &:hover {
    background: rgba(228, 107, 74, 0.08);
    color: #e64a19;
  }
`;

// Button to manually add a typed skill
const AddButton = styled.button`
  background: #ff5722;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  &:hover {
    background: #e64a19;
  }
`;

/**
 * Main SkillInput component.
 * @param {Array<string>} skills - Currently selected skills.
 * @param {function} setSkills - State setter to update the skills list.
 */
export default function SkillInput({ skills, setSkills }) {
  const [availableSkills, setAvailableSkills] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);

  // Retrieve admin authentication token for API calls
  const { adminUser } = useAdminAuth() || {};

  // Effect: Fetch the list of all unique skills currently in the database on mount
  useEffect(() => {
    if (!adminUser) return;

    adminApiClient
      .get(API_ENDPOINTS.getSkills.url)
      .then((res) => {
        if (res.data?.data) {
          setAvailableSkills(res.data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch skills", err));
  }, []);

  // Effect: Global listener to close the dropdown when clicking outside the component
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Adds a new skill to the list, ensuring no duplicates
  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setInputValue("");
    setDropdownOpen(false);
  };

  // Removes a skill from the selected list by its index
  const removeSkill = (indexToRemove) => {
    setSkills(skills.filter((_, i) => i !== indexToRemove));
  };

  // Logic: Filter available skills based on user input and exclude already selected ones
  const unusedSkills = availableSkills.filter(
    (s) =>
      !skills.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <SkillInputWrapper>
      <LabelWithTooltip>
        Skills Targeted
        <InfoTooltip text="Use this to track specific skills for analytics, distinct from general tags. Please select from existing skills unless a completely new one is required." />
      </LabelWithTooltip>
      <TagInputContainer ref={containerRef}>
        {/* Render currently selected skills as deletable Tags */}
        {skills.map((skill, i) => (
          <Tag key={i} label={skill} onDelete={() => removeSkill(i)} active />
        ))}

        <InputRowWrapper>
          <CustomInput
            type="text"
            value={inputValue}
            placeholder="Type or select a skill..."
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => {
              setInputValue(e.target.value);
              setDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // Prevent accidental form submission
                addSkill(inputValue);
              }
            }}
          />
          {/* Show "Add" button only if input has content and is not already selected */}
          {inputValue.trim() && !skills.includes(inputValue.trim()) && (
            <AddButton type="button" onClick={() => addSkill(inputValue)}>
              Add
            </AddButton>
          )}
        </InputRowWrapper>

        {/* The suggestion dropdown based on the unusedSkills list */}
        <SelectScrollContainer
          $isOpen={dropdownOpen && unusedSkills.length > 0}
        >
          {unusedSkills.map((s, i) => (
            <SelectOption key={i} onClick={() => addSkill(s)}>
              {s}
            </SelectOption>
          ))}
        </SelectScrollContainer>
      </TagInputContainer>
    </SkillInputWrapper>
  );
}
