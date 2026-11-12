/**
 * @file AnalyticsSkeleton.jsx
 * @description Loading skeleton placeholder replicating the multi-chart and history list layout of AnalyticsPage.
 * @architecture View-layer Suspense fallback component rendering responsive grid placeholders and persistent navigation.
 * @agent_note Matches the dual-chart and strength/weakness layout of AnalyticsPage to prevent cumulative layout shift.
 */

/**
 * FILE PURPOSE: AnalyticsSkeleton — Suspense fallback for the /analytics routes.
 *
 * ROLE:
 * Mirrors the complex multi-chart layout of pages/AnalyticsPage.jsx.
 * Prevents layout shift for interactive charts and history lists, ensuring
 * the dashboard-like feel is preserved during the JS chunk download.
 *
 * DEPENDENCIES:
 * - styled-components: For grid-based chart layout and responsive page wrapper.
 * - ../Nav.jsx: Included to ensure navigation persists during the load.
 * - ../SkeletonLoader.jsx: Provides text and rectangular placeholders for charts/lists.
 *
 * EXPORTS:
 * - AnalyticsSkeleton (default): Renders the full analytics page placeholder.
 *
 * INTERCONNECTIONS:
 * - Integrated into the router for /analytics and /analytics/:moduleId paths.
 */
import styled from "styled-components";
import Nav from "../Nav/Nav.jsx";
import { SkeletonRect, SkeletonText } from "../SkeletonLoader.jsx";

/* ─── Styled Components ─── */

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 80px 10px 20px 10px;
    width: 100%;
  }
`;

/**
 * DualChartGrid
 * Mirrors the CSS Grid used for side-by-side performance charts in the real UI.
 */
const DualChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

/* ─── Main Component ─── */

/**
 * AnalyticsSkeleton Suspense fallback component.
 *
 * @component
 * @returns {JSX.Element} Full page skeleton placeholder for analytics routes.
 */
export default function AnalyticsSkeleton() {
  return (
    <>
      <Nav />
      <PageWrapper>
        {/* Page header area: Placeholder for Title and Subtitle */}
        <SkeletonText
          $width="220px"
          $height="36px"
          style={{ marginBottom: "10px" }}
        />
        <SkeletonText
          $width="320px"
          $height="18px"
          style={{ marginBottom: "30px" }}
        />

        {/* Primary line chart placeholder: Occupies the hero chart position */}
        <SkeletonRect
          $width="100%"
          $height="300px"
          style={{ marginBottom: "30px" }}
        />

        {/* Secondary chart area: Two smaller charts side by side */}
        <DualChartGrid>
          <SkeletonRect $width="100%" $height="220px" />
          <SkeletonRect $width="100%" $height="220px" />
        </DualChartGrid>

        {/* Strengths & Weaknesses bar placeholder: Simulates the horizontal summary bar */}
        <SkeletonRect
          $width="100%"
          $height="200px"
          style={{ marginBottom: "30px" }}
        />

        {/* 
                  History list placeholders:
                  Simulates the recent module attempts list. 
                */}
        {[1, 2, 3].map((i) => (
          <SkeletonRect
            key={i}
            $width="100%"
            $height="110px"
            style={{ marginBottom: "15px" }}
          />
        ))}
      </PageWrapper>
    </>
  );
}
