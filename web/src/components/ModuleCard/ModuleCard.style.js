/**
 * @file ModuleCard.style.js
 * @description Styles specifically for module display cards and navigation links within the dashboard.
 * @dependencies styled-components, react-router-dom, ./Card.style
 * @exports CurrentModule, PageLink
 * @interconnections Extends the base Card component and is used in the Home component to highlight active modules.
 */

import { Link } from "react-router-dom";
import styled from "styled-components";
import { Card } from "../../styles/Card.style";

/**
 * Styled component for the currently active module card.
 * Inherits base card styles and specifies grid positioning within the dashboard.
 */
export const CurrentModule = styled(Card)`
  grid-column: 1;
  grid-row: 2;
`;

/**
 * Styled navigation link for internal page transitions.
 * Features text shadows, custom underlines, and hover animations.
 */
export const PageLink = styled(Link)`
  /* Subtle text shadow for a "lifted" feel */
  text-shadow: 0 1px 0px #ff8b7040;
  display: flex;
  width: -moz-fit-content;
  width: fit-content;
  margin-block: 30px;
  /* Thick, semi-transparent underline as a brand accent */
  text-decoration: underline #ff57220a 4px;
  cursor: pointer;
  transition: 350ms;

  /* Intensify text shadow on hover for interactive feedback */
  &:hover {
    text-shadow: 0 1px 0px #ff8b70;
  }

  /* SVG icon styling within the link, ensuring vertical alignment and spacing */
  > svg {
    width: 30px;
    height: 30px;
    fill: #f1765a;
    display: block;
    margin: auto;
    margin-inline: 1px 15px;
  }
`;
