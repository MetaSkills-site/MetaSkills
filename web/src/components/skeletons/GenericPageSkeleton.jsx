/**
 * FILE PURPOSE: GenericPageSkeleton — A versatile fallback for low-traffic or administrative routes.
 *
 * ROLE:
 * Provides a neutral loading state for pages that do not require a bespoke,
 * high-fidelity skeleton (e.g., admin panels, some marathon sub-pages).
 * This reduces maintenance while ensuring the app feels responsive.
 *
 * DEPENDENCIES:
 * - ../SkeletonLoader.jsx: Provides SkeletonRect and SkeletonText for generic row-based UI.
 *
 * EXPORTS:
 * - GenericPageSkeleton (default): Renders a standard title-and-rows layout.
 *
 * INTERCONNECTIONS:
 * - Used as a catch-all Suspense fallback in App.jsx or within Admin/Marathon route groups.
 * - Unlike Dashboard/AnalyticsPage skeletons, this does NOT include <Nav /> as it's often
 *   used in contexts where the global Nav is already rendered or not needed.
 */
import { SkeletonRect, SkeletonText } from "../SkeletonLoader.jsx";

export default function GenericPageSkeleton() {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px",
      }}
    >
      {/* Page title placeholder: Simulates a standard h1/h2 header */}
      <SkeletonText
        $width="240px"
        $height="28px"
        style={{ marginBottom: "24px" }}
      />

      {/* 
              Content rows loop:
              Simulates a list or a series of content blocks (e.g., table rows or list items).
              Using a fixed loop of 4 items for a predictable loading visual.
            */}
      {[1, 2, 3, 4].map((i) => (
        <SkeletonRect
          key={i}
          $width="100%"
          $height="64px"
          style={{ marginBottom: "12px" }}
        />
      ))}
    </div>
  );
}
