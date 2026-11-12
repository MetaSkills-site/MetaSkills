/**
 * @file SearchAndFilter.jsx
 * @description Suite of reusable UI components for searching, filtering, and displaying result counts in admin data views.
 * @architecture Shared admin presentation layer providing Radix UI popovers, styled search bars, and filter badges.
 * @agent_note When adding custom filter panels, wrap contents in FilterButton popover container.
 */

/**
 * FILE: SearchAndFilter.jsx
 * PURPOSE: A collection of reusable UI components for searching and filtering datasets within the administrative dashboard.
 * DEPENDENCIES:
 *   - styled-components: For styling the search and filter components.
 *   - @radix-ui/react-popover: For accessible and responsive filter popover menus.
 * EXPORTS:
 *   - SearchContainer: Wrapper for search and filter controls.
 *   - SearchInput: Standardized search input field with icon.
 *   - FilterButton: Trigger button for opening the filter popover.
 *   - FilterSectionHeader: Header component for individual filter sections.
 * INTERCONNECTIONS: Extensively used in ViewPassages, ViewQuestions, and ViewUsers for consistent filtering UX.
 */

import styled from "styled-components";
import { IoSearch, IoFilter } from "react-icons/io5";
import * as Popover from "@radix-ui/react-popover";

// Styled Components for Layout and Badges
const StyledSearchContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
`;

const CountBadgeWrapper = styled.div`
  color: #ff5722;
  padding: 2px 6px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  white-space: nowrap;
`;

/**
 * Layout container for search and filter bars with optional count badge display.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements (inputs, action buttons).
 * @param {number} [props.count] - Total results count to display.
 * @param {string} [props.label] - Optional prefix label for count badge.
 * @param {Object} [props.style] - Custom container styles.
 * @param {string} [props.className] - Custom container CSS class.
 * @returns {JSX.Element} Search container layout.
 */
export function SearchContainer({ children, count, label, style, className }) {
  return (
    <StyledSearchContainer style={style} className={className}>
      {count !== undefined && (
        <CountBadgeWrapper>
          {label ? `${label}: ` : ""}
          {count}
        </CountBadgeWrapper>
      )}
      {children}
    </StyledSearchContainer>
  );
}

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const SearchIcon = styled(IoSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #ff5722;
  font-size: 18px;
`;

const StyledSearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border-radius: 12px;
  border: 2px solid rgba(255, 87, 34, 0.2);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;

  &:focus {
    border-color: #ff5722;
    box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
  }
`;

/**
 * Text input optimized for search operations with integrated search icon.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.value - Controlled input text value.
 * @param {Function} props.onChange - Input change event handler.
 * @param {string} [props.placeholder="Search..."] - Input placeholder text.
 * @returns {JSX.Element} Rendered search input field.
 */
export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <SearchInputWrapper>
      <SearchIcon />
      <StyledSearchInput
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </SearchInputWrapper>
  );
}

const StyledFilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid rgba(255, 87, 34, 0.2);
  background: white;
  color: #ff5722;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;

  &:hover {
    background: rgba(255, 87, 34, 0.05);
    border-color: #ff5722;
  }

  /* Dynamic styling for when the filter is active */
  ${(props) =>
    props.$active &&
    `
    background: #ff5722;
    color: white;
    &:hover {
      background: #e64a19;
    }
  `}
`;

// Popover content container for the filter menu
export const FilterPopoverContent = styled(Popover.Content)`
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow:
    0 10px 38px -10px rgba(22, 23, 24, 0.35),
    0 10px 20px -15px rgba(22, 23, 24, 0.2);
  width: 300px;
  max-height: 60vh;
  overflow-y: auto;
  z-index: 100;
  border: 1px solid rgba(255, 87, 34, 0.1);
`;

/**
 * Trigger button opening a Radix UI popover containing filter options.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean|number} [props.active] - Filter state flag or number of active filters.
 * @param {React.ReactNode} props.children - Popover filter options content.
 * @returns {JSX.Element} Filter popover trigger and content portal.
 */
export function FilterButton({ active, children }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <StyledFilterButton $active={active}>
          <IoFilter />
          Filter{" "}
          {active && typeof active === "number"
            ? `(${active})`
            : active
              ? "(Active)"
              : ""}
        </StyledFilterButton>
      </Popover.Trigger>
      <Popover.Portal>
        <FilterPopoverContent sideOffset={5} align="end">
          {children}
        </FilterPopoverContent>
      </Popover.Portal>
    </Popover.Root>
  );
}

const StyledFilterHeader = styled.div`
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-weight: bold;
    color: #333;
  }

  button {
    border: none;
    background: none;
    color: #ff5722;
    font-size: 12px;
    cursor: pointer;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

/**
 * Section header within a filter menu providing section title and clear button.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.title - Filter section title.
 * @param {Function} [props.onClear] - Clear action callback.
 * @param {boolean} [props.showClear] - Whether to display the clear action button.
 * @returns {JSX.Element} Filter header row.
 */
export function FilterSectionHeader({ title, onClear, showClear }) {
  return (
    <StyledFilterHeader>
      <span>{title}</span>
      {showClear && (
        <button type="button" onClick={onClear}>
          Clear
        </button>
      )}
    </StyledFilterHeader>
  );
}
