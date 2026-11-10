/**
 * @file Badge.jsx
 * @description A versatile, customizable badge component that supports interactive states,
 * keyboard accessibility, and dynamic styling via props.
 * @dependencies react, styled-components
 * @exports Badge
 * @interconnections Used across the application to display labels, tags, or status indicators.
 */

import { forwardRef } from "react";
import styled, { css } from "styled-components";

// Styled component for the badge with dynamic styling based on props
const StyledBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$bg || "#f5f5f5"};
  color: ${(props) => props.$color || "#666"};
  padding: ${(props) => props.$padding || "4px 10px"};
  border-radius: ${(props) => props.$radius || "12px"};
  font-size: ${(props) => props.$fontSize || "0.8rem"};
  font-weight: ${(props) => props.$fontWeight || "bold"};
  border: ${(props) => props.$border || "1px solid transparent"};
  transition: all 0.2s;
  ${(props) => props.$capitalize && "text-transform: capitalize;"}
  ${(props) => props.$fontFamily && `font-family: ${props.$fontFamily};`}

  /* Interactive styles for hover and cursor */
  ${(props) =>
    props.$interactive &&
    css`
      cursor: pointer;
      &:hover {
        background: ${(props) => props.$hoverBg || "#ff5722"};
        color: ${(props) => props.$hoverColor || "white"};
        transform: ${(props) => props.$hoverLift || "none"};
      }
    `}
`;

const Badge = forwardRef(
  (
    {
      children,
      className,
      style,
      onClick,
      bg,
      color,
      padding,
      radius,
      fontSize,
      fontWeight,
      border,
      capitalize,
      fontFamily,
      interactive,
      hoverBg,
      hoverColor,
      hoverLift,
      ...rest
    },
    ref,
  ) => {
    // Determine if the badge should behave as an interactive element
    const isInteractive = interactive !== undefined ? interactive : !!onClick;

    // Accessibility: Handle keyboard events for interactive badges
    const handleKeyDown =
      isInteractive && onClick
        ? (e) => {
            if (e.key === "Enter") {
              onClick(e);
            } else if (e.key === " ") {
              e.preventDefault(); // Prevent page scroll on spacebar
              onClick(e);
            }
          }
        : undefined;

    return (
      <StyledBadge
        ref={ref}
        className={className}
        style={style}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        $bg={bg}
        $color={color}
        $padding={padding}
        $radius={radius}
        $fontSize={fontSize}
        $fontWeight={fontWeight}
        $border={border}
        $capitalize={capitalize}
        $fontFamily={fontFamily}
        $interactive={isInteractive}
        $hoverBg={hoverBg}
        $hoverColor={hoverColor}
        $hoverLift={hoverLift}
        {...rest}
      >
        {children}
      </StyledBadge>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
