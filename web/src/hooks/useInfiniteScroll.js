/**
 * @file useInfiniteScroll.js
 * @description Provides a custom hook for implementing infinite scroll functionality using the Intersection Observer API.
 *
 * DEPENDENCIES:
 * - react: useCallback, useRef
 *
 * EXPORTS:
 * - default: useInfiniteScroll - Custom hook to manage scroll observation.
 *
 * INTERCONNECTIONS:
 * - Used in list components that require pagination on scroll (e.g., ModuleList, QuestionList).
 */

import { useCallback, useRef } from "react";

/**
 * useInfiniteScroll Hook
 *
 * Sets up an IntersectionObserver on a target node to trigger a data loading callback when the node enters the viewport.
 *
 * @param {boolean} loading     - Flag indicating if data is currently being fetched.
 * @param {boolean} hasMore     - Flag indicating if there's more data to load.
 * @param {function} onLoadMore - Callback function to trigger for fetching additional items.
 * @returns {function} lastElementRef - A callback ref to be attached to the last element of the list.
 */
const useInfiniteScroll = (loading, hasMore, onLoadMore) => {
  // Reference to the active IntersectionObserver instance
  const observer = useRef();

  /**
   * lastElementRef
   * Callback ref to manage the observer on the specified DOM element.
   *
   * @param {HTMLElement} node - The DOM node to observe (typically the last item in a list).
   */
  const lastElementRef = useCallback(
    (node) => {
      // Don't initialize or trigger observer if data is already being loaded
      if (loading) return;

      // Clean up previous observer instance if it exists
      if (observer.current) observer.current.disconnect();

      /**
       * Initialize a new IntersectionObserver.
       * entries[0] represents the target node's intersection state.
       */
      observer.current = new IntersectionObserver((entries) => {
        // Trigger data fetch if the last element is intersecting (visible) and more data is available
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });

      // Start observing the newly attached node
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, onLoadMore],
  );

  return lastElementRef;
};

export default useInfiniteScroll;
