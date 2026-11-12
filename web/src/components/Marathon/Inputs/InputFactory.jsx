/**
 * @file InputFactory.jsx
 * @description Factory component selecting the appropriate marathon input renderer based on declarative backend question configuration.
 * @architecture Marathon subsystem input resolver routing question schemas to specialized mathematical or multi-field input controls.
 * @agent_note Inspect questionData.inputConfig type; fall back to generic single-field DynamicInput when configuration is missing.
 */

// eslint-disable-next-line
import React from "react";
import PolynomialInput from "./PolynomialInput";
import DynamicInput from "./DynamicInput";

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.questionData - Question configuration containing inputConfig schema and metadata.
 * @param {string|number} props.value - Current value of the input field.
 * @param {Function} props.onChange - Handler called when the input value updates.
 * @param {boolean} [props.disabled=false] - Whether the input is disabled.
 * @param {Function} [props.onKeyDown] - Optional keydown handler for navigation or submission.
 * @returns {JSX.Element} The resolved input component for the question.
 */
function InputFactory({ questionData, value, onChange, disabled, onKeyDown }) {
  const { inputConfig } = questionData;

  // 1. Priority: Backend Configuration
  if (inputConfig) {
    switch (inputConfig.type) {
      case "polynomial":
        return (
          <PolynomialInput
            value={value}
            onChange={onChange}
            disabled={disabled}
            labels={inputConfig.labels || ["x³", "x²", "x", ""]}
            hint={questionData.description}
            groupBy={inputConfig.groupBy} // Pass grouping config
            prefix={inputConfig.prefix}
            separator={inputConfig.separator}
            onKeyDown={onKeyDown}
          />
        );
      case "math":
      case "number":
      case "text":
        return (
          <DynamicInput
            config={inputConfig}
            value={value}
            onChange={onChange}
            disabled={disabled}
            onKeyDown={onKeyDown}
          />
        );
      default:
        // Fallback for unknown config types -> treats as generic single input
        return (
          <DynamicInput
            config={{ fields: [{ placeholder: "Enter answer" }] }}
            value={value}
            onChange={onChange}
            disabled={disabled}
            onKeyDown={onKeyDown}
          />
        );
    }
  }

  // 2. Fallback: Legacy / Heuristic Logic (Deprecating, but kept for safety if config missing)
  console.warn("Missing inputConfig for question:", questionData.id);

  return (
    <DynamicInput
      config={{ fields: [{ placeholder: "Enter answer" }] }}
      value={value}
      onChange={onChange}
      disabled={disabled}
      onKeyDown={onKeyDown}
    />
  );
}

export default InputFactory;
