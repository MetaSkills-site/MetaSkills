/**
 * @file MathInput.jsx
 * @description Provides a LaTeX-capable math input field converting MathLive expressions to normalized backend string formats.
 * @architecture Marathon input layer wrapper around MathField supporting forward refs and imperative focus handles.
 * @agent_note Strips formatting and converts LaTeX math constructs into canonical expression strings via convertLatexToString.
 */

import { useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import styled from "styled-components";
import MathField from "../../MathField";

const MathFieldWrapper = styled.div`
  width: 100%;
`;

/**
 * Logic to determine if a string should be wrapped in \text{} for MathLive.
 * Matches if it contains spaces (prompts/instructions) or is a multi-char alpha word.
 * Does not match if it contains explicit math symbols or backslashes.
 */
const isTextLike = (str) => {
  if (!str) return false;
  const s = String(str);

  // Already LaTeX or contains Math symbols
  if (s.includes("\\")) return false;
  if (/[+=^*/()_]/.test(s)) return false; // Common math symbols

  // Contains spaces -> Likely a sentence/phrase -> Text
  if (s.includes(" ")) return true;

  // Purely alphabetic and length > 1 -> Likely a word -> Text
  // (Single chars 'x' are math variables)
  if (/^[a-zA-Z.,?!:;'"-]{2,}$/.test(s)) return true; // Allows punctuation

  return false;
};

/**
 * Converts MathLive LaTeX output to backend-friendly string format.
 */
const convertLatexToString = (latex) => {
  if (!latex) return "";
  let str = latex;

  // 1. Basic replacements
  str = str.replace(/\\left|\\right/g, "");
  str = str.replace(/\\cdot|\\times/g, "*");
  str = str.replace(/\\pi/g, "pi");

  // 2. Fractions: \frac{a}{b} -> (a)/(b)
  // Handle nested fractions via loop with safety bound
  let loopCount = 0;
  while (str.includes("\\frac") && loopCount < 10) {
    str = str.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
    loopCount++;
  }

  // 3. Square Root: \sqrt{x} -> sqrt(x)
  loopCount = 0;
  while (str.includes("\\sqrt") && loopCount < 10) {
    str = str.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
    loopCount++;
  }

  // 4. Superscript/Power: x^{2} -> x^2 or x^(2)
  // Basic regex for { ... } removal if simple number
  str = str.replace(/\^\{([0-9]+)\}/g, "^$1");
  str = str.replace(/\^\{([^{}]+)\}/g, "^($1)"); // complex power

  // 5. Cleanup standard LaTeX commands left behind
  str = str.replace(/\\/g, "");
  str = str.replace(/\s+/g, "");

  return str;
};

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {string|number} props.value - LaTeX or plaintext representation of the math input.
 * @param {Function} props.onChange - Handler called with normalized string representation of the math input.
 * @param {boolean} [props.disabled=false] - Whether the math input is disabled.
 * @param {string} [props.placeholder] - Placeholder text rendered inside the math field.
 * @param {boolean} [props.autoFocus=false] - Whether the field automatically focuses on mount.
 * @param {Function} [props.onKeyDown] - Keydown event handler.
 * @param {React.Ref} ref - Forwarded reference to the underlying MathField imperative element.
 * @returns {JSX.Element} The rendered MathLive input wrapper.
 */
const MathInput = forwardRef(
  (
    { value, onChange, disabled, placeholder, autoFocus = false, onKeyDown },
    ref,
  ) => {
    const mfRef = useRef(null);
    const lastLatexRef = useRef(null);

    useImperativeHandle(ref, () => mfRef.current);

    const handleChange = useCallback(
      (latex) => {
        lastLatexRef.current = latex;
        const converted = convertLatexToString(latex);
        onChange(converted);
      },
      [onChange],
    );

    // Calculate the value to pass to the MathField
    // If the incoming value matches what we just converted, use the raw LaTeX
    // from the ref to prevent cursor jumping/reformatting loops.
    let effectiveValue = value;
    if (value !== null && value !== undefined) {
      const valStr = String(value);
      if (
        lastLatexRef.current &&
        convertLatexToString(lastLatexRef.current) === valStr
      ) {
        effectiveValue = lastLatexRef.current;
      } else {
        // External change or mismatch -> use the formatted prop
        effectiveValue = isTextLike(valStr) ? `\\text{${valStr}}` : valStr;
      }
    } else {
      effectiveValue = "";
    }

    const formattedPlaceholder = isTextLike(placeholder)
      ? `\\text{${placeholder}}`
      : placeholder;

    return (
      <MathFieldWrapper>
        <MathField
          ref={mfRef}
          value={effectiveValue}
          onChange={handleChange}
          disabled={disabled}
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          placeholder={formattedPlaceholder}
          virtualKeyboardMode="manual"
          block
          style={{
            width: "100%",
            minWidth: "150px",
          }}
        />
      </MathFieldWrapper>
    );
  },
);

MathInput.displayName = "MathInput";

export default MathInput;
