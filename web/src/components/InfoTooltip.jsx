/**
 * @file InfoTooltip.jsx
 * @description A versatile tooltip component designed to provide contextual help information.
 * It supports hover delays, pinning via click (useful for mobile), and renders custom or default help icons.
 *
 * @dependencies
 * - react: For useState, useRef, and useEffect hooks.
 * - styled-components: For complex tooltip positioning and animations.
 * - react-icons/fa: For the default FaQuestionCircle help icon.
 *
 * @exports InfoTooltip (default), Kbd (named)
 * @interconnections Used throughout the application to explain technical terms, shortcuts, or UI features.
 */

import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FaQuestionCircle } from "react-icons/fa";

const TooltipContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  ${(props) => !props.$hasChildren && "margin-left: 8px;"}
`;

const IconWrapper = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #aaa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #007bff;
  }

  &:focus-visible {
    color: #007bff;
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
`;

const TooltipPanel = styled.div`
  position: absolute;
  bottom: ${(props) => props.$bottom || "125%"};
  left: 50%;
  transform: translateX(-50%);
  width: ${(props) => props.$width || "260px"};
  background-color: #ffffff;
  color: #555555;
  text-align: left;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  font-weight: normal;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  pointer-events: none;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transition:
    opacity 0.2s,
    transform 0.2s;
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  font-family: "Inter", "Roboto", "Quicksand", sans-serif;

  &::before {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -7px;
    border-width: 7px;
    border-style: solid;
    border-color: #e2e8f0 transparent transparent transparent;
  }

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -6px;
    border-width: 6px;
    border-style: solid;
    border-color: #ffffff transparent transparent transparent;
  }
`;

/**
 * Kbd Component
 * A styled component for displaying keyboard shortcuts inside tooltips.
 */
export const Kbd = styled.kbd`
  background-color: #f7fafc;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
  color: #4a5568;
  display: inline-block;
  font-family: inherit;
  font-size: 0.85em;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  white-space: nowrap;
`;

export default function InfoTooltip({
  text,
  delay = 0,
  bottom,
  width,
  style,
  className,
  children,
  disablePin = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  /**
   * Handles the mouse entering the tooltip trigger area.
   * If a delay is provided, it sets a timeout before opening the tooltip.
   */
  const handleEnter = () => {
    if (delay) {
      timerRef.current = setTimeout(() => setIsOpen(true), delay);
    } else {
      setIsOpen(true);
    }
  };

  /**
   * Handles the mouse leaving the trigger area.
   * Clears any pending open timeout and closes the tooltip unless it's pinned.
   */
  const handleLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isPinned) setIsOpen(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Effect to close the tooltip/unpin it when clicking outside the container
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsPinned(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  if (!text) return null;

  return (
    <TooltipContainer
      ref={containerRef}
      style={style}
      className={className}
      $hasChildren={!!children}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onClick={() => {
        // Toggle pinning on click, making it useful for touch devices
        if (disablePin) return;
        setIsPinned((prev) => {
          const next = !prev;
          setIsOpen(next);
          return next;
        });
      }}
    >
      {/* If children are provided, they act as the trigger; otherwise, a default question icon is used */}
      {children ? (
        children
      ) : (
        <IconWrapper aria-label="More info">
          <FaQuestionCircle size={15} />
        </IconWrapper>
      )}
      <TooltipPanel $isOpen={isOpen} $bottom={bottom} $width={width}>
        {text}
      </TooltipPanel>
    </TooltipContainer>
  );
}
