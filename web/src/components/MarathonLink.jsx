/**
 * @file MarathonLink.jsx
 * @description Renders a stylized call-to-action link directing users to the high-intensity Marathon mode.
 * @architecture UI navigation banner integrated into user dashboard header and welcome areas.
 * @agent_note Provides responsive styling with hover animations and routes to /marathon via react-router Link.
 */

/**
 * FILE PURPOSE: MarathonLink — A primary call-to-action (CTA) link for the Marathon mode.
 *
 * ROLE:
 * Provides a visually distinct entry point to the high-intensity "Marathon" quiz mode.
 * Its design (pill shape, shadow, icon) is intended to draw attention and encourage engagement
 * with long-form practice sessions.
 *
 * DEPENDENCIES:
 * - styled-components: For interactive hover states and responsive layouts.
 * - react-router-dom: For client-side navigation to /marathon.
 * - styles/Flex: For standard alignment.
 * - styles/Font: For theme-consistent typography.
 *
 * EXPORTS:
 * - MarathonLink (default): The functional component rendering the link block.
 *
 * INTERCONNECTIONS:
 * - Integrated into the Dashboard header greeting area.
 */
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Flex } from "../styles/Flex.style";
import { Font } from "../styles/Font.style";

/* ─── Styled Components ─── */

const LinkContainer = styled(Link)`
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  margin-left: 20px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
`;

/* ─── Main Component ─── */

/**
 * @component
 * @returns {JSX.Element} The rendered call-to-action link block for entering Marathon mode.
 */
function MarathonLink() {
  return (
    <LinkContainer to="/marathon">
      <Flex>
        {/* Flag Icon SVG — stylized in orange to signal goal/achievement */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "#ff7b51" }}
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      </Flex>
      <Flex $column style={{ alignItems: "flex-start" }}>
        <Font $name="quicksand" $weight="700" $size="16px" $color="#333">
          Join the Marathon!
        </Font>
        <Font $name="quicksand" $weight="500" $size="12px" $color="#666">
          Test your limits 🏃
        </Font>
      </Flex>
    </LinkContainer>
  );
}

export default MarathonLink;
