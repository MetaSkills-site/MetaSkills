/**
 * @file useProgressiveFade.js
 * @description A custom React hook that provides scroll-linked opacity values for elements.
 * It uses Framer Motion's useScroll and useTransform to create a "fade-in, hold, fade-out" effect
 * as an element passes through a scrolling container.
 *
 * @dependencies
 * - React (createContext, useContext, useRef): For context-based container referencing and target tracking.
 * - framer-motion (useScroll, useTransform): For calculating scroll progress and mapping it to CSS values.
 *
 * @exports
 * - ScrollContext: Context that should hold the ref of the scrolling container.
 * - useProgressiveFade: The hook returning a ref and a style object with dynamic opacity.
 *
 * @interconnections
 * - Extensively used by sections in the Home page (MarathonSection, TailoredSection) to
 *   provide smooth, distraction-free transitions during scrolling.
 */

import { createContext, useContext, useRef } from "react";
import { useScroll, useTransform } from "framer-motion";

/**
 * Context to share the scrollable container's ref with nested components.
 */
export const ScrollContext = createContext(null);

export const useProgressiveFade = () => {
  // Access the parent container's ref from context
  const containerRef = useContext(ScrollContext);
  // Create a local ref for the element that will be faded
  const targetRef = useRef(null);

  // Track the vertical scroll progress of the target relative to the container
  const scrollOptions = {
    target: targetRef,
    // offset: ["target container", "target container"]
    // "start end": top of target enters bottom of container (progress = 0)
    // "end start": bottom of target leaves top of container (progress = 1)
    offset: ["start end", "end start"],
  };

  // Add defensive check for containerRef; if null, defaults to viewport
  if (containerRef) {
    scrollOptions.container = containerRef;
  }

  const { scrollYProgress } = useScroll(scrollOptions);

  /**
   * Map scroll progress (0 to 1) to opacity values.
   * 0.0 -> 0.1: Invisible
   * 0.1 -> 0.25: Fading in
   * 0.25 -> 0.75: Fully visible (Hold)
   * 0.75 -> 0.9: Fading out
   * 0.9 -> 1.0: Invisible
   * clamp: Prevent values from extrapolating outside the 0-1 range.
   */
  const opacity = useTransform(
    scrollYProgress,
    [0.1, 0.25, 0.75, 0.9],
    [0, 1, 1, 0],
    { clamp: true },
  );

  return { ref: targetRef, style: { opacity } };
};
