/**
 * @file AuroraBackground.jsx
 * @description A visually dynamic background component featuring animated "blobs" that create
 * an aurora-like effect. It utilizes Framer Motion for organic movements and supports accessibility
 * by respecting reduced motion preferences.
 *
 * @dependencies
 * - framer-motion: For complex CSS animations (scale, translation).
 * - styled-components: For styling the blobs and container.
 *
 * @exports AuroraBackground - The background animation component.
 *
 * @interconnections
 * - Used as a background layer in the HeroSection to enhance visual appeal.
 */

import { motion, useReducedMotion } from "framer-motion";
import styled from "styled-components";

// --- Styled Components for Aurora ---

/**
 * Container that houses the animated blobs.
 * Uses absolute positioning to cover its parent's area.
 */
const AuroraContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  background-color: #f8f9fa; /* Match MainContainer background */
`;

/**
 * Base blob component with common filter and opacity settings.
 * Uses border-radius to create an organic, non-perfect shape.
 */
const Blob = styled(motion.div)`
  position: absolute;
  filter: blur(30px); /* Reduced blur for sharper texture */
  opacity: 0.5; /* Lower base opacity for a less dense look */
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; /* Organic, streak-like shape */
`;

// Specific blob configurations (size, color, initial position)
const Blob1 = styled(Blob)`
  width: 45vw; /* Smaller size */
  height: 30vw;
  background-color: rgba(255, 87, 34, 0.5); /* #ff5722 theme color */
  top: 5%;
  left: 5%;
`;

const Blob2 = styled(Blob)`
  width: 40vw;
  height: 20vw;
  background-color: rgba(233, 30, 99, 0.4); /* #e91e63 theme color */
  bottom: 5%;
  right: 5%;
`;

const Blob3 = styled(Blob)`
  width: 55vw;
  height: 15vw; /* Wider and thinner streak */
  background-color: rgba(255, 152, 0, 0.3); /* Secondary theme accent */
  top: 45%;
  left: 20%;
`;

// --- Aurora Background Component ---

const AuroraBackground = () => {
  // Accessibility hook to disable animations if the user prefers reduced motion
  const shouldReduceMotion = useReducedMotion();

  return (
    <AuroraContainer>
      {/* Blob 1: Animates in a looping path (x, y, scale) */}
      <Blob1
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 50, -30, 0],
                y: [0, -40, 60, 0],
                scale: [1, 1.1, 0.9, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />
      {/* Blob 2: Animates in a different path and duration for complexity */}
      <Blob2
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -60, 40, 0],
                y: [0, 50, -30, 0],
                scale: [1, 0.9, 1.2, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />
      {/* Blob 3: Slower animation to provide depth */}
      <Blob3
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 40, -50, 0],
                y: [0, 30, -50, 0],
                scale: [1, 1.2, 0.8, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />
    </AuroraContainer>
  );
};

export default AuroraBackground;
