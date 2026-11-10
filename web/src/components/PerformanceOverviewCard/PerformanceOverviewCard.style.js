/**
 * @file PerformanceOverviewCard.style.js
 * @description Styles for the performance overview visualization, typically used on the dashboard to display progress metrics.
 * @dependencies styled-components, ./Card.style
 * @exports PerformanceCard, SubjectRow, StatsVal
 * @interconnections Extends the base Card component to provide specialized layout for progress bars and subject stats.
 */

import styled from "styled-components";
import { Card } from "../../styles/Card.style";

/**
 * Container for the entire performance overview section.
 * Extends base Card styling with specific padding, grid alignment, and sizing constraints.
 */
export const PerformanceCard = styled(Card)`
  grid-column: 2;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 30px;
  /* min-height ensures consistent layout regardless of dynamic content volume */
  min-height: 250px;
  max-height: 100%;
  max-width: 100%;
  width: 100%;
  align-self: center;
`;

/**
 * Individual row for a subject or performance metric.
 * Includes style overrides for nested progress bar components to match the card's aesthetic.
 */
export const SubjectRow = styled.div`
  width: 100%;
  margin-bottom: 25px;

  /* Remove margin from the last subject row to prevent extra spacing at bottom */
  &:last-child {
    margin-bottom: 0;
  }

  /* 
   * Specific styling for progress bars within the performance context.
   * Overrides global .progress styles for a more compact and consistent look.
   */
  .custom-progress {
    height: 12px;
    margin: 0;
    width: 100%;
    border-radius: 6px;
    box-shadow: none; /* Removes the inset shadow from global styles */
    background-color: #f0f0f0;
  }

  .custom-progress > div {
    border-radius: 6px;
  }
`;

/**
 * Styled text component for displaying numeric or percentage values in the performance card.
 */
export const StatsVal = styled.span`
  font-family: var(--font-primary);
  font-weight: 700;
  color: #333;
  font-size: 15px;
`;
