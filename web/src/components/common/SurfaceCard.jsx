/**
 * @file SurfaceCard.jsx
 * @description Reusable elevated surface container component with configurable hover physics, borders, and shadows.
 * @architecture Foundational layout primitive in the common components layer, providing CSS mixin SurfaceCardStyle.
 * @agent_note Maps standard props to transient styled-components props ($interactive, $hoverLift) to prevent DOM warnings.
 */

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
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} [props.children] - Card child content.
 * @param {string} [props.className] - CSS class name.
 * @param {Object} [props.style] - Inline CSS styles.
 * @param {Function} [props.onClick] - Optional click handler.
 * @param {string} [props.bg] - Background color override.
 * @param {string} [props.radius] - Border radius override.
 * @param {string} [props.padding] - Padding override.
 * @param {string} [props.shadow] - Box shadow override.
 * @param {string} [props.border] - Border styling override.
 * @param {boolean} [props.interactive] - Whether hover elevation effects are active.
 * @param {string} [props.hoverLift] - Vertical hover lift distance.
 * @param {string} [props.hoverShadow] - Hover box shadow styling.
 * @param {string} [props.hoverBorder] - Hover border color.
 * @param {React.ElementType} [props.as] - Render element tag override.
 * @returns {JSX.Element} Rendered surface card wrapper.
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
