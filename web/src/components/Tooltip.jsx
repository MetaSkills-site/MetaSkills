/**
 * @file Tooltip.jsx
 * @description A high-quality tooltip component built on top of Radix UI's Tooltip primitive.
 * It features smooth animations for different entry sides and is accessible by default.
 *
 * @dependencies
 * - @radix-ui/react-tooltip: For the core tooltip logic and accessibility.
 * - styled-components: For custom animations and panel styling.
 *
 * @exports Tooltip (default)
 * @interconnections Used throughout the app to provide hover hints on buttons and interactive elements.
 */

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import styled, { keyframes } from "styled-components";

// Animation keyframes for different entry directions
const slideUpAndFade = keyframes`
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideDownAndFade = keyframes`
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideLeftAndFade = keyframes`
  from { opacity: 0; transform: translateX(2px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideRightAndFade = keyframes`
  from { opacity: 0; transform: translateX(-2px); }
  to { opacity: 1; transform: translateX(0); }
`;

const StyledContent = styled(TooltipPrimitive.Content)`
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.5;
  color: #555555;
  background-color: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  user-select: none;
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  z-index: 1000;
  font-family: "Inter", "Roboto", "Quicksand", sans-serif;
  max-width: ${(props) => props.$width || "260px"};

  /* Apply appropriate animation based on which side the tooltip appears */
  &[data-state$="open"] {
    &[data-side="top"] {
      animation-name: ${slideDownAndFade};
    }
    &[data-side="right"] {
      animation-name: ${slideLeftAndFade};
    }
    &[data-side="bottom"] {
      animation-name: ${slideUpAndFade};
    }
    &[data-side="left"] {
      animation-name: ${slideRightAndFade};
    }
  }
`;

const StyledArrow = styled(TooltipPrimitive.Arrow)`
  fill: #e2e8f0;
`;

const Tooltip = React.forwardRef(
  (
    {
      children,
      text,
      delayDuration = 0,
      side = "top",
      align = "center",
      width,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <TooltipPrimitive.Provider>
        <TooltipPrimitive.Root delayDuration={delayDuration}>
          <TooltipPrimitive.Trigger asChild {...props}>
            <span
              ref={ref}
              style={{
                display: "inline-flex",
                width: "fit-content",
                alignSelf: "flex-start",
                ...style,
              }}
            >
              {children}
            </span>
          </TooltipPrimitive.Trigger>
          {text && (
            <TooltipPrimitive.Portal>
              <StyledContent
                side={side}
                align={align}
                sideOffset={5}
                $width={width}
              >
                {text}
                <StyledArrow width={14} height={7} />
              </StyledContent>
            </TooltipPrimitive.Portal>
          )}
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    );
  },
);

Tooltip.displayName = "Tooltip";

export default Tooltip;
