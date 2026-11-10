// eslint-disable-next-line
import React from "react";
import PolynomialInput from "./PolynomialInput";
import DynamicInput from "./DynamicInput";

/**
 * InputFactory - Selects input component based on backend configuration.
 * Falls back to legacy logic only where explicitly necessary, but prefers inputConfig.
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
