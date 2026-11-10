/**
 * @file useQuestionFetch.js
 * @description Provides an on-demand fetch function for individual questions using TanStack Query for caching.
 *
 * DEPENDENCIES:
 * - react: useState, useCallback
 * - @tanstack/react-query: useQueryClient
 * - services/quizService: getQuestionByIdAdmin
 *
 * EXPORTS:
 * - default: useQuestionFetch - Hook for managing question data transport and caching.
 *
 * INTERCONNECTIONS:
 * - Utilized by admin components like TrashQuestions, ErrorReports, and ViewQuestions to load question details into modals or views.
 * - Cache key: ['question', id] - staleTime: 5 minutes.
 */

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getQuestionByIdAdmin } from "../services/quizService";
/**
 * useQuestionFetch Hook
 *
 * Returns an on-demand fetch function that uses queryClient.fetchQuery so
 * repeated opens of the same question modal are served from cache.
 */
export default function useQuestionFetch() {
  const queryClient = useQueryClient();

  // Local state to track the fetched question and its loading status
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * fetchQuestion
   * On-demand function to retrieve question data by its unique ID.
   *
   * @param {string} id - The unique identifier for the question.
   * @returns {Promise<Object|null>} The fetched question data or null.
   */
  const fetchQuestion = useCallback(
    async (id) => {
      // Early return if no ID is provided
      if (!id) return null;

      setLoading(true);
      try {
        // Use TanStack Query's fetchQuery for automated caching layer
        const data = await queryClient.fetchQuery({
          queryKey: ["question", id],
          queryFn: () =>
            getQuestionByIdAdmin(id).then((res) => res?.data ?? null),
          // Set staleTime to 5 minutes as question data is relatively static during a session
          staleTime: 5 * 60_000,
        });

        // Update local state with retrieved data
        setQuestionData(data);
        return data;
      } finally {
        // Reset loading indicator regardless of success or failure
        setLoading(false);
      }
    },
    [queryClient],
  );

  return { questionData, loading, fetchQuestion };
}
