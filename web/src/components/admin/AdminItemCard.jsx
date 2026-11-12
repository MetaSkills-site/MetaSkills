/**
 * @file AdminItemCard.jsx
 * @description Unified, flexible card component standardizing item presentation across admin views with slot-based layouts.
 * @architecture Reusable presentation component in the admin UI layer, encapsulating card elevation, layout direction, and action slots.
 * @agent_note Check flex direction and action alignment props when using within lists or grids to avoid overflow.
 */

/**
 * AdminItemCard.jsx
 *
 * PURPOSE:
 * A unified, flexible card component designed for use throughout the admin dashboard.
 * It standardizes the display of list items (like modules, questions, or users) by
 * providing dedicated slots for icons, titles, subtitles, metadata, and actions.
 *
 * DEPENDENCIES:
 * - styled-components: For component-specific styling and layout.
 * - Flex.style: Shared flexbox utility styles.
 *
 * EXPORTS:
 * - AdminItemCard (default): The functional component for the card.
 *
 * INTERCONNECTIONS:
 * - Used in ViewAllQuestions, ModuleList, and other admin management pages to maintain
 *   visual consistency across different content types.
 */

import { forwardRef } from "react";
import styled from "styled-components";
import { Flex } from "../../styles/Flex.style";

/**
 * Card
 * The main container with hover elevations and optional clickability.
 */
const Card = styled.div`
  background: white;
  padding: ${(props) => props.$padding || "20px"};
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

  &:hover {
    transform: ${(props) =>
      props.$clickable ? "translateY(-4px)" : "translateY(-2px)"};
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    border-color: ${(props) =>
      props.$clickable ? "rgba(255, 87, 34, 0.2)" : "transparent"};
  }
`;

/**
 * IconContainer
 * Left-aligned slot for an icon or avatar.
 */
const IconContainer = styled.div`
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * ContentContainer
 * Central slot for primary textual information.
 */
const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0; /* Prevents flex children (like long titles) from overflowing */
`;

const Title = styled.div`
  font-weight: 700;
  font-size: ${(props) => props.$size || "1.1rem"};
  color: #333;
  line-height: 1.4;
`;

const Subtitle = styled.div`
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;

  p {
    margin: 0;
  }
`;

/**
 * MetaContainer
 * Bottom slot for tags, badges, or secondary metadata.
 */
const MetaContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 4px;
`;

/**
 * ActionsContainer
 * Right-aligned slot for interactive buttons or menus.
 */
const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 15px;
`;

/**
 * Unified Admin Item Card Component
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Icon or avatar to display on the left
 * @param {React.ReactNode} [props.title] - Main title of the card
 * @param {React.ReactNode} [props.subtitle] - Subtitle or description text
 * @param {React.ReactNode} [props.meta] - Metadata tags, dates, or badges
 * @param {React.ReactNode} [props.actions] - Action buttons to display on the right
 * @param {Function} [props.onClick] - Click handler for the card itself
 * @param {string} [props.className] - Optional class name for custom styling
 * @param {string} [props.padding] - Custom padding for the card (e.g. "30px")
 * @param {string} [props.titleSize] - Custom font size for the title (e.g. "20px")
 * @param {string} [props.direction] - Layout direction ("row" or "column")
 * @param {string} [props.alignActions] - Alignment for actions in column mode
 * @param {boolean} [props.fullWidth] - Whether the card should take 100% width
 * @returns {JSX.Element} Card component container.
 */
const AdminItemCard = forwardRef(
  (
    {
      icon,
      title,
      subtitle,
      meta,
      actions,
      onClick,
      className,
      padding,
      titleSize,
      direction = "row",
      alignActions = "center",
      fullWidth = false,
      ...props
    },
    ref,
  ) => {
    return (
      <Card
        onClick={onClick}
        $clickable={!!onClick}
        className={className}
        $padding={padding}
        style={fullWidth ? { width: "100%" } : {}}
        ref={ref}
        {...props}
      >
        <Flex
          $column={direction === "column"}
          style={{
            alignItems: direction === "column" ? alignActions : "center",
            width: "100%",
            gap: direction === "column" ? "15px" : "0",
          }}
        >
          {/* Left slot: Icon */}
          {icon && <IconContainer>{icon}</IconContainer>}

          {/* Center slot: Content */}
          <ContentContainer
            style={{ textAlign: direction === "column" ? "center" : "left" }}
          >
            {title && <Title $size={titleSize}>{title}</Title>}
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
            {meta && (
              <MetaContainer
                style={{
                  justifyContent:
                    direction === "column" ? "center" : "flex-start",
                }}
              >
                {meta}
              </MetaContainer>
            )}
          </ContentContainer>

          {/* Right slot: Actions */}
          {actions && (
            <ActionsContainer
              style={{
                marginLeft: direction === "column" ? "0" : "15px",
                marginTop: direction === "column" ? "10px" : "0",
                width: direction === "column" ? "100%" : "auto",
                justifyContent: direction === "column" ? "center" : "flex-end",
              }}
            >
              {actions}
            </ActionsContainer>
          )}
        </Flex>
      </Card>
    );
  },
);
AdminItemCard.displayName = "AdminItemCard";

export default AdminItemCard;
