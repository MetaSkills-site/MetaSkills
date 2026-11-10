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
