/**
 * SurfaceCard.jsx
 *
 * PURPOSE:
 * A reusable UI component that provides a styled container with optional interactive effects
 * like hover lifting, shadow deepening, and border coloring. It serves as a base for
 * various card-like elements throughout the application.
 *
 * DEPENDENCIES:
 * - react: For component structure and refs.
 * - styled-components: For CSS-in-JS styling.
 *
 * EXPORTS:
 * - SurfaceCard (default): The functional component wrapped in forwardRef.
 * - SurfaceCardStyle: The underlying CSS mixin for reuse in other styled components.
 *
 * INTERCONNECTIONS:
 * Used across the dashboard, modules, and admin sections to provide consistent elevated surfaces.
 */

import { forwardRef } from "react";
import styled, { css } from "styled-components";

/**
 * SurfaceCardStyle
 * A reusable CSS mixin that defines the core visual properties of a surface card.
 * Uses transient props (prefixed with $) to avoid passing non-standard HTML attributes to the DOM.
 */
export const SurfaceCardStyle = css`
  background: ${(props) => props.$bg || "white"};
  border-radius: ${(props) => props.$radius || "20px"};
  padding: ${(props) => props.$padding || "25px"};
  box-shadow: ${(props) => props.$shadow || "0 10px 30px rgba(0, 0, 0, 0.05)"};
  border: ${(props) => props.$border || "2px solid transparent"};
  transition: all 0.3s ease;
  text-decoration: none !important;
  cursor: ${(props) => (props.$interactive ? "pointer" : "default")};

  /* Interactive hover effects enabled via $interactive prop */
  ${(props) =>
    props.$interactive &&
    css`
      &:hover {
        transform: translateY(${(props) => props.$hoverLift || "-5px"});
        box-shadow: ${(props) =>
          props.$hoverShadow || "0 15px 30px rgba(0, 0, 0, 0.1)"};
        border-color: ${(props) =>
          props.$hoverBorder || "rgba(255, 87, 34, 0.2)"};

        /* Slight scaling effect for any nested SVG icons on hover */
        svg {
          transform: scale(1.1);
        }
      }
    `}
`;

/**
 * StyledSurfaceCard
 * The styled div component that applies the SurfaceCardStyle mixin.
 */
const StyledSurfaceCard = styled.div`
  ${SurfaceCardStyle}
`;

/**
 * SurfaceCard Component
 *
 * A flexible container component that uses React.forwardRef to allow parent components
 * to access the underlying DOM element. It maps standard props to transient styled-component props.
 */
const SurfaceCard = forwardRef(
  (
    {
      children,
      className,
      style,
      onClick,
      bg,
      radius,
      padding,
      shadow,
      border,
      interactive,
      hoverLift,
      hoverShadow,
      hoverBorder,
      as,
      ...rest
    },
    ref,
  ) => {
    return (
      <StyledSurfaceCard
        ref={ref}
        as={as}
        className={className}
        style={style}
        onClick={onClick}
        /* Map props to transient styled-components props (prefixed with $) */
        $bg={bg}
        $radius={radius}
        $padding={padding}
        $shadow={shadow}
        $border={border}
        /* Automatically enable interactivity if onClick is present, unless explicitly overridden */
        $interactive={interactive !== undefined ? interactive : !!onClick}
        $hoverLift={hoverLift}
        $hoverShadow={hoverShadow}
        $hoverBorder={hoverBorder}
        {...rest}
      >
        {children}
      </StyledSurfaceCard>
    );
  },
);

SurfaceCard.displayName = "SurfaceCard";

export default SurfaceCard;
