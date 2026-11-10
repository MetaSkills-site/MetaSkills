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
 * SearchContainer: Provides a layout wrapper for search/filter controls, optionally displaying a result count.
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
 * SearchInput: Renders a text input optimized for search operations with a consistent icon and style.
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
 * FilterButton: Renders a button that triggers a Radix Popover containing filter options.
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
 * FilterSectionHeader: A common header for filter groups, including a title and an optional 'Clear' button.
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
