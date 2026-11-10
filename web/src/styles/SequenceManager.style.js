/**
 * @file SequenceManager.style.js
 * @description Styles for managing learning sequences, including module lists, drag-and-drop handles, and grade badges.
 * @dependencies styled-components
 * @exports ModuleListWrapper, ModuleItemCard, ModuleItemContent, ModuleItemTitle, ModuleItemMeta, DragHandle, StatusBadge, GradeScroller, GradeBadge
 * @interconnections Used by the SequenceManager and Admin components to organize and reorder educational content.
 */

import styled from "styled-components";

/**
 * Main wrapper for the module list.
 * Provides a clean, bordered container with a subtle shadow and hidden overflow.
 */
export const ModuleListWrapper = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  min-height: 400px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
  overflow: hidden;
`;

/**
 * Individual module card within the sequence list.
 * Designed for interactivity with a grab cursor and hover background transitions.
 */
export const ModuleItemCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab; /* Indicates the item can be dragged */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
    background: #fafafa;
  }
`;

/**
 * Container for the textual content within a module item.
 */
export const ModuleItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/**
 * Styled title for the module item.
 */
export const ModuleItemTitle = styled.div`
  font-weight: 700;
  color: #333;
  font-size: 16px;
  font-family: var(--font-primary);
`;

/**
 * Metadata display (e.g., question count, estimated time) for a module item.
 */
export const ModuleItemMeta = styled.div`
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
`;

/**
 * Visual handle used for drag-and-drop operations.
 * Changes color on hover to provide interactive feedback.
 */
export const DragHandle = styled.div`
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: #f1f5f9;
    color: #ff5722;
  }
`;

/**
 * Compact badge for displaying module status (Complete vs. Pending).
 * Dynamically styled based on the $complete prop.
 */
export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  /* Logic for color scheme based on completion status */
  background-color: ${(props) => (props.$complete ? "#dcfce7" : "#f1f5f9")};
  color: ${(props) => (props.$complete ? "#166534" : "#ff5722")};
  border: 1px solid
    ${(props) => (props.$complete ? "#bbf7d0" : "rgba(255, 87, 34, 0.2)")};
`;

/**
 * Horizontal scroller for grade badges.
 * Hides scrollbars across different browsers for a clean UI.
 */
export const GradeScroller = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-block: 12px;
  margin-bottom: 20px;

  /* Hides scrollbars while maintaining scroll functionality */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }
  -ms-overflow-style: none; /* IE/Edge */
  scrollbar-width: none; /* Firefox */
`;

/**
 * Selectable badge for different educational grades.
 * Supports an active state with distinct border and background styling.
 */
export const GradeBadge = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 80px;
  border-radius: 16px;
  border: 2px solid ${(props) => (props.$active ? "#ff5722" : "transparent")};
  background: ${(props) =>
    props.$active ? "rgba(255, 87, 34, 0.05)" : "#fff"};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-primary);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 19, 5, 0.15);
  }

  /* Styling for the grade label (e.g., "Grade") */
  span:first-child {
    font-size: 13px;
    font-weight: 700;
    color: ${(props) => (props.$active ? "#ff5722" : "#888")};
    text-transform: uppercase;
  }

  /* Styling for the grade value (e.g., "10") */
  span:last-child {
    font-size: 24px;
    font-weight: 900;
    color: ${(props) => (props.$active ? "#ff5722" : "#333")};
  }
`;
