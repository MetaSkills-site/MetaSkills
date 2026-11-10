import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { BaseMarathonInput, InputContainer } from "../MarathonStyles";

// Layout Strategies
const Layouts = {
  // Default: Vertical stack
  default: styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
  `,
  // Horizontal Row (e.g., Sequence x, y)
  row: styled.div`
    display: flex;
    flex-direction: row;
    gap: 15px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  `,
  // Fraction style (Vertical with divider potentially, but here just stacked tightly)
  fraction: styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
    width: -moz-fit-content;
    width: fit-content;
    margin: 0 auto;
  `,
  // Grid for many inputs
  grid: styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    width: 100%;
    justify-items: center;
  `,
};

const InputWrapper = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.$layout === "inline" ? "row" : "column")};
  gap: ${(props) => (props.$layout === "inline" ? "10px" : "5px")};
  align-items: center;
  justify-content: center;
`;

const Label = styled.label`
  font-size: 14px;
  color: #555;
  font-weight: 600;
  font-family: var(--font-primary);
`;

const DynamicInputField = styled(BaseMarathonInput)`
  min-width: 80px;
  /* Dynamic width based on placeholder length somewhat */
  width: ${(props) => props.$width || "auto"};
`;

import MathInput from "./MathInput";

const DynamicInput = ({ config, value, onChange, disabled, onKeyDown }) => {
  // config structure: { type, layout, fields: [{ label, placeholder, type }], separator }
  const { layout = "default", fields = [], separator = "," } = config || {};

  // Helper functions for escaping/unescaping separator
  const escapeSeparator = (val, sep) => {
    if (!val) return "";
    return val
      .replaceAll("%", "%25")
      .replaceAll(sep, `%${sep.charCodeAt(0).toString(16).toUpperCase()}`);
  };

  const unescapeSeparator = (val, sep) => {
    if (!val) return "";
    const encodedSep = `%${sep.charCodeAt(0).toString(16).toUpperCase()}`;
    return val.replaceAll(encodedSep, sep).replaceAll("%25", "%");
  };

  // Initialize state
  const [values, setValues] = useState(() => {
    if (!value) return Array(fields.length).fill("");
    const parts = value
      .toString()
      .split(separator)
      .map((p) => unescapeSeparator(p, separator));
    return fields.map((_, i) => parts[i] || "");
  });

  const inputRefs = useRef([]);

  useEffect(() => {
    if (value === undefined || value === null) {
      setValues(Array(fields.length).fill(""));
      return;
    }

    const strVal = value.toString();
    const currentJoined = values
      .map((v) => escapeSeparator(v, separator))
      .join(separator);

    if (strVal !== currentJoined) {
      const parts = strVal
        .split(separator)
        .map((p) => unescapeSeparator(p, separator));
      setValues(fields.map((_, i) => parts[i] || ""));
    }
  }, [value, fields.length, separator]);

  const handleChange = (index, newValue) => {
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);

    if (newValues.every((v) => v === "")) {
      onChange("");
    } else {
      const escapedValues = newValues.map((v) => escapeSeparator(v, separator));
      onChange(escapedValues.join(separator));
    }
  };

  const getBorderColor = (val) => {
    if (!val) return "#e0e0e0";
    return "#4caf50"; // Green if filled
  };

  const LayoutComponent = Layouts[layout] || Layouts.default;

  return (
    <InputContainer>
      <LayoutComponent>
        {fields.map((field, index) => (
          <React.Fragment key={index}>
            <InputWrapper $layout={field.layout}>
              {field.label && <Label>{field.label}</Label>}

              {config.type === "math" ? (
                <MathInput
                  ref={(el) => (inputRefs.current[index] = el)} // Ref might not attach directly to math-field inside wrapper
                  value={values[index]}
                  onChange={(val) => handleChange(index, val)}
                  disabled={disabled}
                  placeholder={field.placeholder || ""}
                  autoFocus={index === 0 && !disabled}
                  onKeyDown={onKeyDown}
                />
              ) : (
                <DynamicInputField
                  ref={(el) => (inputRefs.current[index] = el)}
                  type={field.type || "text"}
                  value={values[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (index < fields.length - 1) {
                        e.preventDefault();
                        inputRefs.current[index + 1]?.focus();
                      } else if (onKeyDown) {
                        onKeyDown(e);
                      }
                    }
                  }}
                  disabled={disabled}
                  placeholder={field.placeholder || ""}
                  $borderColor={getBorderColor(values[index])}
                  $width={fields.length > 2 ? "100px" : "150px"}
                  autoFocus={index === 0 && !disabled}
                />
              )}
            </InputWrapper>
          </React.Fragment>
        ))}
      </LayoutComponent>
    </InputContainer>
  );
};

export default DynamicInput;
