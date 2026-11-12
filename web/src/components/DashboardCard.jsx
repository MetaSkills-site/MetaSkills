/**
 * @file DashboardCard.jsx
 * @description Renders navigational dashboard cards in vertical grid or horizontal list layouts with icon and text.
 * @architecture UI presentation card integrated into dashboard landing pages and subject overview grids.
 * @agent_note Supports vertical and horizontal layout variants with elevation and hover animations; wrapped in React.memo.
 */

/**
 * FILE PURPOSE: DashboardCard — The primary navigational building block of the user dashboard.
 *
 * ROLE:
 * Encapsulates a link or action button as a stylized card with an icon, title,
 * and description. It supports two primary visual variants: 'vertical' (large grid items)
 * and 'horizontal' (compact list items).
 *
 * DEPENDENCIES:
 * - styled-components: For themed hover animations, shadows, and layout transitions.
 * - react-router-dom: Link component for SPA navigation.
 * - common/SurfaceCard: Reuses SurfaceCardStyle to maintain elevation consistency.
 *
 * EXPORTS:
 * - DashboardCard (default): A memoized component for performance-efficient dashboard grids.
 *
 * INTERCONNECTIONS:
 * - Used in Dashboard.jsx for main navigation and Marathon/English sub-grids.
 */
import { memo } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { SurfaceCardStyle } from "./common/SurfaceCard";

/* ─── Styled Components ─── */

/**
 * VerticalCard (Grid Variant)
 * Used for main category selectors. Emphasizes the icon and uses a centered layout.
 */
const VerticalCard = styled(Link)`
  ${SurfaceCardStyle}
  display: flex;
  width: 300px;
  height: 300px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  text-decoration: none;

  svg {
    font-size: 64px;
    color: #ff5722;
    transition: all 0.3s ease;
  }

  h3 {
    font-size: 24px;
    text-align: center;
    font-weight: 700;
    color: #333;
    margin: 0;
  }

  p {
    text-align: center;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    margin: 0;
  }
`;

/**
 * HorizontalCard (List Variant)
 * Used for module lists or secondary actions where vertical space is constrained.
 */
const HorizontalCard = styled(Link)`
  ${SurfaceCardStyle}
  display: flex;
  width: 100%;
  max-width: 800px;
  min-height: 120px;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 30px;
  text-decoration: none;

  svg {
    font-size: 40px;
    min-width: 50px;
    color: #ff5722;
    transition: all 0.3s ease;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  h3 {
    font-size: 22px;
    text-align: left;
    font-weight: 700;
    color: #333;
    margin: 0;
  }

  p {
    text-align: left;
    font-size: 15px;
    line-height: 1.4;
    color: #666;
    margin: 0;
  }
`;

/* ─── Main Component ─── */

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {"vertical"|"horizontal"} [props.variant="vertical"] - Layout presentation variant.
 * @param {React.ReactNode} props.icon - Icon element rendered inside card.
 * @param {string} props.title - Title text of the card.
 * @param {string} props.description - Explanatory text beneath title.
 * @param {string} [props.to="#"] - Navigation route path for react-router Link.
 * @param {Function} [props.onClick] - Optional click event handler.
 * @param {string} [props.className] - CSS class name override.
 * @param {Object} [props.style] - Inline styling override.
 * @returns {JSX.Element} The rendered navigational dashboard card.
 */
const DashboardCard = ({
  variant = "vertical",
  icon,
  title,
  description,
  to = "#",
  onClick,
  className,
  style,
}) => {
  // BRANCHING RENDER LOGIC: Returns the appropriate layout based on 'variant' prop.
  if (variant === "horizontal") {
    return (
      <HorizontalCard
        to={to}
        onClick={onClick}
        className={className}
        style={style}
        $padding="30px"
        $border="1px solid transparent"
        $hoverLift="-5px"
        $hoverShadow="0 10px 30px rgba(0, 0, 0, 0.05)"
        $hoverBorder="rgba(0, 0, 0, 0.05)"
        $interactive={true}
      >
        {icon}
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </HorizontalCard>
    );
  }

  return (
    <VerticalCard
      to={to}
      onClick={onClick}
      className={className}
      style={style}
      $padding="40px"
      $hoverLift="-10px"
      $hoverShadow="0 20px 40px rgba(255, 87, 34, 0.15)"
      $hoverBorder="rgba(255, 87, 34, 0.3)"
      $interactive={true}
    >
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
    </VerticalCard>
  );
};

// Memoize to prevent re-renders when static lists are scrolled or filtered.
export default memo(DashboardCard);
