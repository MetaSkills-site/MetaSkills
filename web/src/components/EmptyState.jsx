/**
 * @file EmptyState.jsx
 * @description A clean UI component to display when a list or container has no items to show.
 * It features a customizable message and an optional icon.
 *
 * @dependencies
 * - styled-components: For layout and typography styling.
 *
 * @exports EmptyState (default)
 * @interconnections Used in ModuleList, Analytics, and other data-driven components to handle empty results.
 */

import styled from "styled-components";

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #888;
  background: #f9f9f9;
  border-radius: 10px;
  border: 2px dashed #ddd;
  margin: 20px 0;
  width: 100%;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyMessage = styled.p`
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  font-family: var(--font-primary);
`;

export default function EmptyState({ message = "No data available", icon }) {
  return (
    <EmptyStateContainer>
      {/* Render optional icon if provided */}
      {icon && <EmptyIcon>{icon}</EmptyIcon>}
      <EmptyMessage>{message}</EmptyMessage>
    </EmptyStateContainer>
  );
}
