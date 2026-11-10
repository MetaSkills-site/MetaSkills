/**
 * @file Latex.jsx
 * @description A wrapper component specifically for rendering LaTeX content using the MathField component.
 * It simplifies the usage of MathField for read-only mathematical displays.
 *
 * @dependencies
 * - MathField: The underlying LaTeX rendering and editing component.
 *
 * @exports Latex (default)
 * @interconnections Extensively used for displaying formulas in questions and explanations.
 */

import MathField from "./MathField";

export default function Latex({
  children,
  value,
  block = false,
  readOnly = true,
  style,
  onChange,
  onInput,
  ...props
}) {
  // Normalize content from props or children
  const content = String(value !== undefined ? value : children || "");

  return (
    <MathField
      value={content}
      readOnly={readOnly}
      block={block}
      style={{
        display: block ? "block" : "inline-block",
        minWidth: "10px",
        minHeight: "1.2em",
        ...style,
      }}
      onChange={onChange}
      onInput={onInput}
      {...props}
    />
  );
}
