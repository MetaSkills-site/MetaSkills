import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { BaseMarathonInput, InputContainer } from "../MarathonStyles";

const EquationBuilder = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
`;

const EquationPart = styled.span`
  font-size: 22px;
  font-weight: 600;
  color: #333;
`;

const LineInput = styled(BaseMarathonInput)`
  width: 90px;
`;

const ToggleButton = styled.button`
  padding: 8px 16px;
  font-size: 18px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #333;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #2196f3;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const HintText = styled.div`
  font-size: 12px;
  color: #888;
  text-align: center;
  font-style: italic;
`;

function LineEquationInput({ value, onChange, disabled }) {
  const [m, setM] = useState("");
  const [c, setC] = useState("");
  const [cSign, setCSign] = useState("+");

  const mRef = useRef(null);
  const cRef = useRef(null);

  // Parse initial value: y=mx+c or y=mx-c
  useEffect(() => {
    if (value && value.startsWith("y=")) {
      const equation = value.substring(2); // Remove "y="

      // Match pattern: number x +/- number
      const match = equation.match(/^([-\d.]+)x([+-])([\d.]+)$/);
      if (match) {
        setM(match[1]);
        setCSign(match[2]);
        setC(match[3]);
      }
    }
  }, [value]);

  const handleChange = (newM, newC, newSign) => {
    setM(newM);
    // Prevent negative checks in Input by stripping if passed, but typically input type number step any allows negatives.
    // We want C to always be positive in input field if sign is handled by toggle.
    // But user might type -5. Let's fix it in formatted output solely.

    setC(newC);
    setCSign(newSign);

    if (newM && newC) {
      // Format: y=mx+c or y=mx-c
      const cValue = parseFloat(newC);
      const absC = Math.abs(cValue);
      // Use newSign for the operator
      const formattedC = `${newSign}${absC}`;
      onChange(`y=${newM}x${formattedC}`);
    } else {
      onChange("");
    }
  };

  const toggleSign = () => {
    if (disabled) return;
    const newSign = cSign === "+" ? "-" : "+";
    handleChange(m, c, newSign);
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter" && nextRef && nextRef.current) {
      e.preventDefault();
      nextRef.current.focus();
    }
  };

  const getBorderColor = () => {
    if (!m || !c) return "#e0e0e0";
    return "#4caf50";
  };

  return (
    <InputContainer style={{ maxWidth: "450px" }}>
      <EquationBuilder>
        <EquationPart>y =</EquationPart>
        <LineInput
          ref={mRef}
          type="number"
          step="any"
          value={m}
          onChange={(e) => handleChange(e.target.value, c, cSign)}
          onKeyDown={(e) => handleKeyDown(e, cRef)}
          disabled={disabled}
          placeholder="m"
          $borderColor={getBorderColor()}
          autoFocus={!disabled}
          aria-label="Slope m"
        />
        <EquationPart>x</EquationPart>
        <ToggleButton
          type="button"
          onClick={toggleSign}
          disabled={disabled}
          aria-label="Toggle sign"
        >
          {cSign}
        </ToggleButton>
        <LineInput
          ref={cRef}
          type="number"
          step="any"
          value={c}
          onChange={(e) => handleChange(m, e.target.value, cSign)}
          disabled={disabled}
          placeholder="c"
          min="0"
          $borderColor={getBorderColor()}
          aria-label="Y-intercept c"
        />
      </EquationBuilder>

      <HintText>Build your equation in the form y = mx {cSign} c</HintText>
    </InputContainer>
  );
}

export default LineEquationInput;
