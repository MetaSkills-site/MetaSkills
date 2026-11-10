/**
 * @file useStepperShortcuts.js
 * @description Manages keyboard shortcuts (Alt + . and Alt + ,) for navigating through stepper-based interfaces.
 *
 * DEPENDENCIES:
 * - react: useEffect, useRef
 *
 * EXPORTS:
 * - default: useStepperShortcuts - Hook for attaching stepper navigation listeners.
 *
 * INTERCONNECTIONS:
 * - Frequently used in quiz or form components where a multi-step process is implemented.
 */

import { useEffect, useRef } from "react";

/**
 * useStepperShortcuts Hook
 *
 * Handles Alt + . for "Next" and Alt + , or Alt + Backspace for "Previous".
 *
 * @param {Object} props - Hook parameters.
 * @param {function} props.onNext - Callback for forward navigation.
 * @param {function} props.onPrev - Callback for backward navigation.
 * @param {boolean} [props.isNextDisabled=false] - Condition to block forward navigation.
 * @param {boolean} [props.enabled=true] - Switch to activate/deactivate the listeners.
 */
export default function useStepperShortcuts({
  onNext,
  onPrev,
  isNextDisabled = false,
  enabled = true,
}) {
  // Use refs for callbacks to avoid re-attaching listeners on every render
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);

  // Keep refs in sync with the latest provided callbacks
  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  }, [onNext, onPrev]);

  useEffect(() => {
    // Exit if the hook is explicitly disabled
    if (!enabled) return;

    /**
     * handleKeyDown
     * Event listener to process specific key combinations.
     *
     * @param {KeyboardEvent} e - The native keyboard event.
     */
    const handleKeyDown = (e) => {
      const target = e.target;

      if (target.disabled || target.readOnly) return;

      // Listen for combinations involving the Alt key
      if (e.altKey) {
        // Alt + . (Next)
        if (
          (e.key === "." || e.code === "Period") &&
          onNextRef.current &&
          !isNextDisabled
        ) {
          e.preventDefault();
          onNextRef.current();
        }
        // Alt + , OR Alt + Backspace (Previous)
        else if (
          (e.key === "," ||
            e.code === "Comma" ||
            e.key === "Backspace" ||
            e.code === "Backspace") &&
          onPrevRef.current
        ) {
          e.preventDefault();
          onPrevRef.current();
        }
      }
    };

    // Attach listener to the global window object
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup: Remove listener when the component unmounts or dependencies change
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, isNextDisabled]);
}
