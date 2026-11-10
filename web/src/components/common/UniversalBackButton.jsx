/**
 * @file UniversalBackButton.jsx
 * @description A multi-variant back button component that supports keyboard shortcuts (Alt + Backspace)
 * and various visual styles (link, icon-circle, hero, floating).
 * @dependencies styled-components, react-icons/io, ../Tooltip, ../../hooks/event-hooks/useBackShortcut
 * @exports UniversalBackButton
 * @interconnections Used throughout the app to provide a consistent navigation-back experience.
 */

import styled from "styled-components";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import Tooltip from "../Tooltip";
import useBackShortcut from "../../hooks/event-hooks/useBackShortcut";

// Base styles shared across all button variants
const BaseButton = styled.button`
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  font-family: var(--font-primary);
  background: transparent;
  padding: 0;
  color: inherit;
`;

// Variant that looks like a text link with an icon
const LinkVariant = styled(BaseButton)`
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  padding: 6px 10px;
  margin-bottom: 20px;
  color: #ff5722;
  border-radius: 10px;

  &:hover {
    background: #b0533638;
  }

  & > svg {
    width: 14px;
    height: 14px;
    fill: #ff5722d6;
    display: block;
    margin: auto;
  }

  & > span {
    font-size: 14px;
    font-weight: 800;
    margin-left: 6px;
  }
`;

// Variant that displays as a circular icon button
const IconCircleVariant = styled(BaseButton)`
  width: 32px;
  height: 32px;
  padding: 4px;
  border-radius: 50%;
  background: rgba(255, 87, 34, 0.1);
  border: 1px solid rgba(255, 87, 34, 0.2);
  color: #ff5722;

  &:hover {
    background: rgba(255, 87, 34, 0.2);
    transform: scale(1.05);
  }

  & > svg {
    width: 100%;
    height: 100%;
  }
`;

// High-visibility variant typically used in headers or hero sections
const HeroVariant = styled(BaseButton)`
  padding: 6px 10px;
  border-radius: 10px;
  color: ${(props) => props.$color || "#e74307b0"};
  gap: 5px;
  font-weight: 600;

  &:hover {
    color: ${(props) => props.$hoverColor || "#e74307ff"};
    background: ${(props) => props.$hoverBg || "#db5b281f"};
  }

  & > svg {
    width: 20px;
    height: 20px;
  }
`;

// Variant that floats above other content, often used in mobile or detailed views
const FloatingVariant = styled(BaseButton)`
  background: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  color: #555;
  font-size: 1.5rem;
  z-index: 10;

  &:hover {
    transform: translateX(-5px);
    color: #ff5722;
    box-shadow: 0 8px 20px rgba(255, 87, 34, 0.2);
  }

  & > svg {
    width: 24px;
    height: 24px;
  }
`;

// Positioning wrapper for absolute variants (hero, floating) to ensure correct tooltip alignment
const PositioningWrapper = styled.div`
  position: absolute;
  z-index: 10;
  ${(props) =>
    props.$variant === "hero" &&
    `
    top: 20px;
    left: 20px;
  `}
  ${(props) =>
    props.$variant === "floating" &&
    `
    top: 30px;
    left: 30px;
  `}
`;

/**
 * Main UniversalBackButton component that orchestrates shortcuts and visual rendering.
 */
export default function UniversalBackButton({
  variant = "link",
  onClick,
  text = "Back",
  enableShortcut = true,
  children,
  theme = {}, // Custom theme overrides for the hero variant
  path, // Optional specific path to navigate to
  title,
  ...props
}) {
  const navigate = useNavigate();

  // If shortcuts are enabled, we hide the native title to prevent double-tooltips,
  // since the custom Tooltip component will handle the hint.
  const finalTitle = enableShortcut ? undefined : title;
  const mergedProps = { ...props, title: finalTitle };

  // Wrapper for click handler to ensure it's a valid function call
  const handleClick = (e) => {
    if (typeof onClick === "function") {
      onClick(e);
    } else if (path) {
      navigate(path);
    } else {
      navigate(-1);
    }
  };

  // Registers the global backspace keyboard shortcut
  useBackShortcut(handleClick, enableShortcut);

  // Defaults to back arrow icon if no children are provided
  const iconContent = children || <IoMdArrowRoundBack />;

  // Helper to render the specific styled component based on the variant prop
  const renderContent = () => {
    switch (variant) {
      case "icon-circle":
        return (
          <IconCircleVariant onClick={handleClick} {...mergedProps}>
            {iconContent}
          </IconCircleVariant>
        );
      case "hero":
        return (
          <HeroVariant
            onClick={handleClick}
            $color={theme.secondary}
            $hoverColor={theme.secondary}
            $hoverBg={theme.hoverBg}
            {...mergedProps}
          >
            {iconContent} {text}
          </HeroVariant>
        );
      case "floating":
        return (
          <FloatingVariant onClick={handleClick} {...mergedProps}>
            {iconContent}
          </FloatingVariant>
        );
      case "link":
      default:
        return (
          <LinkVariant
            onClick={handleClick}
            role="button"
            tabIndex={0}
            {...mergedProps}
          >
            {iconContent}
            <span>{text}</span>
          </LinkVariant>
        );
    }
  };

  const buttonContent = renderContent();

  // Wrap with Tooltip if shortcuts are enabled to show keyboard shortcut hint
  const contentWithTooltip = enableShortcut ? (
    <Tooltip
      delayDuration={400}
      side="top"
      width="max-content"
      text={<>{text} Alt + Backspace</>}
    >
      {buttonContent}
    </Tooltip>
  ) : (
    buttonContent
  );

  // Apply absolute positioning wrapper for hero and floating variants
  if (variant === "hero" || variant === "floating") {
    return (
      <PositioningWrapper $variant={variant}>
        {contentWithTooltip}
      </PositioningWrapper>
    );
  }

  return contentWithTooltip;
}
