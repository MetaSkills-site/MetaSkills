/**
 * @file AdminStyles.jsx
 * @description Provides a centralized collection of styled components and shared UI elements
 * specifically designed for the Admin dashboard and its related sub-components.
 *
 * @dependencies
 * - styled-components: For CSS-in-JS styling.
 * - UniversalBackButton: A common back button component used within the HomeIcon wrapper.
 *
 * @exports
 * - Wrapper, PageContainer: Layout containers for admin pages.
 * - Button, IconButton, DialogButton: Various button styles for different UI contexts.
 * - NavIcon, HomeIcon: Navigation-related icons and buttons.
 * - TabContainer, Tab: Components for implementing tabbed navigation.
 * - FormField, FormLabel, FormInput, StyledBlankInput: Form-related elements for data entry.
 * - QuestionListContainer, QuestionText: Styles for displaying question lists.
 * - DialogButtonGroup: Layout for grouping action buttons in dialogs.
 *
 * @interconnections
 * Extensively used by Admin components like ViewModules, UserHistory, SequenceManager,
 * and Dashboard to ensure visual consistency across the administrative interface.
 */

import styled from "styled-components";
import UniversalBackButton from "../common/UniversalBackButton";

/**
 * Top-level wrapper for admin pages, ensuring full-height background.
 */
export const Wrapper = styled.div`
  background: #fafafa;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

/**
 * Main content container with responsive width and padding.
 */
export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 70%;
  min-height: -moz-fit-content;
  height: fit-content;
  flex: 1;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
  background: #fafafa;
  margin: 0 auto;
`;

/**
 * Standard action button with a vibrant gradient background.
 */
export const Button = styled.button`
  display: block;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  font-size: 15px;
  padding: 10px 16px;
  margin: auto;
  background: linear-gradient(90deg, #e2622fff, #e87f3dff);
  border: none;
  border-radius: 10px;
  color: #ffffffd9;
  font-family: var(--font-primary);
  font-weight: 800;
  box-shadow:
    #0000001a 0 4px 6px -1px,
    #0000001a 0 2px 4px -2px;
`;

/**
 * Container for grouping action buttons in a row (e.g. inside SearchContainer).
 */
export const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

/**
 * Specialized action button with a vibrant gradient background and flex layout.
 * Supports primary (gradient) and danger (muted red) variants.
 */
export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) =>
    props.$danger
      ? "var(--badge-bg-red, #ffebee)"
      : "linear-gradient(135deg, #ff5722 0%, #ff7043 100%)"};
  color: ${(props) =>
    props.$danger ? "var(--badge-text-red, #d32f2f)" : "white"};
  border: ${(props) => (props.$danger ? "1px solid #ffcdd2" : "none")};
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${(props) =>
    props.$danger ? "none" : "0 4px 6px rgba(255, 87, 34, 0.2)"};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    background: ${(props) =>
      props.$danger
        ? "#ffdada"
        : "linear-gradient(135deg, #ff7043 0%, #ff8a65 100%)"};
    box-shadow: ${(props) =>
      props.$danger ? "none" : "0 6px 12px rgba(255, 87, 34, 0.3)"};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    font-size: 16px;
  }
`;

/**
 * Circular icon container typically used for navigation items.
 */
export const NavIcon = styled.span`
  display: flex;
  aspect-ratio: 1/1;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  align-self: center;
  margin: auto;
  padding: 10px;
  background: linear-gradient(90deg, #e2622fff, #e87f3dff);
  color: #ffffffd9;
  border-radius: 50%;
  margin: 10px;
  > svg {
    width: 20px;
    height: 20px;
  }
`;

/**
 * BackIconButton: Wrapper around UniversalBackButton for consistent admin navigation.
 * Note: Keeps HomeIcon as an alias for backward compatibility.
 */
export const BackIconButton = (props) => (
  <UniversalBackButton variant="icon-circle" {...props} />
);

export const HomeIcon = BackIconButton;

/**
 * Container for tab-based navigation, handles responsive alignment.
 */
export const TabContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  background: #fff;
  width: -moz-fit-content;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
  row-gap: 5px;
  margin: 0px 10px 20px auto;
  padding: 6px;
  border-radius: 16px;
  box-shadow: 0 0 7px -3px rgb(95 27 6 / 37%);
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 768px) {
    justify-content: center;
    margin: 0 auto 20px auto;
  }
`;

/**
 * Individual tab button with active state styling.
 */
export const Tab = styled.button`
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  border-bottom: none;
  border-radius: 12px;
  font-family: var(--font-primary);
  font-weight: 900;
  background: ${(props) =>
    props.active ? "linear-gradient(45deg, #E91E63, #FF5722)" : "transparent"};
  color: ${(props) =>
    props.active ? "rgba(255, 255, 255, 1)" : "rgba(230, 42, 9, 0.71)"};
  transition: all 0.2s ease;
  &:not(:last-child) {
    margin-right: 5px;
  }
`;

/**
 * Groups buttons at the bottom of a dialog or modal.
 */
export const DialogButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

/**
 * Context-aware button for dialogs with primary, danger, and default variants.
 */
export const DialogButton = styled.button`
  padding: 10px 20px;
  font-family: inherit;
  font-weight: 800;
  font-size: 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 200ms;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Primary variant logic: Gradient background and distinct shadow */
  ${(props) =>
    props.$primary
      ? `
    background: linear-gradient(90deg, rgb(232, 74, 22), rgb(231, 74, 26));
    color: rgba(255, 255, 255, 0.95);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.31),
      0 4px 16px rgba(255, 86, 34, 0.3);
    &:hover:not(:disabled) {
      background: linear-gradient(180deg, rgb(255, 64, 0), rgb(255, 86, 34));
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow:
        0 2px 6px rgba(0, 0, 0, 0.35),
        0 6px 20px rgba(255, 86, 34, 0.4);
    }
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  `
      : /* Danger variant logic: Red-themed styling for destructive actions */
        props.$danger
        ? `
    background: #ffebee;
    color: #d32f2f;
    border: 2px solid #ffcdd2;
    &:hover:not(:disabled) {
      background: #ffcdd2;
      border-color: #e57373;
    }
      `
        : /* Default variant logic: Minimalist white background with orange border */
          `
    background: #fff;
    color: #ff5722;
    border: 2px solid rgba(255, 87, 34, 0.3);
    &:hover:not(:disabled) {
      background: rgba(255, 87, 34, 0.05);
      border-color: #ff5722;
    }
  `}
`;

/**
 * Container for listing questions in administrative views.
 */
export const QuestionListContainer = styled.div`
  margin-top: 30px;
`;

/**
 * Styles for question text labels.
 */
export const QuestionText = styled.span`
  display: block;
  font-weight: 700;
`;

/**
 * Standard form field wrapper.
 */
export const FormField = styled.div`
  margin-bottom: 20px;
`;

/**
 * Form label with consistent brand coloring.
 */
export const FormLabel = styled.label`
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: #ff5722;
  margin-bottom: 8px;
`;

/**
 * Standard text input with focus effects and consistent borders.
 */
export const FormInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border: 2px solid rgba(255, 87, 34, 0.2);
  border-radius: 10px;
  background: #fff;
  color: #222;
  font-family: inherit;
  transition: border-color 200ms;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  &:focus {
    outline: none;
    border-color: #ff5722;
    box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
  }
  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }
`;

/**
 * Inline input field for 'fill-in-the-blanks' scenarios, supports status feedback.
 */
export const StyledBlankInput = styled.input`
  display: inline-block;
  min-width: 80px;
  width: auto;
  padding: 6px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  color: #333;
  font-size: 1rem;
  font-family: inherit;
  outline: none;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 6px;
  vertical-align: middle;

  &:focus {
    border-color: #ff5722;
    box-shadow: 0 0 0 4px rgba(255, 87, 34, 0.15);
    transform: translateY(-1px);
  }

  &:disabled {
    background: #f5f5f5;
    color: #666;
    cursor: default;
    box-shadow: none;
    border-color: #eee;
  }

  /* Status variant logic: Correct state feedback (Green) */
  ${(props) =>
    props.$status === "correct" &&
    `
    border-color: #4caf50 !important;
    background: #e8f5e9 !important;
    color: #2e7d32 !important;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1) !important;
  `}

  /* Status variant logic: Incorrect state feedback (Red) */
  ${(props) =>
    props.$status === "incorrect" &&
    `
    border-color: #f44336 !important;
    background: #ffebee !important;
    color: #c62828 !important;
    box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1) !important;
  `}
`;

/**
 * Compact circular button for icon-based actions, supports danger theme.
 */
export const IconButton = styled.button`
  width: 34px;
  height: 34px;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  color: #ff5722;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;

  &:hover {
    background: rgba(255, 86, 34, 0.12);
    transform: scale(1.07);
    border-color: rgba(255, 86, 34, 0.14);
  }

  /* Danger variant logic: Specifically for delete or destructive actions */
  ${(props) =>
    props.$danger &&
    `
    color: #d32f2f;
    &:hover {
      background: #ffebee;
    }
  `}
`;
