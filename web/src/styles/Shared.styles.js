/**
 * @file Shared.styles.js
 * @description Provides shared styled components and CSS fragments for consistent UI across the application.
 * @dependencies styled-components, radix-ui
 * @exports StyledTabsRoot, FormRoot, PrimaryButton, BaseInput, GhostLinkContainer
 * @interconnections Used by various components like Auth.styles.jsx and Form.styles.jsx to maintain design consistency.
 */

import styled, { css } from "styled-components";
import { Form, Tabs } from "radix-ui";

/**
 * Shared styles for Radix UI Tabs Root component.
 * Provides layout and transition effects for tabbed interfaces.
 */
const TabsRootStyles = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: -moz-fit-content;
  height: fit-content;
  align-content: center;
  margin: auto;
  font-family: var(--font-primary);
  /* Smooth transition for tab switches and layout changes */
  transition: 400ms;
`;

/**
 * Root component for tabbed navigation, wrapping Radix UI's Tabs.Root.
 */
export const StyledTabsRoot = styled(Tabs.Root)`
  ${TabsRootStyles}
`;

/**
 * Styled Radix UI Form Root component.
 * Ensures a minimum width for forms with responsive adjustments for small screens.
 */
export const FormRoot = styled(Form.Root)`
  min-width: 350px;

  /* Responsive adjustment: Ensure form doesn't overflow on very narrow screens */
  @media (max-width: 360px) {
    /* Uses the smaller of 350px or 100% of the viewport width */
    min-width: min(350px, 100%);
    width: 100%;
  }
`;

/**
 * Reusable styles for primary action buttons.
 * Includes gradient background, hover effects, and disabled states.
 */
export const PrimaryButtonStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-primary);
  font-weight: bold;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 16px;
  letter-spacing: 0.6px;
  width: 50%;
  height: -moz-fit-content;
  height: fit-content;
  /* Top margin of 30px with auto-centering on other sides */
  margin: 30px auto auto auto;
  /* Vibrant brand gradient from pink to orange */
  background: linear-gradient(45deg, #e91e63, #ff5722);
  color: #fff;
  box-shadow: 0 2px 10px #ddd;
  cursor: pointer;
  transition: 400ms;
  border: none;

  &:hover {
    filter: brightness(0.9);
    box-shadow: 0 2px 15px 5px #ddd;
  }

  /* Visually dims and disables interaction when the 'disabled' attribute is present */
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
    background-color: #ccc;
    filter: grayscale(0.5);
    transition: all 0.2s ease-in-out;
  }

  /* Accessibility: outline for keyboard focus */
  &:focus {
    box-shadow: 0 0 0 2px black;
  }

  /* Responsive: Full width on mobile/tablet devices */
  @media (max-width: 768px) {
    width: 100%;
  }
`;

/**
 * Primary action button used in forms.
 */
export const PrimaryButton = styled(Form.Submit)`
  ${PrimaryButtonStyles}
`;

/**
 * Base styles for input fields.
 * Includes consistent padding, border-radius, and focus ring effects.
 */
export const BaseInputStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #000;
  /* Semi-transparent background for a subtle look */
  background: #b8aaaf1a;
  box-shadow: 0 0 1px 2px #ddd;
  border: none;
  font-family: var(--font-primary);
  outline: none;
  transition: all 0.2s ease;

  /* Custom selection color for better brand integration */
  &::selection {
    background-color: #aaa;
    color: white;
  }

  &:hover {
    box-shadow: 0 0 0 1px #ccc;
  }

  /* Focus state: switches to solid background and distinct shadow */
  &:focus {
    box-shadow: 0 0 1px 2px #bbb;
    background: #fff;
  }
`;

/**
 * Standard text input styled component.
 */
export const BaseInput = styled.input`
  ${BaseInputStyles}
`;

/**
 * Container styles for "Ghost" links (text links with optional icons).
 * Provides hover underlines and SVG icon alignment.
 */
export const GhostLinkContainerStyles = css`
  display: flex;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  margin: 30px auto auto auto;
  cursor: pointer;
  border: none;
  background: none;

  /* Style for icons within the ghost link */
  & > svg {
    width: 20px;
    height: 20px;
    margin: 10px;
    fill: #f46536c4;
  }

  & > span {
    display: block;
    width: -moz-fit-content;
    width: fit-content;
    height: -moz-fit-content;
    height: fit-content;
    margin: auto;
  }

  & > span > a {
    font-family: var(--font-primary);
    text-decoration: none;
    font-size: 14px;
    color: #000000b8;
  }

  /* Subtle underline effect on hover with specific offset */
  &:hover > span > a {
    text-decoration: underline 2px #00000024;
    text-underline-offset: 5px;
  }
`;

/**
 * Reusable container for subtle links, often used for "Forgot Password" or navigation toggles.
 */
export const GhostLinkContainer = styled.span`
  ${GhostLinkContainerStyles}
`;
