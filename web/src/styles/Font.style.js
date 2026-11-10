/**
 * @file Font.style.js
 * @description A dynamic styled component for flexible text formatting, including custom fonts, sizes, and gradients.
 * @dependencies styled-components
 * @exports Font
 * @interconnections Used throughout the app wherever custom typography needs to be applied inline.
 */

import styled from "styled-components";

/**
 * Highly customizable span component.
 * Supports dynamic props for font name ($name), weight ($weight), size ($size), color ($color), and background gradients ($gradient).
 */
export const Font = styled.span`
  /* Fallback to Quicksand if no font name is provided via the $name prop */
  font-family: ${(_) => _.$name || "'quicksand', segoe ui, sans serif"};
  font-weight: ${(_) => _.$weight || ""};
  font-size: ${(_) => _.$size || ""};
  color: ${(_) => _.$color || ""};

  /* Logic to apply text-fill gradients if the $gradient prop is present */
  ${(_) =>
    _.$gradient
      ? `
    color: #9c27b0;
    /* 
     * Uses provided gradient string (if it's a string) or a default pink-orange gradient.
     * Logic: If $gradient is true but not a string, use default.
     */
    background: ${typeof _.$gradient === "string" ? _.$gradient : "linear-gradient(90deg, #E91E63, #FF9800)"};
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    `
      : ""}
`;
