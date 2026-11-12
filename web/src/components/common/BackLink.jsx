/**
 * @file BackLink.jsx
 * @description Simplified navigation wrapper configuring UniversalBackButton for secondary link-style navigation.
 * @architecture Shared common UI component delegating route traversal and keyboard shortcut handling to UniversalBackButton.
 * @agent_note Accepts either children or text prop; forwards optional custom onClick or destination path.
 */

/**
 * FILE PURPOSE: A simplified wrapper component for the UniversalBackButton.
 * Specifically configured for the 'link' variant, typically used for secondary navigation.
 *
 * DEPENDENCIES:
 * - UniversalBackButton: The foundational button component for all back-navigation.
 *
 * EXPORTS:
 * - BackLink: Default export.
 *
 * INTERCONNECT:
 * - Consumed across various pages (ModuleHistoryPage, Analytics, etc.) to provide a consistent 'go back' link.
 */

import UniversalBackButton from "./UniversalBackButton";

/**
 * BackLink navigation component rendering a link-styled back button.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Function} [props.onClick] - Optional custom click handler.
 * @param {string} [props.text] - Text label for the back link.
 * @param {React.ReactNode} [props.children] - Optional custom child content.
 * @param {boolean} [props.enableShortcut=true] - Whether Alt+Left keyboard shortcut is enabled.
 * @param {string} [props.path] - Explicit navigation route target.
 * @returns {JSX.Element} Configured UniversalBackButton instance.
 */
export default function BackLink({
  onClick,
  text,
  children,
  enableShortcut = true,
  path,
}) {
  // 1. If custom children are provided, wrap them in the UniversalBackButton logic
  if (children) {
    return (
      <UniversalBackButton
        variant="link"
        onClick={onClick}
        text={text}
        enableShortcut={enableShortcut}
        path={path}
      >
        {children}
      </UniversalBackButton>
    );
  }

  // 2. Otherwise, render a standard link-style back button
  return (
    <UniversalBackButton
      variant="link"
      onClick={onClick}
      text={text}
      enableShortcut={enableShortcut}
      path={path}
    />
  );
}
