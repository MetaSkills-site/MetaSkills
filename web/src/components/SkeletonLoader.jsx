/**
 * @file SkeletonLoader.jsx
 * @description Provides reusable CSS shimmer animation primitives for rendering text, circular, and rectangular skeleton loading states.
 * @architecture UI presentation foundation providing animated placeholder components for asynchronous views across the application.
 * @agent_note Uses transient styled-components props ($width, $height, $size, $mb, $radius) to customize placeholder dimensions.
 */

/**
 * FILE PURPOSE: SkeletonLoader — A library of shimmer-effect primitives for loading states.
 *
 * ROLE:
 * Provides standard rectangular, text-row, and circular skeleton placeholders.
 * It uses a CSS-shimmer animation to signal to users that content is being fetched,
 * improving perceived load times and interface stability.
 *
 * DEPENDENCIES:
 * - styled-components: For animation keyframes and dynamic sizing props.
 *
 * EXPORTS:
 * - SkeletonText: For simulating lines of text.
 * - SkeletonCircle: For simulating profile pictures or icons.
 * - SkeletonRect: For simulating images, cards, or buttons.
 *
 * INTERCONNECTIONS:
 * - Foundation for all specialized skeleton components in components/skeletons/*.
 */
import styled, { keyframes } from "styled-components";

/**
 * shimmer Keyframes
 * Standard left-to-right gradient slide to create the "glowing" pulse effect.
 */
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

/**
 * SkeletonBase
 * The foundational styled component containing the shimmer background and animation logic.
 * Uses transient props ($) to prevent leaking styled-component specific props to the DOM.
 */
const SkeletonBase = styled.div`
  background: #f6f7f8;
  background-image: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 104px;
  display: inline-block;
  position: relative;
  animation-duration: 1s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  animation-name: ${shimmer};
  animation-timing-function: linear;
  border-radius: 4px;
`;

/**
 * @component
 * @description Sized to match standard font-heights and line-margins.
 * @param {Object} props - Styled component properties.
 * @param {string} [props.$width="100%"] - CSS width specification.
 * @param {string} [props.$height="1em"] - CSS height specification.
 * @param {string} [props.$mb="0"] - CSS margin-bottom specification.
 * @returns {JSX.Element} Text line placeholder with shimmer animation.
 */
export const SkeletonText = styled(SkeletonBase)`
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "1em"};
  margin-bottom: ${(props) => props.$mb || "0"};
`;

/**
 * @component
 * @description Used for avatars and circular iconography fallback.
 * @param {Object} props - Styled component properties.
 * @param {string} [props.$size="40px"] - Circle diameter width and height.
 * @returns {JSX.Element} Circular placeholder with shimmer animation.
 */
export const SkeletonCircle = styled(SkeletonBase)`
  width: ${(props) => props.$size || "40px"};
  height: ${(props) => props.$size || "40px"};
  border-radius: 50%;
`;

/**
 * @component
 * @description A generic block-level placeholder for custom component shapes.
 * @param {Object} props - Styled component properties.
 * @param {string} [props.$width="100%"] - CSS width specification.
 * @param {string} [props.$height="100px"] - CSS height specification.
 * @param {string} [props.$radius="8px"] - CSS border-radius specification.
 * @returns {JSX.Element} Rectangular box placeholder with shimmer animation.
 */
export const SkeletonRect = styled(SkeletonBase)`
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "100px"};
  border-radius: ${(props) => props.$radius || "8px"};
`;
