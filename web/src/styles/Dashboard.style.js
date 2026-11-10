/**
 * @file Dashboard.style.js
 * @description Comprehensive styles for the main User Dashboard, including navigation, dropdown menus, file lists, and code previews.
 * @dependencies styled-components, react-icons/fa
 * @exports DashboardContainer, WelcomeText, DashboardOptions, Label, ActionItem, IconWrapper, Divider, AnimatedProfileWrapper, StyledDropdownContent, StyledDropdownItem, StyledDropdownSeparator, FileManagerContainer, FileList, FileItem, FileInfo, FileDetails, FileName, FileMeta, FileActions, ActionIcon, ButtonBar, CodePreviewContainer, CodeBlock, StyledSpinner
 * @interconnections Used throughout the dashboard interface to maintain a cohesive visual language and provide interactive feedback.
 */

import styled, { keyframes } from "styled-components";
import { FaSpinner } from "react-icons/fa";

/**
 * Main dashboard wrapper that centers content and provides a soft background.
 */
export const DashboardContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fffafa; /* Very light background for contrast */
  font-family: var(--font-primary);
`;

/**
 * Centered welcome heading with a vibrant pink-orange gradient.
 */
export const WelcomeText = styled.h1`
  font-family: var(--font-primary);
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 40px;
  background: linear-gradient(90deg, #ff538d, #ff7b51);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
`;

/**
 * Container for the main dashboard action buttons.
 * Uses flexbox and responsive wrapping for smaller screens.
 */
export const DashboardOptions = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 40px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  gap: 30px;
  position: relative;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
    justify-content: center;
    max-width: 90%;
  }
`;

/**
 * Floating label that appears on hover over an ActionItem.
 * Uses absolute positioning relative to the ActionItem.
 */
export const Label = styled.span`
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
  opacity: 0; /* Hidden by default */
  transition: all 0.2s ease;
  pointer-events: none;
  background: white;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

/**
 * Wrapper for individual dashboard action icons.
 * Triggers the visibility of the Label component on hover.
 */
export const ActionItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  width: 60px; /* Consistent horizontal footprint */
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-5px);

    ${Label} {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  a {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
`;

/**
 * Visual background for action icons.
 * Supports a primary variant with a gradient background.
 */
export const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  /* Primary action styling (e.g., Marathon mode) */
  ${(props) =>
    props.$primary
      ? `
    background: linear-gradient(135deg, #ff7b51 0%, #ff538d 100%);
    box-shadow: 0 10px 25px rgba(255, 83, 141, 0.4);
    
    svg {
      fill: white;
      width: 28px;
      height: 28px;
    }
  `
      : `
    background: white;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    
    svg {
      fill: #ff538d;
      width: 24px;
      height: 24px;
    }

    &:hover {
      box-shadow: 0 8px 25px rgba(255, 83, 141, 0.15);
    }
  `}
`;

/**
 * Subtle vertical divider to separate different logical sections in the dashboard options.
 */
export const Divider = styled.div`
  width: 1px;
  height: 40px;
  background: #eee;
  margin: 0 10px;
`;

/**
 * Keyframes for a smooth background-position shift to create a moving gradient effect.
 */
const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

/**
 * Specialized profile avatar wrapper with a multi-color animated gradient border effect.
 */
export const AnimatedProfileWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  overflow: hidden;
  user-select: none;
  width: 42px;
  height: 42px;
  margin: 0;
  border-radius: 100%;
  box-shadow:
    -3px -3px 7px -5px #8492dd26,
    3px 3px 8px -3px #da7c7424,
    6px 0 16px -4px #b5b5b52e;
  border: solid 1px #0000001a;
  filter: drop-shadow(rgba(244, 67, 54, 0.5) 0px 0px 20px)
    drop-shadow(rgba(255, 114, 0, 0.5) 0px 0px 100px);
  cursor: pointer;
  background: linear-gradient(
    -45deg,
    #dcc639ff,
    #8bc34a,
    #8eaf4cff,
    #8bc34a,
    #dc8839ff,
    #c3604aff,
    #7c4cafff,
    #4a56c3ff
  );
  background-size: 400% 400%; /* Required for background-position animation to work */
  animation: ${gradientAnimation} 10s linear infinite;
  color: #fafafa;
  font-family: var(--font-primary);
  font-size: 18px;
  font-weight: 800;
`;

/**
 * Keyframes for a subtle slide-up and fade-in animation for dropdown menus.
 */
const slideUpAndFade = keyframes`
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Styles for Radix UI Dropdown Content.
 * Features rounded corners, custom animation, and a high z-index.
 */
export const StyledDropdownContent = styled.div`
  min-width: 220px;
  background-color: white;
  border-radius: 16px;
  padding: 8px;
  box-shadow:
    0 10px 38px -10px rgba(22, 23, 24, 0.35),
    0 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  animation-name: ${slideUpAndFade};
  z-index: 100;
  font-family: var(--font-primary);

  .Arrow {
    fill: white;
  }
`;

/**
 * Styles for individual dropdown menu items.
 * Includes hover states, disabled states, and specialized styling for logout.
 */
export const StyledDropdownItem = styled.div`
  font-size: 14px;
  line-height: 1;
  color: #555;
  border-radius: 8px;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 10px;
  position: relative;
  user-select: none;
  outline: none;
  cursor: pointer;
  gap: 10px;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }

  &[data-disabled] {
    color: #ccc;
    pointer-events: none;
  }

  svg {
    width: 18px;
    height: 18px;
    color: #777;
  }

  /* Red-themed hover state for logout actions */
  &.logout {
    color: #e91e63;

    svg {
      color: #e91e63;
    }

    &:hover {
      background-color: #fff0f5;
    }
  }
`;

/**
 * Horizontal separator within dropdown menus.
 */
export const StyledDropdownSeparator = styled.div`
  height: 1px;
  background-color: #eee;
  margin: 5px;
`;

/**
 * Main container for the administrative file management interface.
 */
export const FileManagerContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  margin-top: 20px;
`;

/**
 * Scrollable list of files in the file manager.
 * Features a custom-styled scrollbar for cross-browser consistency.
 */
export const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;

  /* Webkit-based custom scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  &scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  ::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #aaa;
  }
`;

/**
 * Individual entry in the file manager list.
 * Features a subtle elevation effect on hover.
 */
export const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    border-color: #ddd;
    transform: translateY(-1px);
  }
`;

/**
 * Grouping component for file icon and text metadata.
 */
export const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
`;

/**
 * Container for file name and subordinate metadata (date, size, etc.).
 */
export const FileDetails = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0; /* Critical for text-overflow to work in flex layouts */
`;

/**
 * Component for displaying the file name with truncation for long strings.
 */
export const FileName = styled.span`
  font-weight: 600;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
`;

/**
 * Secondary metadata text for files (e.g., "Updated 2 days ago").
 */
export const FileMeta = styled.span`
  font-size: 11px;
  color: #888;
  margin-top: 2px;
`;

/**
 * Layout wrapper for interactive actions associated with a file (e.g., View, Delete).
 */
export const FileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * Generic icon button for file actions.
 * Supports a danger variant with red color scheme.
 */
export const ActionIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  color: ${(props) => (props.$danger ? "#ff5252" : "#555")};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${(props) => (props.$danger ? "#ffebee" : "#f5f5f5")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Control bar usually placed at the bottom of a list or form.
 */
export const ButtonBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  width: 100%;
`;

/**
 * Dark-themed container for displaying source code or raw data previews.
 */
export const CodePreviewContainer = styled.div`
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  margin-top: 10px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
`;

/**
 * Formatted code block with monospace font and custom scrollbar.
 */
export const CodeBlock = styled.pre`
  margin: 0;
  padding: 15px;
  overflow: auto;
  font-family: "Fira Code", "Roboto Mono", monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #d4d4d4;
  tab-size: 2;

  scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  &scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #1e1e1e;
  }
  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
`;

/**
 * Keyframes for a 360-degree rotation.
 */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/**
 * Animated spinner icon for indicating background activity or loading states.
 */
export const StyledSpinner = styled(FaSpinner)`
  animation: ${spin} 1s linear infinite;
`;
