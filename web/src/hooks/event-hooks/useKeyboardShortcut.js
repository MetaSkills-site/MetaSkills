/**
 * @file useKeyboardShortcut.js
 * @description Flexible hook for attaching global keyboard shortcuts with safeguards for input fields.
 *
 * DEPENDENCIES:
 * - react: useEffect, useRef
 */

import { useEffect, useRef } from "react";

/**
 * useKeyboardShortcut Hook
 *
 * @param {Object} props - Hook parameters.
 * @param {string} props.key - The key to listen for (e.g., "+").
 * @param {function} props.onTrigger - Callback when the key is pressed.
 * @param {boolean} [props.enabled=true] - Switch to activate/deactivate the listener.
 * @param {boolean} [props.requireAlt=false] - Whether the Alt key is required.
 * @param {boolean} [props.requireCtrl=false] - Whether the Ctrl key is required.
 */
export default function useKeyboardShortcut({
  key,
  onTrigger,
  enabled = true,
  requireAlt = false,
  requireCtrl = false,
  ignoreFormElements = true,
}) {
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Don't trigger if the user is in the middle of an IME composition (e.g., typing accented characters)
      if (e.isComposing) return;

      const target = e.target;
      if (!target) return;

      if (ignoreFormElements) {
        // Safeguard: Don't trigger if focused on editable elements or interactive UI
        const isEditable =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable ||
          target.getAttribute("contenteditable") === "true" ||
          target.getAttribute("role") === "textbox" ||
          target.closest("math-field") ||
          target.tagName === "MATH-FIELD";

        if (isEditable || target.disabled || target.readOnly) return;
      }

      // Check key and modifiers
      const keyMatch = e.key === key;
      const altMatch = requireAlt ? e.altKey : !e.altKey;
      const ctrlMatch = requireCtrl
        ? e.ctrlKey || e.metaKey
        : !(e.ctrlKey || e.metaKey);

      if (keyMatch && altMatch && ctrlMatch) {
        e.preventDefault();
        onTriggerRef.current?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, key, requireAlt, requireCtrl, ignoreFormElements]);
}
