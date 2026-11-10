/**
 * @file OptionCard.jsx
 * @description Atomic UI component for displaying interactive question options.
 * Supports various content formats including strings, HTML, and Slate JSON.
 * @dependencies react, styled-components, dompurify, ../SlateRenderer
 * @exports OptionCard
 * @interconnections Consumed by OptionsGrid.jsx to display a list of choices.
 */

import React from "react";
import styled from "styled-components";
import SlateRenderer from "../SlateRenderer";
import DOMPurify from "dompurify";
import { getFeedbackStyle, FEEDBACK_COLORS } from "../../utils/feedbackStyles";

// Styled container for the option card with dynamic borders and background colors
const Card = styled.div`
  background: #fff;
  border: 2px solid
    ${(props) => {
      const style = getFeedbackStyle({
        isSelected: props.$selected,
        isCorrect:
          props.$status === "correct"
            ? true
            : props.$status === "incorrect"
              ? false
              : undefined,
        isSubmitted: props.$isSubmitted,
      });
      return style.borderColor;
    }};
  border-radius: 16px;
  padding: 20px;
  cursor: ${(props) => (props.$readOnly ? "default" : "pointer")};
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  background-color: ${(props) => {
    const style = getFeedbackStyle({
      isSelected: props.$selected,
      isCorrect:
        props.$status === "correct"
          ? true
          : props.$status === "incorrect"
            ? false
            : undefined,
      isSubmitted: props.$isSubmitted,
    });
    return style.backgroundColor;
  }};
  box-shadow: ${(props) =>
    props.$selected
      ? "0 8px 20px rgba(0,0,0,0.1)"
      : "0 4px 10px rgba(0,0,0,0.03)"};
  opacity: 1;
  pointer-events: ${(props) => (props.$readOnly ? "none" : "auto")};
  min-height: 80px;

  &:hover {
    border-color: ${(props) => {
      if (props.$readOnly) {
        // Maintain status-specific border colors even in read-only mode on hover
        if (props.$status === "correct") return FEEDBACK_COLORS.CORRECT.border;
        if (props.$isSubmitted && props.$status === "incorrect")
          return FEEDBACK_COLORS.INCORRECT.border;
        if (props.$selected) return FEEDBACK_COLORS.SELECTED.border;
        return FEEDBACK_COLORS.DEFAULT.border;
      }
      return FEEDBACK_COLORS.SELECTED.border;
    }};
    transform: ${(props) => (props.$readOnly ? "none" : "translateY(-3px)")};
    box-shadow: ${(props) =>
      props.$readOnly ? "none" : "0 8px 20px rgba(0,0,0,0.08)"};
  }
`;

// Styled label (e.g., A, B, C) with status-dependent coloring
const Label = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${(props) => {
    const style = getFeedbackStyle({
      isSelected: props.$selected,
      isCorrect:
        props.$status === "correct"
          ? true
          : props.$status === "incorrect"
            ? false
            : undefined,
      isSubmitted: props.$isSubmitted,
    });
    return style.labelBg;
  }};
  color: ${(props) => {
    const style = getFeedbackStyle({
      isSelected: props.$selected,
      isCorrect:
        props.$status === "correct"
          ? true
          : props.$status === "incorrect"
            ? false
            : undefined,
      isSubmitted: props.$isSubmitted,
    });
    return style.labelColor;
  }};
  font-weight: bold;
  margin-right: 16px;
  font-size: 18px;
  transition: all 0.2s;
  flex-shrink: 0;
`;

// Wrapper for the content of the option
const ContentWrapper = styled.div`
  width: 100%;
  font-size: 1.1rem;
  color: #333;
  word-break: break-word; /* Prevents overflow of long words */
`;

const OptionCard = ({
  label,
  content,
  selected,
  status = "neutral", // Possible values: 'correct', 'incorrect', 'neutral'
  isSubmitted = false,
  onClick,
  readOnly,
}) => {
  // Handles click events if the component is not in read-only mode
  const handleClick = (e) => {
    if (!readOnly && onClick) {
      onClick(e);
    }
  };

  return (
    <Card
      $selected={selected}
      $status={status}
      $isSubmitted={isSubmitted}
      $readOnly={readOnly}
      onClick={handleClick}
      data-testid={`option-${label}`}
    >
      {label && (
        <Label $selected={selected} $status={status} $isSubmitted={isSubmitted}>
          {label}
        </Label>
      )}
      <ContentWrapper>
        {/* Render logic: prioritizes HTML strings, then React elements, then Slate JSON */}
        {typeof content === "string" ? (
          // Regex-like check for HTML tags to decide between dangerouslySetInnerHTML and plain text
          content.includes("<") && content.includes(">") ? (
            <div
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          ) : (
            content
          )
        ) : React.isValidElement(content) ? (
          content
        ) : (
          // Default to SlateRenderer for JSON content objects
          <SlateRenderer slate={content} />
        )}
      </ContentWrapper>
    </Card>
  );
};

export default OptionCard;
