/**
 * FILE PURPOSE: ModuleStartSkeleton — Suspense fallback for the module intro/start page.
 *
 * ROLE:
 * Mirrors the layout of components/common/StartPage.jsx. It provides a visual structure
 * for module metadata (questions, progress, accuracy) and the primary "Dive In" button.
 *
 * DEPENDENCIES:
 * - ../SkeletonLoader.jsx: Provides primitive placeholders for text and buttons.
 *
 * EXPORTS:
 * - ModuleStartSkeleton (default): Renders the centered intro page layout.
 *
 * INTERCONNECTIONS:
 * - Primary fallback for /module/:moduleId.
 * - Also used as an inline loading state within ModuleStartPage.jsx to replace
 *   heavy full-screen splash screens for a smoother transition.
 */
import { SkeletonRect, SkeletonText } from "../SkeletonLoader.jsx";

export default function ModuleStartSkeleton() {
  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "80px auto",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
      }}
    >
      {/* Page title placeholder: Simulates the module's name */}
      <SkeletonText $width="55%" $height="38px" />

      {/* 
              Three stat boxes placeholder — Questions / Progress / Accuracy.
              Mirrors the horizontal flex layout of the module stats row.
            */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Numeric value placeholder */}
            <SkeletonText $width="60px" $height="30px" />
            {/* Label text placeholder */}
            <SkeletonText $width="80px" $height="14px" />
          </div>
        ))}
      </div>

      {/* Progress bar placeholder: Simulates the horizontal module completion track */}
      <SkeletonRect $width="100%" $height="8px" $radius="100px" />

      {/* CTA button placeholder: Mirrors the "Start" or "Dive In" action button */}
      <SkeletonRect $width="180px" $height="52px" $radius="100px" />
    </div>
  );
}
