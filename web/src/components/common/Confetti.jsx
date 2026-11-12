/**
 * @file Confetti.jsx
 * @description Visual celebration overlay component rendering full-screen confetti on milestones or achievements.
 * @architecture Common view overlay component bridging react-confetti canvas rendering with responsive window dimensions.
 * @agent_note Non-interactive pointer-events overlay; cleans up state automatically via onConfettiComplete.
 */

/**
 * FILE PURPOSE: A visual celebration component that triggers a full-screen confetti effect.
 *
 * DEPENDENCIES:
 * - react-confetti: The core library for rendering the confetti particles.
 * - react-use/useWindowSize: Hook to dynamically track the browser window dimensions.
 * - styled-components: For fixed positioning of the confetti overlay.
 *
 * EXPORTS:
 * - Confetti: Default export.
 *
 * INTERCONNECT:
 * - Triggered by QuizPanel.jsx or Marathon quizzes upon successful completion of a set or achievement.
 */

import React from "react";
import { useWindowSize } from "react-use";
import ReactConfetti from "react-confetti";
import styled from "styled-components";

/**
 * Overlay container to ensure confetti renders above all other content
 * but does not interfere with user interactions.
 */
const ConfettiWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  pointer-events: none;
`;

/**
 * Confetti celebration overlay component.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} props.trigger - Boolean flag that activates the confetti burst.
 * @param {Object} [props.config={}] - Optional configuration overrides passed to ReactConfetti.
 * @returns {JSX.Element|null} Fixed confetti canvas overlay or null when idle.
 */
const Confetti = ({ trigger, config = {} }) => {
  // Access window dimensions for proper scaling of the confetti canvas
  const { width, height } = useWindowSize();

  const [shouldRender, setShouldRender] = React.useState(false);

  // Activate rendering state when the trigger prop becomes true
  React.useEffect(() => {
    if (trigger) {
      setShouldRender(true);
    }
  }, [trigger]);

  // Prevent rendering if not triggered and not currently in active state
  if (!shouldRender && !trigger) return null;

  return (
    <ConfettiWrapper>
      <ReactConfetti
        width={width}
        height={height}
        recycle={false} // Particles do not restart after falling out of view
        numberOfPieces={500}
        gravity={1}
        onConfettiComplete={() => setShouldRender(false)} // Cleanup state once animation ends
        {...config}
      />
    </ConfettiWrapper>
  );
};

export default Confetti;
