/**
 * @file DashboardLayout.jsx
 * @description Primary dashboard layout organizing greeting headers, marathon action links, active learning modules, and performance cards.
 * @architecture Serves as the authenticated learner home layout, composing navigation, user summaries, and progress cards into a responsive grid.
 * @agent_note Maintain the responsive breakpoint styles and subcomponent orchestration when updating dashboard sections or introducing new dashboard widgets.
 */

/**
 * FILE PURPOSE: Main user dashboard layout.
 * Acts as the post-login landing page, aggregating greeting, quick-access links, and module progress modules.
 *
 * DEPENDENCIES:
 * - Nav: Global navigation bar for top-level app switching.
 * - Greeting: Personalized welcome header with user context.
 * - MarathonLink: Promotional quick-start button for Marathon mode.
 * - ModuleCard: User's active educational module summary.
 * - PerformanceOverviewCard: Visual stats and carrot count overview.
 *
 * EXPORTS:
 * - Dashboard (default): The core layout component for the /dashboard route.
 *
 * INTERCONNECT:
 * - Serves as the primary entry point after successful authentication.
 * - Utilizes styled-components for mobile-responsive layout adjustments.
 */

import styled from "styled-components";
import Nav from "../components/Nav/Nav.jsx";
import Greeting from "../components/HeaderGreeting.jsx";
import MarathonLink from "../components/MarathonLink.jsx";
import ModuleCard from "../components/ModuleCard/ModuleCard.jsx";
import PerformanceOverviewCard from "../components/PerformanceOverviewCard/PerformanceOverviewCard.jsx";

// --- Styled Components ---

/**
 * DashboardStyle: Root flex container for the dashboard.
 * Centrally aligns content and manages spacing for desktop and mobile viewports.
 */
const DashboardStyle = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin: auto;
  padding: 40px;
  min-height: 100vh;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 80px 10px 20px 10px; // Increased top padding for mobile navbar clearance
    min-height: 100svh;
  }
`;

/**
 * GreetingWrapper: Flexible container for top-level informational components (Greeting and MarathonLink).
 */
const GreetingWrapper = styled.div`
  width: 80%;
  display: flex;
  margin-bottom: 20px;
  margin-block: auto;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

/**
 * ModuleAndPerformanceWrapper: Layout for the two primary functional cards on the dashboard.
 */
const ModuleAndPerformanceWrapper = styled.div`
  width: 90%;
  height: -moz-fit-content;
  height: fit-content;
  display: flex;
  margin-block: auto;
  gap: 20%;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 30px;
  }
`;

/**
 * Dashboard layout component that coordinates navigation bar, user greetings, marathon links, and summary cards.
 *
 * @component
 * @returns {JSX.Element} Responsive dashboard screen layout for authenticated users.
 */
function DashboardLayout() {
  return (
    <>
      {/* Global Navbar */}
      <Nav />

      <DashboardStyle className="dashboard">
        {/* Welcome Section */}
        <GreetingWrapper>
          <Greeting />
          <MarathonLink />
        </GreetingWrapper>

        {/* Progress & Stats Section */}
        <ModuleAndPerformanceWrapper>
          <ModuleCard />
          <PerformanceOverviewCard />
        </ModuleAndPerformanceWrapper>
      </DashboardStyle>
    </>
  );
}

export default DashboardLayout;
