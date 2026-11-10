/**
 * @file MathField.jsx
 * @description A sophisticated LaTeX editor component built around the MathLive library.
 * It provides a rich interface for entering mathematical expressions, featuring a virtual keyboard,
 * smart editing modes, and customizable styling.
 *
 * @dependencies
 * - react: For hooks and ref management.
 * - styled-components: For layout and state-based styling (success, error, disabled).
 * - mathlive: The underlying LaTeX editing engine.
 *
 * @exports MathField (default)
 * @interconnections Used in QuestionBlock for user input and in Latex.jsx for rendering.
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import styled from "styled-components";
import "mathlive";

const Wrapper = styled.span`
  display: ${(props) => (props.$block ? "block" : "inline-block")};
  width: ${(props) => (props.$block ? "100%" : "auto")};
  font-family: var(--font-primary);

  margin: ${(props) => (props.$readOnly ? "0" : "0 2px")};
  padding: ${(props) => {
    if (props.$readOnly) return "0";
    return "6px 10px";
  }};
  border: 2px solid
    ${(props) => {
      if (props.$status === "success") return "#4caf50";
      if (props.$status === "error") return "#f44336";
      if (props.$readOnly) return "transparent";
      if (props.$disabled) return "#dadadaff";
      return "rgba(33, 150, 243, 0.12)";
    }};
  border-radius: 10px;
  background: ${(props) => {
    if (props.$status === "success") return "#e8f5e9";
    if (props.$status === "error") return "#ffebee";
    if (props.$readOnly) return "transparent";
    if (props.$disabled) return "#f5f5f5e2";
    return "#fff";
  }};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(props) =>
    props.$readOnly || props.$disabled || props.$status
      ? "none"
      : "0 2px 8px rgba(0, 0, 0, 0.02)"};
  cursor: ${(props) =>
    props.$disabled ? "not-allowed" : props.$readOnly ? "default" : "text"};
  min-width: ${(props) => (props.$readOnly ? "auto" : "180px")};

  &:focus-within {
    border-color: ${(props) => {
      if (props.$readOnly) return "transparent";
      if (props.$disabled) return "#dadadaff";
      return "#2196f3";
    }};
    box-shadow: ${(props) =>
      props.$readOnly || props.$disabled
        ? "none"
        : "0 4px 15px rgba(33, 150, 243, 0.12)"};
    transform: ${(props) =>
      props.$readOnly || props.$disabled ? "none" : "translateY(-1px)"};
  }

  math-field {
    display: block;
    width: 100%;
    min-width: ${(props) => (props.$block ? "unset" : "20px")};
    font-size: 1em;
    border: none;
    background: transparent;
    outline: none;
    font-family: inherit;
    color: ${(props) => (props.$disabled ? "#313131ff" : "#333")};
    padding: 0;

    &::part(menu-toggle) {
      display: none;
    }

    /* Strictly force transparency for all internal MathLive LaTeX nodes */
    span.ML__container,
    span.ML__container span,
    span.ML__container .ML__text,
    span.ML__container .ML__base,
    span.ML__container .ML__strut {
      background-color: transparent !important;
    }

    /* Style the virtual keyboard toggle icon */
    span.ML__container > div > div.ML__virtual-keyboard-toggle > svg {
      fill: ${(props) => (props.$disabled ? "#999" : "#2196f3")};
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    &:hover span.ML__container > div > div.ML__virtual-keyboard-toggle > svg {
      opacity: ${(props) => (props.$disabled ? 0.8 : 1)};
    }
  }
`;

const MathField = forwardRef(
  (
    {
      value,
      onChange,
      onInput,
      onKeyDown,
      readOnly = false,
      disabled = false,
      block = false,
      placeholder,
      style,
      className,
      virtualKeyboardMode = "onfocus",
      autoFocus = false,
      status,
      ...props
    },
    ref,
  ) => {
    const mfRef = useRef(null);

    // Expose the underlying math-field DOM element via the forwarded ref
    useImperativeHandle(ref, () => mfRef.current);

    /**
     * Effect to configure the MathLive element and attach input/keyboard event listeners.
     */
    useEffect(() => {
      const mf = mfRef.current;
      if (!mf) return;

      // Configuration settings for MathLive
      mf.smartMode = true;
      mf.smartFence = true;
      mf.virtualKeyboardMode = virtualKeyboardMode;
      mf.readOnly = readOnly;
      mf.disabled = disabled;

      // Define layouts for the virtual keyboard
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.layouts = [
          "numeric",
          "symbols",
          "alphabetic",
        ];
      }

      const handleInput = (evt) => {
        if (onInput) onInput(evt);
        if (onChange) onChange(evt.target.value);
      };

      const handleKeyDown = (evt) => {
        if (evt.key === "Enter" && onKeyDown) {
          evt.preventDefault();
          onKeyDown(evt);
        }
      };

      mf.addEventListener("input", handleInput);
      mf.addEventListener("keydown", handleKeyDown);

      return () => {
        mf.removeEventListener("input", handleInput);
        mf.removeEventListener("keydown", handleKeyDown);
      };
    }, [onChange, onInput, onKeyDown, virtualKeyboardMode, readOnly, disabled]);

    /**
     * Effect to inject custom CSS into the component's Shadow DOM.
     * This is required to force transparency on certain MathLive internal text nodes.
     */
    useEffect(() => {
      const mf = mfRef.current;
      if (!mf) return;

      const injectStyle = () => {
        if (
          mf.shadowRoot &&
          !mf.shadowRoot.querySelector("#custom-transparency-style")
        ) {
          const style = document.createElement("style");
          style.id = "custom-transparency-style";
          style.textContent = `
          .ML__text {
            background-color: transparent !important;
          }
          .ML__base {
             background-color: transparent !important;
          }
        `;
          mf.shadowRoot.appendChild(style);
          return true;
        }
        return false;
      };

      if (injectStyle()) return;

      // Retry mechanism if the shadowRoot isn't immediately available
      const intervalId = setInterval(() => {
        if (injectStyle()) {
          clearInterval(intervalId);
        }
      }, 100);

      return () => clearInterval(intervalId);
    }, []);

    /**
     * Handles the autoFocus property for the math-field.
     */
    useEffect(() => {
      if (autoFocus && mfRef.current && !readOnly && !disabled) {
        const timer = setTimeout(() => {
          mfRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [autoFocus, readOnly, disabled]);

    /**
     * Synchronizes the internal math-field value when the `value` prop changes.
     */
    useEffect(() => {
      const mf = mfRef.current;
      if (!mf) return;

      if (mf.value !== value) {
        mf.setValue(value || "", { suppressChangeNotifications: true });
      }
    }, [value]);

    /**
     * Handles the rendering of the placeholder text.
     * Ensures plain text placeholders are wrapped in \text{} for proper LaTeX font rendering.
     */
    useEffect(() => {
      if (mfRef.current && placeholder) {
        if (placeholder.startsWith("\\")) {
          mfRef.current.setAttribute("placeholder", placeholder);
        } else {
          mfRef.current.setAttribute("placeholder", `\\text{${placeholder}}`);
        }
      } else if (mfRef.current) {
        mfRef.current.removeAttribute("placeholder");
      }
    }, [placeholder]);

    return (
      <Wrapper
        $block={block}
        $readOnly={readOnly}
        $disabled={disabled}
        $status={status}
        style={style}
        className={className}
      >
        <math-field ref={mfRef} {...props} />
      </Wrapper>
    );
  },
);

MathField.displayName = "MathField";

export default MathField;
