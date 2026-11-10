/**
 * FILE PURPOSE: Comprehensive AnalyticsPage dashboard for user performance tracking.
 * Visualizes attempt history, accuracy trends, and skill breakdown using various chart types.
 *
 * DEPENDENCIES:
 * - ChartWidget: Wrapper for Chart.js components with standardized styling and tooltips.
 * - @tanstack/react-query: Manages asynchronous data fetching, caching, and loading states.
 * - SessionContext: Provides user authentication for secure API requests.
 * - api.js: Centralized axios instance with baseURL and auto token injection.
 * - react-icons: Visual indicators for different stat categories.
 *
 * EXPORTS:
 * - AnalyticsPage (default): The main page component for the /analytics route.
 *
 * INTERCONNECT:
 * - Consumes multiple backend endpoints via apiClient (/analytics/daily, /analytics/speed-accuracy, etc.).
 * - Navigates to detailed ModuleHistoryPage view when a specific module card is clicked.
 */

import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";

import ChartWidget from "../components/ChartWidget";

import Nav from "../components/Nav/Nav";
import { SessionContext } from "../context/SessionProvider";
import {
  HistoryContainer,
  ModuleSection,
  ModuleHeader,
} from "./admin/UserHistoryPage";
import AdminTabs from "../components/admin/AdminTabs";
import EmptyState from "../components/EmptyState";
import { LuHistory } from "react-icons/lu";
import {
  FaChevronRight,
  FaClock,
  FaBullseye,
  FaCheckCircle,
  FaSpinner,
  FaRunning,
} from "react-icons/fa";
import { SkeletonRect } from "../components/SkeletonLoader";

// --- Styled Components ---

const DashboardStyle = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 80px 10px 20px 10px;
    width: 100%;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 30px;
  h1 {
    font-size: 2rem;
    color: #333;
    margin: 0 0 10px 0;
  }
  p {
    color: #666;
    margin: 0;
  }
`;

/**
 * ModuleStatsCard: Interactive card for individual module summaries.
 * Support for $nonInteractive prop to disable hover effects and pointer cursor.
 */
const ModuleStatsCard = styled(ModuleSection)`
  ${(props) =>
    !props.$nonInteractive &&
    `
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #555;

  svg {
    color: #007bff;
    font-size: 1.2rem;
  }

  .value {
    font-weight: bold;
    font-size: 1.1rem;
    color: #333;
  }
`;

/**
 * formatTime: Converts raw seconds into a human-readable duration string (e.g., "1 hr 2 min").
 */
const formatTime = (seconds) => {
  if (!seconds) return "0 sec";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  if (s > 0 || parts.length === 0) parts.push(`${s} sec`);

  return parts.join(" ");
};

export default function AnalyticsPage() {
  const { user } = useContext(SessionContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("modules"); // Controls the history list filter
  const [chartFilter, setChartFilter] = useState("all"); // Controls the chart data source

  // --- Query 1: Static History Data ---
  // Fetches core completion records for both structured modules and free-form marathons.
  // Auth token is injected automatically by the apiClient request interceptor.
  const { data: historyData, isLoading: loading } = useQuery({
    queryKey: ["analytics-history", user?.token],
    enabled: !!user?.token,
    queryFn: async () => {
      const [historyRes, marathonRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.getQuizHistory.url),
        apiClient.get(API_ENDPOINTS.getMarathonHistory.url),
      ]);

      return {
        history: historyRes.data.success ? historyRes.data.data : [],
        marathonHistory: marathonRes.data.success ? marathonRes.data.data : [],
      };
    },
    onError: () => toast.error("Failed to load analytics data"),
  });

  // --- Query 2: Dynamic Chart Data ---
  // Re-fetches specific analytical metrics based on the current 'chartFilter' (all/modules/marathons).
  // Auth token is injected automatically by the apiClient request interceptor.
  const { data: chartsData, isLoading: chartsLoading } = useQuery({
    queryKey: ["analytics-charts", chartFilter, user?.token],
    enabled: !!user?.token,
    queryFn: async () => {
      const type = chartFilter;
      const [dailyRes, speedAccRes, formatRes, difficultyRes, skillsRes] =
        await Promise.all([
          apiClient.get(API_ENDPOINTS.getAnalyticsDaily.url, {
            params: { type },
          }),
          apiClient.get(API_ENDPOINTS.getAnalyticsSpeedAccuracy.url, {
            params: { type },
          }),
          apiClient.get(API_ENDPOINTS.getAnalyticsFormats.url, {
            params: { type },
          }),
          apiClient.get(API_ENDPOINTS.getAnalyticsDifficulty.url, {
            params: { type },
          }),
          apiClient.get(API_ENDPOINTS.getAnalyticsSkills.url, {
            params: { type },
          }),
        ]);

      return {
        dailyAnalytics: dailyRes.data.success
          ? dailyRes.data.data
          : { labels: [], data: [] },
        speedAccData: speedAccRes.data.success ? speedAccRes.data.data : [],
        formatData: formatRes.data.success
          ? formatRes.data.data
          : { MCQ: 0, SA: 0, fillInTheBlanks: 0 },
        difficultyData: difficultyRes.data.success
          ? difficultyRes.data.data
          : [],
        skillsData: skillsRes.data.success ? skillsRes.data.data : [],
      };
    },
    onError: () => toast.error("Failed to load chart filter data"),
  });

  // Destructure data with fallbacks to avoid rendering errors on empty responses
  const history = historyData?.history ?? [];
  const marathonHistory = historyData?.marathonHistory ?? [];
  const dailyAnalytics = chartsData?.dailyAnalytics ?? { labels: [], data: [] };
  const speedAccData = chartsData?.speedAccData ?? [];
  const formatData = chartsData?.formatData ?? {
    MCQ: 0,
    SA: 0,
    fillInTheBlanks: 0,
  };
  const difficultyData = chartsData?.difficultyData ?? [];
  const skillsData = chartsData?.skillsData ?? [];

  // --- Loading Skeleton View ---
  // Combined check for both history records and specific chart metrics to avoid flickering "Not enough data"
  if (loading || chartsLoading) {
    return (
      <>
        <Nav />
        <DashboardStyle>
          <PageHeader>
            <SkeletonRect $width="80%" $height="40px" $mb="10px" />
            <SkeletonRect $width="100%" $height="20px" />
          </PageHeader>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "30px",
              border: "1px solid #eaeaea",
            }}
          >
            <SkeletonRect $width="100%" $height="300px" />
          </div>

          <HistoryContainer>
            {[1, 2, 3].map((i) => (
              <ModuleSection key={i}>
                <SkeletonRect $width="100%" $height="100px" />
              </ModuleSection>
            ))}
          </HistoryContainer>
        </DashboardStyle>
      </>
    );
  }

  // --- Chart Configuration: Daily Attempts (Line Chart) ---
  const hasChartData =
    dailyAnalytics.labels && dailyAnalytics.labels.length > 0;

  const chartConfigData = {
    labels: dailyAnalytics.labels,
    datasets: [
      {
        fill: true,
        label: "Problem Attempts",
        data: dailyAnalytics.data,
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        tension: 0.4,
        pointBackgroundColor: "#007bff",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#007bff",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#333333",
        bodyColor: "#555555",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        cornerRadius: 8,
        titleFont: { weight: "bold" },
        callbacks: {
          label: (context) => `${context.parsed.y} Attempts`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  // --- Chart Configuration: Speed vs Accuracy (Trend Line) ---
  const hasSpeedAccData = speedAccData && speedAccData.length > 0;

  const speedAccConfigData = {
    labels: speedAccData.map((d) => d.bucket),
    datasets: [
      {
        label: "Accuracy Trend",
        data: speedAccData.map((d) => d.accuracy),
        borderColor: "#e91e63",
        backgroundColor: "rgba(233, 30, 99, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
      },
    ],
  };

  const speedAccOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const count = speedAccData[context.dataIndex]?.count || 0;
            return `Accuracy: ${context.parsed.y}% (from ${count} attempts)`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Time Taken" },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: "Avg Accuracy (%)" },
        beginAtZero: true,
        max: 100,
      },
    },
  };

  // --- Chart Configuration: Performance by Format (Radar Chart) ---
  const hasFormatData =
    formatData &&
    (formatData.MCQ > 0 || formatData.SA > 0 || formatData.fillInTheBlanks > 0);

  const formatConfigData = {
    labels: ["Multiple Choice", "Short Answer", "Fill in Blanks"],
    datasets: [
      {
        label: "Average Accuracy %",
        data: [
          formatData.MCQ || 0,
          formatData.SA || 0,
          formatData.fillInTheBlanks || 0,
        ],
        backgroundColor: "rgba(76, 175, 80, 0.4)",
        borderColor: "#4caf50",
        borderWidth: 2,
      },
    ],
  };

  const formatOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Accuracy: ${context.raw}%`,
        },
      },
    },
    scales: {
      r: { angleLines: { display: true }, suggestedMin: 0, suggestedMax: 100 },
    },
  };

  // --- Chart Configuration: Skills Breakdown (Horizontal Bar) ---
  const hasSkillsData = skillsData && skillsData.length > 0;

  // Determine bar colors based on accuracy thresholds: Green (>80), Red (<50), Orange (mid)
  const skillsColors = hasSkillsData
    ? skillsData.map((d) => {
        if (d.averageAccuracy >= 80) return "rgba(76, 175, 80, 0.7)";
        if (d.averageAccuracy <= 50) return "rgba(233, 30, 99, 0.7)";
        return "rgba(255, 152, 0, 0.7)";
      })
    : [];

  const skillsConfigData = {
    labels: hasSkillsData ? skillsData.map((d) => d.skill) : [],
    datasets: [
      {
        label: "Accuracy %",
        data: hasSkillsData ? skillsData.map((d) => d.averageAccuracy) : [],
        backgroundColor: skillsColors,
        borderRadius: 4,
      },
    ],
  };

  const skillsOptions = {
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const count = skillsData[context.dataIndex]?.count || 0;
            return `Accuracy: ${context.raw}% (from ${count} attempts)`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Accuracy (%)" },
        beginAtZero: true,
        max: 100,
      },
      y: { grid: { display: false } },
    },
  };

  // --- Chart Configuration: The Difficulty Wall (Dual-Axis Mixed Chart) ---
  const hasDifficultyData = difficultyData && difficultyData.length > 0;

  const difficultyConfigData = {
    labels: difficultyData.map((d) => d.bucket),
    datasets: [
      {
        label: "Accuracy (%)",
        data: difficultyData.map((d) => d.averageAccuracy),
        borderColor: "#4caf50",
        backgroundColor: "#4caf50",
        yAxisID: "y",
        tension: 0.3,
      },
      {
        label: "Time Taken (s)",
        data: difficultyData.map((d) => d.averageTimeTaken),
        borderColor: "#ff9800",
        backgroundColor: "#ff9800",
        type: "line",
        yAxisID: "y1",
        tension: 0.3,
      },
    ],
  };

  const difficultyOptions = {
    plugins: { legend: { display: true, position: "top" } },
    scales: {
      x: {
        title: { display: true, text: "Difficulty (ELO)" },
        grid: { display: false },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Accuracy (%)" },
        min: 0,
        max: 100,
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: { display: true, text: "Time Taken (s)" },
        grid: { drawOnChartArea: false },
        beginAtZero: true,
      },
    },
  };

  return (
    <>
      <Nav />
      <DashboardStyle>
        {/* Header Section */}
        <PageHeader>
          <h1>My Analytics</h1>
          <p>Track your performance and review past modules.</p>
        </PageHeader>

        {/* Primary Activity Chart */}
        <ChartWidget
          title="Daily Problem Attempts"
          subtitle="Your activity over the recent period"
          infoText="Shows the number of questions you attempted each day. Use this to track your consistency over time."
          headerAccessory={
            <AdminTabs
              tabs={[
                { id: "all", label: "All" },
                { id: "modules", label: "Modules" },
                { id: "marathons", label: "Marathons" },
              ]}
              activeTab={chartFilter}
              onChange={setChartFilter}
              layoutId="analyticsChartFilter"
              containerStyle={{ margin: 0 }}
              disableShortcuts={true}
            />
          }
          type="line"
          data={chartConfigData}
          options={chartOptions}
          isEmpty={!hasChartData}
          emptyMessage="Not enough data to display graph yet. Keep learning!"
          containerStyle={{ marginBottom: "30px" }}
        />

        {/* Secondary Behavioral Insights Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <ChartWidget
            title="Speed vs. Accuracy"
            subtitle="Evaluate if rushing impacts your correctness"
            infoText="Analyzes how your pacing affects your performance. Discover your sweet spot for optimal accuracy."
            type="line"
            data={speedAccConfigData}
            options={speedAccOptions}
            isEmpty={!hasSpeedAccData}
            emptyMessage="Complete more questions to generate pacing insights."
            containerStyle={{ marginBottom: 0 }}
          />

          <ChartWidget
            title="Performance by Format"
            subtitle="Accuracy breakdown by question type"
            infoText="Breaks down your accuracy by question type. Use this to identify formatting structures you struggle with."
            type="radar"
            data={formatConfigData}
            options={formatOptions}
            isEmpty={!hasFormatData}
            emptyMessage="Not enough varied question data to display format comparison."
            containerStyle={{ marginBottom: 0 }}
          />
        </div>

        {/* Thematic Skill Mapping */}
        <ChartWidget
          title="Strengths & Weaknesses"
          subtitle="Accuracy breakdown by specific skills"
          infoText="Highlights specific thematic skills you are strong in (green) vs struggling with (red)."
          type="bar"
          data={skillsConfigData}
          options={skillsOptions}
          isEmpty={!hasSkillsData}
          emptyMessage="No specific skills tagged in your completed questions yet."
          containerStyle={{ marginBottom: "30px" }}
        />

        {/* Complexity/Difficulty Curve */}
        <ChartWidget
          title="The Difficulty Wall"
          subtitle="Accuracy and Time Taken across ELO ratings"
          infoText="A dual-axis chart showing how your accuracy and time taken fluctuate as question difficulty (ELO) increases."
          type="line"
          data={difficultyConfigData}
          options={difficultyOptions}
          isEmpty={!hasDifficultyData}
          emptyMessage="Complete more graded questions to map your difficulty curve."
          containerStyle={{ marginBottom: "30px" }}
        />

        {/* History List Filter Tabs - Unified AdminTabs */}
        <AdminTabs
          tabs={[
            { id: "modules", label: "Modules" },
            { id: "marathons", label: "Marathons" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          layoutId="analyticsHistoryFilter"
          containerStyle={{ margin: "0 auto 20px 0" }}
          disableShortcuts={true}
        />

        {/* History Result List */}
        <HistoryContainer>
          {activeTab === "modules" ? (
            history.length === 0 ? (
              <EmptyState
                message="No completed modules found yet. Start practicing to see your analytics!"
                icon={<LuHistory />}
              />
            ) : (
              history.map((module) => {
                return (
                  <div key={module.moduleId}>
                    <ModuleStatsCard
                      role="button"
                      tabIndex={0}
                      aria-label={`View analytics for ${module.moduleName}`}
                      onClick={() =>
                        navigate(`/analytics/${module.moduleId}`, {
                          state: { module },
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/analytics/${module.moduleId}`, {
                            state: { module },
                          });
                        }
                      }}
                    >
                      <ModuleHeader
                        style={{
                          borderBottom: "none",
                          paddingBottom: 0,
                          marginBottom: 0,
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "1.3rem",
                              color: "#222",
                            }}
                          >
                            {module.moduleName}
                          </h3>
                          <span style={{ fontSize: "0.95rem", color: "#666" }}>
                            {module.subject}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                          }}
                        >
                          <FaChevronRight color="#888" />
                        </div>
                      </ModuleHeader>

                      <StatsGrid>
                        <StatItem>
                          <FaBullseye style={{ color: "#e91e63" }} />
                          <div>
                            <div style={{ fontSize: "0.85rem", color: "#888" }}>
                              Avg Accuracy
                            </div>
                            <div className="value">
                              {module.averageAccuracy}%
                            </div>
                          </div>
                        </StatItem>
                        <StatItem>
                          <FaClock style={{ color: "#ff9800" }} />
                          <div>
                            <div style={{ fontSize: "0.85rem", color: "#888" }}>
                              Avg Time Taken
                            </div>
                            <div className="value">
                              {formatTime(module.averageTimeTaken)}
                            </div>
                          </div>
                        </StatItem>
                        <StatItem>
                          {module.status === "completed" ? (
                            <FaCheckCircle style={{ color: "#4caf50" }} />
                          ) : (
                            <FaSpinner style={{ color: "#2196f3" }} />
                          )}
                          <div>
                            <div style={{ fontSize: "0.85rem", color: "#888" }}>
                              Status
                            </div>
                            <div
                              className="value"
                              style={{ textTransform: "capitalize" }}
                            >
                              {(module.status ?? "unknown").replace("_", " ")}
                            </div>
                          </div>
                        </StatItem>
                      </StatsGrid>
                    </ModuleStatsCard>
                  </div>
                );
              })
            )
          ) : marathonHistory.length === 0 ? (
            <EmptyState
              message="No marathon sessions found yet. Take on a marathon to see your analytics!"
              icon={<FaRunning />}
            />
          ) : (
            marathonHistory.map((session) => {
              return (
                <div key={session.sessionId}>
                  <ModuleStatsCard as="div" $nonInteractive={true}>
                    <ModuleHeader
                      style={{
                        borderBottom: "none",
                        paddingBottom: 0,
                        marginBottom: 0,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "1.3rem",
                            color: "#222",
                          }}
                        >
                          {session.moduleName}
                        </h3>
                        <span style={{ fontSize: "0.95rem", color: "#666" }}>
                          {new Date(session.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </ModuleHeader>

                    <StatsGrid>
                      <StatItem>
                        <FaBullseye style={{ color: "#e91e63" }} />
                        <div>
                          <div style={{ fontSize: "0.85rem", color: "#888" }}>
                            Overall Accuracy
                          </div>
                          <div className="value">
                            {session.averageAccuracy}%
                          </div>
                        </div>
                      </StatItem>
                      <StatItem>
                        <FaClock style={{ color: "#ff9800" }} />
                        <div>
                          <div style={{ fontSize: "0.85rem", color: "#888" }}>
                            Avg Time Per Q
                          </div>
                          <div className="value">
                            {formatTime(session.averageTimeTaken)}
                          </div>
                        </div>
                      </StatItem>
                      <StatItem>
                        <FaCheckCircle style={{ color: "#4caf50" }} />
                        <div>
                          <div style={{ fontSize: "0.85rem", color: "#888" }}>
                            Total Attempted
                          </div>
                          <div className="value">
                            {session.questionsCount} Qs
                          </div>
                        </div>
                      </StatItem>
                    </StatsGrid>
                  </ModuleStatsCard>
                </div>
              );
            })
          )}
        </HistoryContainer>
      </DashboardStyle>
    </>
  );
}
