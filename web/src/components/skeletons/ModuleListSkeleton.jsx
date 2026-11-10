/**
 * FILE PURPOSE: ModuleListSkeleton — Suspense fallback for /modules/:subject routes.
 *
 * ROLE:
 * Mirrors the grid layout of components/ModuleList.jsx. It provides a visual
 * placeholder for the list of available modules (English, Math, etc.) to
 * prevent jarring layout jumps when data or code chunks arrive.
 *
 * DEPENDENCIES:
 * - styled-components: For grid and card skeleton layouts.
 * - ../SkeletonLoader.jsx: Provides SkeletonRect for shape placeholders.
 *
 * EXPORTS:
 * - ModuleListSkeleton (default): Renders the module grid placeholder.
 *
 * INTERCONNECTIONS:
 * - Used in React.Suspense boundaries for module listing pages.
 * - Extracted from ModuleList's internal loading state to support early Suspense triggers.
 */
import styled from "styled-components";
import { SkeletonRect } from "../SkeletonLoader.jsx";

/* ─── Styled Components ─── */

const Container = styled.div`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

/**
 * ModuleGrid
 * Emulates the responsive grid layout used in the real ModuleList component.
 * Uses repeat(auto-fill) to match the dynamic sizing of module cards.
 */
const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

/**
 * ModuleCardSkeleton
 * Represents the container of a single module entry.
 */
const ModuleCardSkeleton = styled.div`
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
`;

/* ─── Main Component ─── */

export default function ModuleListSkeleton() {
  return (
    <Container>
      {/* Header row — back icon (32px circle) + centered title placeholder */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <SkeletonRect $width="32px" $height="32px" $radius="50%" />
        <SkeletonRect
          $width="200px"
          $height="36px"
          style={{ margin: "0 auto", marginRight: "32px" }}
        />
      </div>

      <ModuleGrid>
        {/* 
                  Generate 6 static placeholders. 
                  This loop logic creates a consistent visual volume before actual data arrives.
                */}
        {Array.from({ length: 6 }).map((_, i) => (
          <ModuleCardSkeleton key={i}>
            {/* Module title placeholder */}
            <SkeletonRect
              $height="24px"
              $width="70%"
              style={{ marginBottom: "15px" }}
            />

            {/* Footer row: Question count + status badge placeholders */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <SkeletonRect $height="16px" $width="30%" />
              <SkeletonRect $height="20px" $width="25%" $radius="12px" />
            </div>
          </ModuleCardSkeleton>
        ))}
      </ModuleGrid>
    </Container>
  );
}
