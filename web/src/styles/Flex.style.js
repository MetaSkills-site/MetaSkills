/**
 * @file Flex.style.js
 * @description Utility styled components for Flexbox and Grid layouts, providing a reusable foundation for responsive design.
 * @dependencies styled-components
 * @exports Flex, ResponsiveGrid
 * @interconnections Extensively used by almost every UI component (e.g., Editor.style.js, Dashboard.style.js) to manage spatial distribution.
 */

import styled from "styled-components";

/**
 * Generic Flexbox container.
 * Supports dynamic direction and gap via props.
 */
export const Flex = styled.div`
  display: flex;
  /* Direction logic: defaults to row unless $column prop is truthy */
  flex-direction: ${(_) => (_.$column ? "column" : "row")};
  /* Gap logic: defaults to 0 if no $gap prop is provided */
  gap: ${(_) => _.$gap || "0"};
`;

/**
 * A responsive CSS Grid container.
 * Automatically adjusts column count based on available width, with a minimum column width of 300px.
 */
export const ResponsiveGrid = styled.div`
  display: grid;
  /* repeat(auto-fill, ...) ensures the grid fills the available space with as many 300px columns as possible */
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;
