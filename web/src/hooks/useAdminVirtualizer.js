/**
 * @file useAdminVirtualizer.js
 * @description Wraps TanStack Virtual's useWindowVirtualizer for admin list views.
 * Items scroll with the native browser window — no inner scroll container needed.
 *
 * DEPENDENCIES:
 * - react: useRef, useState, useLayoutEffect
 * - @tanstack/react-virtual: useWindowVirtualizer
 *
 * EXPORTS:
 * - useAdminVirtualizer: Hook for efficient window-based list virtualization.
 *
 * INTERCONNECTIONS:
 * - Used in admin dashboard views (e.g., ViewQuestions, ViewModules) to handle large lists of data efficiently.
 */

import { useRef, useState, useLayoutEffect } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

/**
 * useAdminVirtualizer Hook
 *
 * IMPORTANT: scrollMargin must be computed AFTER mount (via useLayoutEffect),
 * otherwise listRef.current is null at initialization and scrollMargin defaults
 * to 0, causing the virtualizer to think the list starts at the document top
 * and rendering ALL items as "in-viewport".
 *
 * @param {Object} options      - Configuration options
 * @param {number} options.count        - Total number of items to virtualize
 * @param {number} [options.estimateSize=80] - Estimated row height in px
 * @param {number} [options.overscan=5]     - Buffer items rendered above/below the fold
 * @returns {Object} { listRef, virtualizer }
 */
export function useAdminVirtualizer({
  count,
  estimateSize = 80,
  overscan = 5,
}) {
  // Reference to the main list container for measurement
  const listRef = useRef(null);

  /**
   * scrollMargin = distance from document top to the list's top edge.
   * Must be measured after mount — listRef.current is null during the first render.
   */
  const [scrollMargin, setScrollMargin] = useState(0);

  // Sync scroll margin after the layout is established to ensure correct starting position
  useLayoutEffect(() => {
    if (listRef.current) {
      setScrollMargin(listRef.current.offsetTop);
    }
  }, []);

  /**
   * Initialize window virtualizer with dynamic measurements
   * and the established scroll margin.
   */
  const virtualizer = useWindowVirtualizer({
    count,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
    // Dynamic row measurement for variable height items
    measureElement: (el) => el?.getBoundingClientRect().height ?? estimateSize,
  });

  return { listRef, virtualizer };
}
