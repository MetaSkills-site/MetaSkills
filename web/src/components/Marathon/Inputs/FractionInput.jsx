import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { BaseMarathonInput } from "../MarathonStyles";

const FractionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 300px;
  margin: 0 auto;
`;

const FractionDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const FractionInputStyled = styled(BaseMarathonInput)`
  width: 120px;
`;

const FractionBar = styled.div`
  width: 140px;
  height: 2px;
  background: #333;
  margin: 4px 0;
`;

const Label = styled.label`
  font-size: 13px;
  color: #666;
  font-weight: 500;
  margin-bottom: 4px;
`;

const HintText = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 8px;
  font-style: italic;
`;

function FractionInputComponent({ value, onChange, disabled }) {
  const [numerator, setNumerator] = useState("");
  const [denominator, setDenominator] = useState("");
  const numeratorRef = useRef(null);
  const denominatorRef = useRef(null);

  // Parse initial value
  useEffect(() => {
    if (value && value.includes("/")) {
      const [n, d] = value.split("/");
      setNumerator(n);
      setDenominator(d);
    } else if (value && !value.includes("/")) {
      // Just a number, treat as whole number (denominator = 1)
      setNumerator(value);
      setDenominator("1");
    }
  }, [value]);

  // Serialize and notify parent
  const handleChange = (newNum, newDenom) => {
    setNumerator(newNum);
    setDenominator(newDenom);

    // Build fraction string
    if (newNum && newDenom) {
      const fractionStr = `${newNum}/${newDenom}`;
      onChange(fractionStr);
    } else if (newNum && !newDenom) {
      onChange(newNum);
    } else {
      onChange("");
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "numerator" && denominatorRef.current) {
        denominatorRef.current.focus();
      }
    }

    if (e.key === "Tab" && field === "numerator" && e.shiftKey === false) {
      // Allow natural tab to denominator
      return;
    }
  };

  const getBorderColor = () => {
    if (!numerator || !denominator) return "#e0e0e0";
    if (denominator === "0") return "#f44336"; // Invalid
    return "#4caf50"; // Valid
  };

  return (
    <FractionContainer>
      <FractionDisplay>
        <div>
          <Label htmlFor="numerator">Numerator</Label>
          <FractionInputStyled
            ref={numeratorRef}
            id="numerator"
            type="number"
            value={numerator}
            onChange={(e) => handleChange(e.target.value, denominator)}
            onKeyDown={(e) => handleKeyDown(e, "numerator")}
            disabled={disabled}
            placeholder="0"
            $borderColor={getBorderColor()}
            autoFocus={!disabled}
            aria-label="Numerator"
          />
        </div>

        <FractionBar />

        <div>
          <Label htmlFor="denominator">Denominator</Label>
          <FractionInputStyled
            ref={denominatorRef}
            id="denominator"
            type="number"
            value={denominator}
            onChange={(e) => handleChange(numerator, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "denominator")}
            disabled={disabled}
            placeholder="1"
            $borderColor={getBorderColor()}
            aria-label="Denominator"
          />
        </div>
      </FractionDisplay>

      {denominator === "0" && (
        <HintText style={{ color: "#f44336" }}>
          Denominator cannot be zero
        </HintText>
      )}
    </FractionContainer>
  );
}

export default FractionInputComponent;
