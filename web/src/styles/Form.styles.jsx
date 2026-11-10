/**
 * @file Form.styles.jsx
 * @description Styles for form components, including tabs, input fields, labels, and select menus, primarily using Radix UI primitives.
 * @dependencies styled-components, radix-ui, ./Shared.styles
 * @exports TabsRoot, FormTabsRoot, FormButton, FormInputStyled, ForgotPassContainer, FormRoot, TabsList, TabsTrigger, TabsContent, FormField, FormLabel, FormMessage, FormSelect, SelectTriggerStyled, SelectIconStyled, SelectContentStyled, SelectViewportStyled, SelectItemStyled, SelectScrollButtonStyled, SelectItemIndicatorStyled, TagInputContainer, DropdownMenuShell
 * @interconnections Extends and re-exports components from Shared.styles.js to provide a consistent form-building API across the application.
 */

import styled, { keyframes } from "styled-components";
import { Tabs, Form } from "radix-ui";

/* Re-exporting shared styles for consistent naming conventions */
export {
  StyledTabsRoot as TabsRoot,
  StyledTabsRoot as FormTabsRoot,
  PrimaryButton as FormButton,
  BaseInput as FormInputStyled,
  GhostLinkContainer as ForgotPassContainer,
  FormRoot,
} from "./Shared.styles";

/**
 * Styled list for Radix UI Tabs.
 * Features a bordered container with responsive wrapping for mobile.
 */
export const TabsList = styled(Tabs.List)`
  flex-shrink: 0;
  display: flex;
  border: solid 1px var(--bg-muted);
  border-radius: 10px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

/**
 * Individual trigger for a tab.
 * Includes active state styling with a pink-orange gradient background.
 */
export const TabsTrigger = styled(Tabs.Trigger)`
  font-family: var(--font-primary);
  font-weight: 800;
  letter-spacing: 0.6px;
  background-color: white;
  padding: 10px 20px;
  margin: 5px;
  height: -moz-fit-content;
  height: fit-content;
  border: none;
  border-radius: inherit;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  color: var(--text-main);
  user-select: none;

  &:hover {
    background: var(--bg-muted);
  }

  /* Active tab styling logic */
  &[data-state="active"] {
    color: var(--text-inverse);
    background: linear-gradient(
      45deg,
      var(--color-secondary),
      var(--color-primary)
    );
    box-shadow:
      0 -1px 0 0 currentColor,
      0 1px 0 0 currentColor;
  }

  @media (max-width: 768px) {
    padding: 10px 15px;
    font-size: 13px;
    margin: 2px;
  }
`;

/**
 * Styled container for the content within a tab.
 */
export const TabsContent = styled(Tabs.Content)`
  flex-grow: 1;
  padding: 20px;
  background-color: var(--bg-main);
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  transition: 400ms;
  outline: none;
`;

/**
 * Grid-based layout for individual form fields.
 */
export const FormField = styled(Form.Field)`
  display: grid;
  margin-bottom: 10px;
`;

/**
 * Styled label for form fields.
 */
export const FormLabel = styled(Form.Label)`
  font-size: 15px;
  font-weight: 500;
  line-height: 35px;
  color: var(--text-main);
  letter-spacing: 0.5px;
`;

/**
 * Styled error or informational message for form validation.
 */
export const FormMessage = styled(Form.Message)`
  font-size: 13px;
  color: var(--status-error);
  opacity: 0.8;
`;

/**
 * Standard styled select element.
 */
export const FormSelect = styled.select`
  height: 35px;
  padding: 0 10px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  font-size: 15px;
  color: var(--text-main);
  background: var(--bg-muted);
  box-shadow: 0 0 0 1px var(--bg-muted);
  width: 100%;

  &:hover {
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  }

  & > option {
    font-family: var(--font-primary);
  }

  & > option:checked {
    font-weight: bold;
    background-color: lightblue;
  }
`;

/* Animation Keyframes for dropdown components */

/**
 * Slide-down and fade-in animation for content appearance.
 */
const contentShow = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

/**
 * Slide-up and fade-out animation for content disappearance.
 */
const contentHide = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-6px) scale(0.98); }
`;

/**
 * Styled trigger button for customized select components.
 */
export const SelectTriggerStyled = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 0 15px;
  font-size: 14px;
  line-height: 1;
  width: 100%;
  height: 35px;
  outline: none;
  gap: 5px;
  color: var(--text-main);
  font-weight: 500;
  border: none;
  background: var(--bg-muted);
  box-shadow: 0 0 1px 2px var(--bg-muted);
  font-family: inherit;
  transition: 200ms;

  &:hover {
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  }

  &:focus {
    box-shadow: 0 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  &[data-placeholder] {
    color: var(--text-muted);
  }
`;

/**
 * Icon container within the select trigger.
 */
export const SelectIconStyled = styled.span`
  color: var(--text-muted);
  margin-left: auto;
`;

/**
 * Styled content area for customized select menus.
 * Features rounded corners and complex shadows.
 */
export const SelectContentStyled = styled.div`
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #ddd;
  box-shadow:
    0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  z-index: 60;
  min-width: var(--radix-select-trigger-width);
  max-height: 300px;
  will-change: transform, opacity;
  /* Animation logic for showing/hiding the dropdown */
  animation: ${contentShow} 160ms cubic-bezier(0.16, 1, 0.3, 1);
  &[data-state="closed"] {
    animation: ${contentHide} 120ms cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

/**
 * Viewport container for scrolling within a select menu.
 */
export const SelectViewportStyled = styled.div`
  padding: 8px 10px;
  max-height: inherit;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  &scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  ::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }
`;

/**
 * Individual item within a customized select menu.
 * Includes highlighted and checked state styling.
 */
export const SelectItemStyled = styled.div`
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  color: #333;
  border-radius: 8px;
  display: flex;
  justify-content: start;
  align-items: center;
  height: 32px;
  width: 100%;
  padding: 0 12px;
  position: relative;
  user-select: none;
  outline: none;
  cursor: pointer;
  transition: background-color 160ms ease;
  font-family: var(--font-primary);

  &[data-highlighted] {
    background: rgba(0, 0, 0, 0.05);
  }

  &[data-state="checked"] {
    background: rgba(233, 30, 99, 0.08); /* Hint of secondary color */
    color: var(--color-secondary);
    font-weight: 700;
  }
`;

/**
 * Scroll buttons for navigate long select lists.
 */
export const SelectScrollButtonStyled = styled.div`
  display: flex;
  align-items: center;
  outline: none;
  justify-content: center;
  height: 25px;
  background-color: white;
  color: #555;
  cursor: default;
`;

/**
 * Visual indicator (e.g., checkmark) for the selected item.
 */
export const SelectItemIndicatorStyled = styled.span`
  position: absolute;
  right: 10px;
  width: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: end;
  color: var(--color-secondary);
`;

/**
 * Container for tag-based input fields.
 */
export const TagInputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 2px solid rgba(255, 87, 34, 0.2);
  border-radius: 10px;
  background: var(--bg-main);
  position: relative;
`;

/**
 * Wrapper for dropdown menu structures.
 */
export const DropdownMenuShell = styled.div`
  background: var(--bg-main);
  border: 1px solid rgba(255, 87, 34, 0.2);
  border-radius: 12px;
  box-shadow:
    0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  overflow: hidden;
`;
