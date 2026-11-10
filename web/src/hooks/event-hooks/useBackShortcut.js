/**
 * @file useBackShortcut.js
 * @description Manages a global keyboard shortcut (Alt + Backspace) for triggering back navigation callbacks.
 *
 * DEPENDENCIES:
 * - react: useEffect, useRef
 *
 * EXPORTS:
 * - default: useBackShortcut - Hook for attaching the back navigation listener.
 *
 * INTERCONNECTIONS:
 * - Used in views where a custom "Back" action is required (e.g., navigating between quiz modules or closing modals).
 */

import { useEffect, useRef } from "react";

/**
 * useBackShortcut Hook
 *
 * Attaches a window-level event listener for the Alt + Backspace keyboard combination.
 *
 * @param {function} onBack - Callback function to trigger when the shortcut is detected.
 * @param {boolean} [enabled=true] - Switch to activate or deactivate the listener.
 */
export default function useBackShortcut(onBack, enabled = true) {
  // Use a ref for the callback to prevent the need for re-attaching the event listener on every re-render
  const onBackRef = useRef(onBack);

  // Sync the ref with the latest onBack callback provided to the hook
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    // Exit if the hook is explicitly disabled
    if (!enabled) return;

    /**
     * handleKeyDown
     * Event listener to detect Alt + Backspace key combination.
     *
     * @param {KeyboardEvent} e - The native keyboard event.
     */
    const handleKeyDown = (e) => {
      // Trigger back navigation on the Alt + Backspace combination
      if (e.altKey && (e.key === "Backspace" || e.code === "Backspace")) {
        // Ensure a valid callback is available before execution
        if (!onBackRef.current) return;

        // Prevent default browser behavior (which might be "Back" in some older browsers)
        e.preventDefault();
        onBackRef.current();
      }
    };

    // Attach listener to the global window object
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup: Remove listener when the component unmounts or dependency changes
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}
