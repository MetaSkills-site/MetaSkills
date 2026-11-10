/**
 * FILE PURPOSE: DashboardSkeleton — Suspense fallback for the /dashboard route.
 *
 * ROLE:
 * Mirrors the two-column layout of layouts/Dashboard.jsx exactly to ensure zero layout shift
 * when the real page content replaces it. This improves perceived performance and user experience.
 *
 * DEPENDENCIES:
 * - styled-components: For layout and styling of skeleton placeholders.
 * - ../Nav.jsx: To keep the navigation bar visible during the JS-chunk loading phase.
 * - ../SkeletonLoader.jsx: Provides the primitive SkeletonText and SkeletonRect components.
 *
 * EXPORTS:
 * - DashboardSkeleton (default): The functional component rendering the skeleton UI.
 *
 * INTERCONNECTIONS:
 * - Rendered by the main App router within a React.Suspense boundary for the /dashboard path.
 */
import styled from "styled-components";
import Nav from "../Nav/Nav.jsx";
import { SkeletonText, SkeletonRect } from "../SkeletonLoader.jsx";

/* ─── Styled Components ─── */

/**
 * DashboardStyle
 * Container that mirrors the main dashboard's flex layout and padding.
 * Ensures the skeleton is centered and occupies the full viewport height.
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
    padding: 80px 10px 20px 10px;
    min-height: 100svh;
  }
`;

/**
 * GreetingWrapper
 * Mirrors the HeaderGreeting component's space and responsive behavior.
 */
const GreetingWrapper = styled.div`
  width: 80%;
  display: flex;
  align-items: center;
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
 * CardWrapper
 * Mirrors the dual-card layout (ModuleCard + PerformanceOverviewCard).
 */
const CardWrapper = styled.div`
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

/* ─── Main Component ─── */

export default function DashboardSkeleton() {
  return (
    <>
      <Nav />
      <DashboardStyle className="dashboard">
        <GreetingWrapper>
          {/* Greeting text — mirrors HeaderGreeting title area */}
          <SkeletonText $width="320px" $height="42px" />

          {/* MarathonLink button — right-aligned pill placeholder */}
          <SkeletonRect
            $width="160px"
            $height="48px"
            $radius="100px"
            style={{ marginLeft: "auto" }}
          />
        </GreetingWrapper>

        <CardWrapper>
          {/* Left Column Placeholder: Mirrors a ModuleCard */}
          <SkeletonRect $width="260px" $height="170px" $radius="20px" />

          {/* Right Column Placeholder: Mirrors a full-width PerformanceOverviewCard */}
          <SkeletonRect $width="100%" $height="170px" $radius="20px" />
        </CardWrapper>
      </DashboardStyle>
    </>
  );
}
