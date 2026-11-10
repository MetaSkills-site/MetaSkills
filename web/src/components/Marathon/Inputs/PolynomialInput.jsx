import DOMPurify from "dompurify";
import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { BaseMarathonInput, InputContainer } from "../MarathonStyles";

const InputGrid = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
`;

const Term = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const PolyInput = styled(BaseMarathonInput)`
  width: 70px;
`;

const Label = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const HintText = styled.div`
  font-size: 12px;
  color: #888;
  text-align: center;
  font-style: italic;
`;

function PolynomialInput({
  value,
  onChange,
  disabled,
  labels = [],
  hint = "",
  groupBy = 0,
  prefix = null,
  separator = "+",
  onKeyDown,
}) {
  const [coeffs, setCoeffs] = useState(Array(labels.length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!value) {
      setCoeffs(Array(labels.length).fill(""));
      return;
    }

    let parts = [];
    if (value.includes(":")) {
      // Handle grouped format: "a:b,c:d" -> ["a", "b", "c", "d"]
      const groups = value.split(","); // ["a:b", "c:d"]
      parts = groups.flatMap((g) => g.split(":"));
    } else if (value.includes(",")) {
      parts = value.split(",");
    } else {
      parts = [value];
    }

    // Ensure correct length matching labels
    if (parts.length > labels.length) {
      console.warn(
        `[PolynomialInput] Value has more parts (${parts.length}) than labels (${labels.length}). Extras will be discarded. Value: ${value}`,
      );
    }
    setCoeffs(
      parts.concat(Array(Math.max(0, labels.length - parts.length)).fill("")),
    );
  }, [value, labels.length]);

  const handleChange = (index, val) => {
    const newCoeffs = [...coeffs];
    newCoeffs[index] = val;
    setCoeffs(newCoeffs);

    // Format output based on groupBy
    if (groupBy > 0) {
      // Group logic: chunk array into groups of size `groupBy`
      // e.g. [a,b,c,d,e,f] -> ["a:b", "c:d", "e:f"]
      const groups = [];
      for (let i = 0; i < newCoeffs.length; i += groupBy) {
        const chunk = newCoeffs.slice(i, i + groupBy);
        // Join chunk with ':'
        // Note: If chunk is incomplete (shouldn't happen if labels align), it handles it.
        groups.push(chunk.join(":"));
      }
      onChange(groups.join(","));
    } else {
      onChange(newCoeffs.join(","));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      if (index < labels.length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      } else if (onKeyDown) {
        // Last field: trigger the parent's submission handler
        onKeyDown(e);
      }
    }
  };

  const getBorderColor = () => {
    const filled = coeffs.filter((c) => c !== "").length;
    if (filled === 0) return "#e0e0e0";
    if (filled === labels.length) return "#4caf50";
    return "#FF9800";
  };

  return (
    <InputContainer>
      <InputGrid>
        {prefix && (
          <Label
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prefix) }}
          />
        )}
        {labels.map((label, idx) => (
          <Term key={idx}>
            <PolyInput
              ref={(el) => (inputRefs.current[idx] = el)}
              type="number"
              step="any"
              value={coeffs[idx]}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              disabled={disabled}
              placeholder="0"
              $borderColor={getBorderColor()}
              autoFocus={idx === 0 && !disabled}
              aria-label={`Coefficient for ${label}`}
            />
            <Label
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(label) }}
            />
            {idx < labels.length - 1 &&
              (separator === null ? null : <Label>{separator}</Label>)}
          </Term>
        ))}
      </InputGrid>
      {hint && <HintText>{hint}</HintText>}
    </InputContainer>
  );
}

export default PolynomialInput;
