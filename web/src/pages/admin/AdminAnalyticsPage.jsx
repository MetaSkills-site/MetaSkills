/**
 * @file AdminAnalyticsPage.jsx
 * @description Comprehensive administrative analytics dashboard displaying platform metrics, student engagement trends, and curriculum statistics.
 * @architecture Mounted within the admin routing tree, consumes getDashboardAnalytics from adminService via TanStack Query and visualizes metrics using ChartWidget.
 * @agent_note Queries computationally intensive dashboard data with a 5-minute cache time and requires administrative privileges.
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { getDashboardAnalytics } from "../../services/adminService";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaBook,
  FaQuestionCircle,
  FaChartLine,
  FaExternalLinkAlt,
  FaLanguage,
  FaAlignLeft,
  FaFileAlt,
  FaPaperclip,
} from "react-icons/fa";
import ChartWidget from "../../components/ChartWidget";

import { Wrapper, PageContainer } from "../../components/admin/AdminStyles.jsx";
import AdminHeader from "../../components/admin/AdminHeader";
import { SkeletonRect } from "../../components/SkeletonLoader";

/**
 * AnalyticsContainer
 * Provides a scoped theme via CSS variables for consistent styling of analytic components.
 */
const AnalyticsContainer = styled.div`
  /* Color Tokens */
  --bg-card: #fff;
  --border-card: #eaeaea;
  --border-light: #f0f0f0;
  --bg-table-header: #fafafa;
  --text-primary: #333;
  --text-secondary: #666;
  --text-muted: #999;
  --icon-primary: #1967d2;
  --icon-bg: #e8f0fe;
  --link-color: #ccc;

  /* Badge Colors (Difficulty Levels) */
  --badge-bg-green: #e8f5e9;
  --badge-text-green: #2e7d32;
  --badge-bg-orange: #fff3e0;
  --badge-text-orange: #ef6c00;
  --badge-bg-red: #ffebee;
  --badge-text-red: #c62828;
  --badge-bg-darkred: #fce4ec;
  --badge-text-darkred: #ad1457;

  /* Spacing and Layout Tokens */
  --radius-md: 12px;
  --spacing-md: 15px;
  --spacing-lg: 20px;
  --spacing-xl: 24px;
  --icon-size: 48px;
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
`;

/**
 * ExternalLinkBtn
 * Utility button positioned in corners of stat cards for deep linking to managed resources.
 */
const ExternalLinkBtn = styled(Link)`
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  color: var(--link-color);
`;

const StatCard = styled.div`
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-card);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  svg {
    font-size: 2rem;
    color: var(--icon-primary);
    background: var(--icon-bg);
    padding: 12px;
    border-radius: var(--radius-md);
    width: var(--icon-size);
    height: var(--icon-size);
  }
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;

  .label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 5px;
  }

  .value {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--text-primary);
  }
`;

const TableContainer = styled.div`
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-card);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--text-primary);
  }
`;

const VocabTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid var(--border-light);
  }

  th {
    font-weight: 600;
    color: var(--text-secondary);
    background-color: var(--bg-table-header);
  }

  tr:last-child td {
    border-bottom: none;
  }

  td {
    color: var(--text-primary);
  }
`;

/**
 * DifficultyBadge
 * Dynamic badge that changes color based on accuracy scores or difficulty ratings.
 */
const DifficultyBadge = styled.span`
  background: ${(props) => {
    if (props.$score <= 35) return "var(--badge-bg-green)";
    if (props.$score <= 60) return "var(--badge-bg-orange)";
    if (props.$score <= 80) return "var(--badge-bg-red)";
    return "var(--badge-bg-darkred)";
  }};
  color: ${(props) => {
    if (props.$score <= 35) return "var(--badge-text-green)";
    if (props.$score <= 60) return "var(--badge-text-orange)";
    if (props.$score <= 80) return "var(--badge-text-red)";
    return "var(--badge-text-darkred)";
  }};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
  min-width: 40px;
  text-align: center;
`;

/**
 * Administrative platform analytics page component aggregating system-wide engagement, difficulty, and curriculum metrics.
 * @component
 * @returns {JSX.Element}
 */
export default function AdminAnalyticsPage() {
  /**
   * Data Fetching:
   * A single optimized query for all analytic endpoints.
   * Internal logic in getDashboardAnalytics uses Promise.allSettled to parallelize requests.
   */
  const {
    data: analyticsData,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: () => getDashboardAnalytics(),
    staleTime: 5 * 60_000, // AnalyticsPage are computationally expensive — cache for 5 minutes
  });

  // Safe destructuring with fallback defaults to ensure stable chart mapping
  const globalStats = analyticsData?.globalStats ?? null;
  const engagementTrends = analyticsData?.engagementTrends ?? [];
  const misfitQuestions = analyticsData?.misfitQuestions ?? [];
  const challengingModules = analyticsData?.challengingModules ?? [];
  const formatStats = analyticsData?.formatStats ?? [];
  const gradeStats = analyticsData?.gradeStats ?? [];
  const speedStats = analyticsData?.speedStats ?? [];
  const vocabStats = analyticsData?.vocabStats ?? null;

  // Global error notifications for connectivity/auth issues
  useEffect(() => {
    if (isError) {
      toast.error(
        `Failed to load analytics${error?.message ? `: ${error.message}` : ""}.`,
      );
    }
  }, [isError, error]);

  // Partial error notifications (when some endpoints fail but others succeed)
  useEffect(() => {
    if (analyticsData?.hasErrors) {
      toast.error("Some analytics data failed to load.", {
        id: "partial-analytics-error",
      });
    }
  }, [analyticsData?.hasErrors]);

  null;

  // --- Chart Configurations ---

  /**
   * 1. Engagement Trends (Line Chart)
   * Tracks daily response volume over a rolling 30-day window.
   */
  const engagementConfig = {
    labels: engagementTrends.map((t) => t.date),
    datasets: [
      {
        fill: true,
        label: "Responses",
        data: engagementTrends.map((t) => t.count),
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        tension: 0.4,
        pointBackgroundColor: "#007bff",
        pointRadius: 4,
      },
    ],
  };

  /**
   * 2. Misfit Questions (Scatter Chart)
   * Correlates ELO rating (expected difficulty) with actual accuracy.
   * Outliers represent questions that may be poorly calibrated.
   */
  const misfitConfig = {
    datasets: [
      {
        label: "Questions",
        data: misfitQuestions.map((m) => ({
          x: m.rating,
          y: m.averageAccuracy,
        })),
        backgroundColor: "rgba(233, 30, 99, 0.6)",
        borderColor: "#e91e63",
        pointRadius: 6,
      },
    ],
  };
  const misfitOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: "ELO Rating (Difficulty)" } },
      y: {
        title: { display: true, text: "Average Accuracy (%)" },
        min: 0,
        max: 100,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `ELO: ${ctx.parsed.x}, Acc: ${ctx.parsed.y.toFixed(1)}%`,
        },
      },
    },
  };

  /**
   * 3. Challenging Modules (Horizontal Bar Chart)
   * Identifies modules where students are struggling the most (lowest accuracy).
   */
  const challengingConfig = {
    labels: challengingModules.map((m) => m.moduleName),
    datasets: [
      {
        label: "Average Accuracy (%)",
        data: challengingModules.map((m) => m.averageAccuracy),
        backgroundColor: "#ff9800",
        borderRadius: 4,
      },
    ],
  };

  /**
   * 4. Format Effectiveness (Doughnut Chart)
   * Breaks down accuracy by answer format (MCQ, Fill-in-the-blank, etc.) to
   * detect format-specific cognitive friction.
   */
  const formatPalette = [
    "#4caf50",
    "#2196f3",
    "#ffc107",
    "#e91e63",
    "#9c27b0",
    "#00bcd4",
    "#ff9800",
    "#607d8b",
  ];
  const formatConfig = {
    labels: formatStats.map((f) => f.answerType),
    datasets: [
      {
        data: formatStats.map((f) => f.averageAccuracy),
        backgroundColor: formatStats.map(
          (_, i) => formatPalette[i % formatPalette.length],
        ),
      },
    ],
  };

  /**
   * 5. Grade Competency (Grouped Bar Chart)
   * Comparison of English vs Maths performance across different grade levels.
   */
  const grades = [...new Set(gradeStats.map((g) => `Grade ${g.grade}`))].sort(
    (a, b) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]),
  );
  const englishData = grades.map((g) => {
    const gradeNum = parseInt(g.split(" ")[1]);
    const stat = gradeStats.find(
      (s) => s.grade === gradeNum && s.subject === "english",
    );
    return stat ? stat.averageAccuracy : 0;
  });
  const mathsData = grades.map((g) => {
    const gradeNum = parseInt(g.split(" ")[1]);
    const stat = gradeStats.find(
      (s) => s.grade === gradeNum && s.subject === "maths",
    );
    return stat ? stat.averageAccuracy : 0;
  });

  const gradeCompetencyConfig = {
    labels: grades,
    datasets: [
      {
        label: "English",
        data: englishData,
        backgroundColor: "#9c27b0",
      },
      {
        label: "Maths",
        data: mathsData,
        backgroundColor: "#00bcd4",
      },
    ],
  };

  /**
   * 6. Speed vs Comprehension (Bubble Chart)
   * Visualizes clusters of student cohorts. Bubble size represents cohort size.
   * Helps identify "Fast & Precise" vs "Slow & Precise" learners.
   */
  const speedConfig = {
    datasets: [
      {
        label: "Student Cohorts",
        data: speedStats.map((s) => ({
          x: s.averageTimeTaken,
          y: s.averageAccuracy,
          r: Math.max(5, Math.min(s.userCount * 2, 25)),
        })),
        backgroundColor: "rgba(76, 175, 80, 0.6)",
        borderColor: "#4caf50",
      },
    ],
  };
  const speedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: "Avg Time Taken (seconds)" } },
      y: {
        title: { display: true, text: "Avg Accuracy (%)" },
        min: 0,
        max: 100,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `Time: ${ctx.parsed.x.toFixed(0)}s, Acc: ${ctx.parsed.y.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <Wrapper>
      <AnalyticsContainer>
        <PageContainer>
          <AdminHeader title="Platform Analytics" backPath="/admin" />

          {loading ? (
            /* Loading State: Comprehensive skeleton structure */
            <div style={{ padding: "20px" }}>
              <StatsGrid>
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonRect key={i} $height="90px" $width="100%" />
                ))}
              </StatsGrid>
              <SkeletonRect $height="350px" $width="100%" $mb="30px" />
              <SkeletonGrid>
                <SkeletonRect $height="350px" $width="100%" />
                <SkeletonRect $height="350px" $width="100%" />
                <SkeletonRect $height="350px" $width="100%" />
                <SkeletonRect $height="350px" $width="100%" />
              </SkeletonGrid>
            </div>
          ) : (
            <>
              {/* Top-level global statistics counters */}
              {globalStats && (
                <StatsGrid>
                  <div style={{ position: "relative" }}>
                    <StatCard>
                      <FaUsers />
                      <StatInfo>
                        <span className="label">Total Users</span>
                        <span className="value">{globalStats.totalUsers}</span>
                      </StatInfo>
                    </StatCard>
                    <ExternalLinkBtn
                      to="/admin/viewUsers"
                      aria-label="Open Total Users"
                    >
                      <FaExternalLinkAlt size={14} />
                    </ExternalLinkBtn>
                  </div>
                  <div style={{ position: "relative" }}>
                    <StatCard>
                      <FaBook />
                      <StatInfo>
                        <span className="label">Total Modules</span>
                        <span className="value">
                          {globalStats.totalModules}
                        </span>
                      </StatInfo>
                    </StatCard>
                    <ExternalLinkBtn
                      to="/admin/modules"
                      aria-label="Open Total Modules"
                    >
                      <FaExternalLinkAlt size={14} />
                    </ExternalLinkBtn>
                  </div>
                  <div style={{ position: "relative" }}>
                    <StatCard>
                      <FaQuestionCircle />
                      <StatInfo>
                        <span className="label">Total Questions</span>
                        <span className="value">
                          {globalStats.totalQuestions}
                        </span>
                      </StatInfo>
                    </StatCard>
                    <ExternalLinkBtn
                      to="/admin/all-questions"
                      aria-label="Open Total Questions"
                    >
                      <FaExternalLinkAlt size={14} />
                    </ExternalLinkBtn>
                  </div>
                  <StatCard>
                    <FaChartLine />
                    <StatInfo>
                      <span className="label">Total Responses</span>
                      <span className="value">
                        {globalStats.totalResponses}
                      </span>
                    </StatInfo>
                  </StatCard>
                </StatsGrid>
              )}

              {/* Secondary content statistics (Marathon components) */}
              {globalStats && (
                <StatsGrid>
                  <div style={{ position: "relative" }}>
                    <StatCard>
                      <FaLanguage />
                      <StatInfo>
                        <span className="label">Total Vocabularies</span>
                        <span className="value">
                          {globalStats.totalVocabularies}
                        </span>
                      </StatInfo>
                    </StatCard>
                    <ExternalLinkBtn
                      to="/admin/view-passages?tab=vocabulary"
                      aria-label="Open Total Vocabularies"
                    >
                      <FaExternalLinkAlt size={14} />
                    </ExternalLinkBtn>
                  </div>
                  <div style={{ position: "relative" }}>
                    <StatCard>
                      <FaAlignLeft />
                      <StatInfo>
                        <span className="label">Total Sentences</span>
                        <span className="value">
                          {globalStats.totalSentences}
                        </span>
                      </StatInfo>
                    </StatCard>
                    <ExternalLinkBtn
                      to="/admin/view-passages?tab=sentences"
                      aria-label="Open Total Sentences"
                    >
                      <FaExternalLinkAlt size={14} />
                    </ExternalLinkBtn>
                  </div>
                  <div style={{ position: "relative" }}>
                    <StatCard>
                      <FaFileAlt />
                      <StatInfo>
                        <span className="label">Total Passages</span>
                        <span className="value">
                          {globalStats.totalPassages}
                        </span>
                      </StatInfo>
                    </StatCard>
                    <ExternalLinkBtn
                      to="/admin/view-passages?tab=passages"
                      aria-label="Open Total Passages"
                    >
                      <FaExternalLinkAlt size={14} />
                    </ExternalLinkBtn>
                  </div>
                  <div style={{ position: "relative" }}>
                    <StatCard>
                      <FaPaperclip />
                      <StatInfo>
                        <span className="label">Context Attachments</span>
                        <span className="value">
                          {globalStats.totalContextAttachments}
                        </span>
                      </StatInfo>
                    </StatCard>
                    <ExternalLinkBtn
                      to="/admin/context-attachments"
                      aria-label="Open Context Attachments"
                    >
                      <FaExternalLinkAlt size={14} />
                    </ExternalLinkBtn>
                  </div>
                </StatsGrid>
              )}

              {/* Large trend chart: platform engagement over time */}
              <ChartWidget
                title="Platform Engagement Trends"
                subtitle="Daily response counts over the last 30 days"
                infoText="Tracks daily response volume over the last 30 days. Used to assess overall platform engagement and activity spikes."
                type="line"
                data={engagementConfig}
                isEmpty={engagementTrends.length === 0}
                emptyMessage="Not enough data"
                height="350px"
                containerStyle={{ marginBottom: "30px" }}
              />

              {/* Grid of specialized analytic widgets */}
              <ChartGrid>
                <ChartWidget
                  title="Misfit Questions"
                  subtitle="Accuracy vs. ELO Rating (Identify poorly calibrated questions)"
                  infoText="Plots average accuracy against the ELO difficulty rating to identify poorly calibrated questions."
                  type="scatter"
                  data={misfitConfig}
                  options={misfitOptions}
                  isEmpty={misfitQuestions.length === 0}
                  emptyMessage="Not enough data"
                  height="350px"
                  containerStyle={{ marginBottom: 0 }}
                />

                <ChartWidget
                  title="Speed vs. Comprehension"
                  subtitle="Cohort performance clusters based on time and accuracy"
                  infoText="Clusters students based on their average time taken vs. accuracy. Helps identify common pacing archetypes."
                  type="bubble"
                  data={speedConfig}
                  options={speedOptions}
                  isEmpty={speedStats.length === 0}
                  emptyMessage="Not enough data"
                  height="350px"
                  containerStyle={{ marginBottom: 0 }}
                />

                <ChartWidget
                  title="Grade Competency"
                  subtitle="Average accuracy across grade levels by subject"
                  infoText="Displays the average accuracy for English and Maths, grouped by active student grade levels."
                  type="bar"
                  data={gradeCompetencyConfig}
                  options={{
                    scales: {
                      x: { title: { display: true, text: "Grades" } },
                      y: {
                        max: 100,
                        title: { display: true, text: "Accuracy (%)" },
                      },
                    },
                  }}
                  isEmpty={gradeStats.length === 0}
                  emptyMessage="Not enough data"
                  height="350px"
                  containerStyle={{ marginBottom: 0, gridColumn: "1 / -1" }}
                />

                <ChartWidget
                  title="Challenging Modules"
                  subtitle="Top modules with the lowest average accuracy"
                  infoText="Highlights the top 10 modules with the lowest average accuracy to identify curriculum gaps."
                  type="bar"
                  data={challengingConfig}
                  options={{
                    indexAxis: "y",
                    scales: {
                      x: {
                        max: 100,
                        title: { display: true, text: "Accuracy (%)" },
                      },
                    },
                  }}
                  isEmpty={challengingModules.length === 0}
                  emptyMessage="Not enough data"
                  height="350px"
                  containerStyle={{ marginBottom: 0 }}
                />

                <ChartWidget
                  title="Format Effectiveness"
                  subtitle="Accuracy based on question type"
                  infoText="Breaks down overall accuracy based on question format to identify systemic UI or cognitive friction."
                  type="doughnut"
                  data={formatConfig}
                  options={{ plugins: { legend: { position: "right" } } }}
                  isEmpty={formatStats.length === 0}
                  emptyMessage="Not enough data"
                  height="300px"
                  containerStyle={{ marginBottom: 0 }}
                />

                {/* Vocabulary Performance Tables */}
                {vocabStats && (
                  <>
                    <TableContainer>
                      <h3>Top 10 Most Difficult Words</h3>
                      <VocabTable>
                        <thead>
                          <tr>
                            <th>Word</th>
                            <th>Difficulty Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vocabStats.topDifficult?.length > 0 ? (
                            vocabStats.topDifficult.map((v) => (
                              <tr key={v._id}>
                                <td>{v.word}</td>
                                <td>
                                  <DifficultyBadge $score={v.displayDifficulty}>
                                    {v.displayDifficulty}
                                  </DifficultyBadge>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="2"
                                style={{
                                  textAlign: "center",
                                  color: "var(--text-muted)",
                                }}
                              >
                                No data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </VocabTable>
                    </TableContainer>

                    <TableContainer>
                      <h3>Top 10 Easiest Words</h3>
                      <VocabTable>
                        <thead>
                          <tr>
                            <th>Word</th>
                            <th>Difficulty Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vocabStats.topEasiest?.length > 0 ? (
                            vocabStats.topEasiest.map((v) => (
                              <tr key={v._id}>
                                <td>{v.word}</td>
                                <td>
                                  <DifficultyBadge $score={v.displayDifficulty}>
                                    {v.displayDifficulty}
                                  </DifficultyBadge>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="2"
                                style={{
                                  textAlign: "center",
                                  color: "var(--text-muted)",
                                }}
                              >
                                No data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </VocabTable>
                    </TableContainer>
                  </>
                )}
              </ChartGrid>
            </>
          )}
        </PageContainer>
      </AnalyticsContainer>
    </Wrapper>
  );
}
