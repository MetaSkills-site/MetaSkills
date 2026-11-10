/**
 * @file PerformanceOverviewCard.jsx
 * @description A dashboard widget that displays the user's academic performance summary.
 * It shows progress and accuracy for different subjects (English, Maths) using visual progress bars and icons.
 *
 * @dependencies
 * - react: For useContext hook.
 * - PerformanceOverviewCard.style: Styled components for the card layout.
 * - Font style: For consistent typography.
 * - SessionContext: To access the user's authentication token.
 * - Progress: A reusable progress bar component.
 * - @tanstack/react-query: For efficient data fetching and caching.
 * - SkeletonLoader: To show loading states.
 *
 * @exports PerformanceOverviewCard (default)
 * @interconnections Main component on the user dashboard. Fetches data from `/api/users/performance`.
 */

import { useContext } from "react";
import {
  PerformanceCard,
  SubjectRow,
  StatsVal,
} from "./PerformanceOverviewCard.style";
import { Font } from "../../styles/Font.style.js";
import { SessionContext } from "../../context/SessionProvider.jsx";
import Progress from "../Progress.jsx";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../services/api";
import { API_ENDPOINTS } from "../../api/requestMap";
import { SkeletonText } from "../SkeletonLoader";

function PerformanceOverviewCard() {
  const { user } = useContext(SessionContext);

  /**
   * useQuery hook to fetch user performance data.
   * Caches data under the 'user-performance' key and only runs if the user is authenticated.
   */
  const {
    data: performance,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["user-performance", user?._id],
    enabled: !!user?._id,
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.getUserPerformance.url);
      return res.data.data;
    },
  });

  // Display error message if the data fetch fails
  if (isError)
    return (
      <PerformanceCard>
        <div
          style={{
            width: "100%",
            padding: "20px",
            textAlign: "center",
            color: "#d32f2f",
            fontSize: "14px",
          }}
        >
          Failed to load performance data. Please try again.
        </div>
      </PerformanceCard>
    );

  // Configuration for subjects to be displayed in the card
  const subjects = [
    {
      key: "english",
      label: "English",
      color: "#4caf50",
      gradient: "linear-gradient(90deg, #4caf50, #76c34aff, #95dc39ff)",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#4caf50"
          width="24px"
          height="24px"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
        </svg>
      ),
    },
    {
      key: "maths",
      label: "Maths",
      color: "#2196f3",
      gradient: "linear-gradient(90deg, #2196f3, #03a9f4, #00bcd4)",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#2196f3"
          width="24px"
          height="24px"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M18 4H6v2h12V4zm0 4H6v2h12V8zm0 4H6v2h12v-2zm0 4H6v2h12v-2z" />
          <path d="M7 2h10l-3.5 10 3.5 10H7l3.5-10L7 2z" opacity=".3" />
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 14H7v-2h6v2zm4-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
        </svg>
      ),
    },
  ];

  return (
    <PerformanceCard>
      <div style={{ width: "100%", padding: "10px 20px" }}>
        {subjects.map((sub) => (
          <SubjectRow key={sub.key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {sub.icon}
                  <Font
                    $name="quicksand"
                    $weight="600"
                    $size="16px"
                    $color="#555"
                  >
                    {sub.label}
                  </Font>
                </div>
                {/* Show percentage or loading skeleton */}
                {loading ? (
                  <SkeletonText $width="30px" $height="16px" />
                ) : (
                  <StatsVal>{performance?.[sub.key]?.progress || 0}%</StatsVal>
                )}
              </div>

              {/* Show progress bar or loading skeleton */}
              {loading ? (
                <div
                  style={{
                    height: "10px",
                    width: "100%",
                    background: "#eee",
                    borderRadius: "5px",
                    marginBottom: "8px",
                  }}
                ></div>
              ) : (
                <Progress
                  progress={performance?.[sub.key]?.progress || 0}
                  className="custom-progress"
                  gradient={sub.gradient}
                />
              )}

              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Font $name="quicksand" $size="12px" $color="#888">
                  Accuracy:{" "}
                  {loading ? "..." : performance?.[sub.key]?.accuracy || 0}%
                </Font>
              </div>
            </SubjectRow>
          ))
        }
      </div>
    </PerformanceCard>
  );
}

export default PerformanceOverviewCard;
