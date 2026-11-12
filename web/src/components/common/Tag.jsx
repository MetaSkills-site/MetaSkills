/**
 * @file Tag.jsx
 * @description Reusable chip component for displaying labels, skills, and categories with optional deletion.
 * @architecture Common UI atom used across tags inputs, question cards, and filter badges.
 * @agent_note Stop propagation on close icon click to prevent activating parent container onClick handlers.
 */

/**
 * FILE PURPOSE: A reusable chip/tag component for displaying categories, skills, or labels.
 * Supports active states, click events, and deletion.
 *
 * DEPENDENCIES:
 * - styled-components: For themed tag styling.
 * - react-icons/io5: Provides the close icon for deletable tags.
 *
 * EXPORTS:
 * - Tag: Default export (Chip component).
 *
 * INTERCONNECT:
 * - Used in TagInput.jsx for multi-select fields and in ModuleCard.jsx for skill labels.
 */

import styled from "styled-components";
import { IoClose } from "react-icons/io5";

/**
 * Chip: Styled container for the tag.
 * Adjusts colors and cursor based on 'active' and 'clickable' states.
 */
const Chip = styled.div`
  padding: 4px 10px;
  border-radius: 16px;
  background: ${(props) => (props.$active ? "#ff5722" : "#f5f5f5")};
  color: ${(props) => (props.$active ? "white" : "#666")};
  font-size: 13px;
  font-weight: 600;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
  border: 1px solid ${(props) => (props.$active ? "#ff5722" : "#e0e0e0")};
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${(props) =>
      props.$clickable ? (props.$active ? "#e64a19" : "#eeeeee") : ""};
  }
`;

const CloseIcon = styled(IoClose)`
  cursor: pointer;
  font-size: 16px;
`;

/**
 * Tag chip component displaying text with active and dismissible states.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.label - Text content displayed inside the tag.
 * @param {boolean} [props.active=false] - Whether the tag is highlighted.
 * @param {Function} [props.onDelete] - Callback invoked when clicking the remove icon.
 * @param {Function} [props.onClick] - Optional click handler for selecting the tag.
 * @param {Object} [props.style] - Inline styles.
 * @returns {JSX.Element} Rendered chip element.
 */
export default function Tag({
  label,
  active = false,
  onDelete,
  onClick,
  style,
}) {
  return (
    <Chip
      $active={active}
      $clickable={!!onClick}
      onClick={onClick}
      style={style}
    >
      {label}
      {/* Renders a deletion icon if an onDelete handler is provided */}
      {onDelete && (
        <CloseIcon
          onClick={(e) => {
            // Stop propagation to prevent triggering onClick of the chip itself
            e.stopPropagation();
            onDelete();
          }}
        />
      )}
    </Chip>
  );
}
