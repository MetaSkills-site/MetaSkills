/**
 * @file ModuleHistoryPage.jsx
 * @description Detailed review and outcome inspection page for a completed learning module session.
 * @architecture Mounted at `/module-history`, rendered with Nav and ChartWidget, displaying question breakdowns via QuestionBlock.
 * @agent_note Requires module session state passed via `location.state.module` and automatically redirects back to `/analytics` if state is missing.
 */

import { useLocation, Navigate } from "react-router-dom";
import styled from "styled-components";
import Nav from "../components/Nav/Nav";
import {
  HistoryContainer,
  ModuleSection,
  ModuleHeader,
  StatusBadge,
  QuestionItem,
  MetaInfo,
  CorrectAnswerDisplay,
} from "./admin/UserHistoryPage";
import { HomeIcon } from "../components/admin/AdminStyles";
import QuestionBlock from "../components/QuestionBlock";
import { Font } from "../styles/Font.style";
import ChartWidget from "../components/ChartWidget";

// --- Styled Components ---

const StatsRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const StatCard = styled.div`
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
`;

const CarrotsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
`;

const TotalCarrots = styled.div`
  font-size: 3.5rem;
  font-weight: 800;
  color: #ff9800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;

  & span {
    font-size: 2.5rem;
  }
`;

const BreakdownRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  color: #666;
  font-size: 0.95rem;

  & span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

const DashboardStyle = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
`;

/**
 * formatTime: Converts seconds to human-readable format.
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

/**
 * Module history review page component displaying attempt statistics, donut charts, and read-only question reviews.
 * @component
 * @returns {JSX.Element}
 */
export default function ModuleHistoryPage() {
  const location = useLocation();
  const module = location.state?.module;

  // --- Redirect Logic ---
  if (!module) {
    // Prevent direct URL access: module data is expected from navigation state.
    return <Navigate to="/analytics" replace />;
  }

  const { questions, totalQuestions } = module;

  // --- Statistic Calculations ---
  const correctCount = questions.filter(
    (q) => q.isCorrect === 100 || q.isCorrect === true,
  ).length;

  const wrongCount = questions.filter(
    (q) =>
      q.isCorrect !== 100 && q.isCorrect !== true && q.isCorrect !== undefined,
  ).length;

  const unattemptedCount = Math.max(
    0,
    (totalQuestions || questions.length) - questions.length,
  );

  // --- Chart Configuration: Results Breakdown (Doughnut) ---
  const chartData = {
    labels: ["Correct", "Wrong", "Unattempted"],
    datasets: [
      {
        data: [correctCount, wrongCount, unattemptedCount],
        backgroundColor: [
          "#4caf50", // Correct Green
          "#f44336", // Incorrect Red
          "#e0e0e0", // Unattempted Grey
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { padding: 20 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.label}: ${context.raw}`;
          },
        },
      },
    },
  };

  return (
    <>
      <Nav />
      <DashboardStyle>
        <HomeIcon path="/analytics" text="Back to Analytics" variant="link" />

        <HistoryContainer>
          <ModuleSection>
            {/* Module Metadata Header */}
            <ModuleHeader>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#222" }}>
                  {module.moduleName}
                </h3>
                <span style={{ fontSize: "0.95rem", color: "#666" }}>
                  {module.subject}
                </span>
              </div>
              <StatusBadge status={module.status ?? "unknown"}>
                {(module.status ?? "unknown").replace(/_/g, " ")}
              </StatusBadge>
            </ModuleHeader>

            {/* Performance Metric Row */}
            <StatsRow>
              {/* Carrot Earning Breakdown */}
              <StatCard>
                <CarrotsContainer>
                  <Font $size="1.2rem" $weight="600" $color="#555">
                    Carrots Earned
                  </Font>
                  <TotalCarrots>
                    +
                    {correctCount * 5 +
                      (module.status === "completed" ? 10 : 0)}{" "}
                    <span>🥕</span>
                  </TotalCarrots>
                  <BreakdownRow>
                    <span>
                      <strong>{correctCount * 5}</strong> from Questions
                    </span>
                    {module.status === "completed" && (
                      <span>
                        <strong>+10</strong> Completion Bonus
                      </span>
                    )}
                  </BreakdownRow>
                </CarrotsContainer>
              </StatCard>

              {/* Accuracy Chart */}
              <StatCard>
                <ChartWidget
                  type="doughnut"
                  data={chartData}
                  options={chartOptions}
                  height="200px"
                  containerStyle={{
                    padding: 0,
                    boxShadow: "none",
                    border: "none",
                    background: "transparent",
                    width: "100%",
                    marginBottom: 0,
                  }}
                />
              </StatCard>
            </StatsRow>

            {/* Detailed Question Review List */}
            {module.questions.length === 0 ? (
              <p
                style={{
                  color: "#888",
                  fontStyle: "italic",
                  padding: "20px 0",
                }}
              >
                No questions attempted in this module yet.
              </p>
            ) : (
              module.questions.map((q, idx) => (
                <QuestionItem
                  key={q.questionId || idx}
                  isCorrect={q.isCorrect}
                  style={{ marginBottom: "20px", marginTop: "20px" }}
                >
                  <div
                    style={{
                      marginBottom: "15px",
                      fontWeight: "bold",
                      color: "#555",
                      fontSize: "1.1em",
                    }}
                  >
                    Question {idx + 1}
                  </div>

                  {/* Read-only rendering of the question and user response */}
                  <QuestionBlock
                    question={{
                      slate: q.questionSlate,
                      answerType: q.answerType,
                      options: q.options,
                    }}
                    options={q.options}
                    selectedAnswer={q.userResponse}
                    readOnly={true}
                  />

                  {/* Metadata: Correctness, Time, Date */}
                  <MetaInfo>
                    <span>
                      <strong>Result:</strong>{" "}
                      {typeof q.isCorrect === "number"
                        ? `${Math.round(q.isCorrect)}%`
                        : q.isCorrect
                          ? "Correct"
                          : "Incorrect"}
                    </span>
                    <span>
                      <strong>Time:</strong> {formatTime(q.timeTaken)}
                    </span>
                    <span>
                      <strong>Date:</strong>{" "}
                      {q.attemptedAt &&
                      !isNaN(new Date(q.attemptedAt).getTime())
                        ? new Date(q.attemptedAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </MetaInfo>

                  {/* Correct answer fallback for failed attempts */}
                  {q.isCorrect !== 100 && q.isCorrect !== true && (
                    <CorrectAnswerDisplay>
                      Correct Answer: {q.correctAnswer}
                    </CorrectAnswerDisplay>
                  )}
                </QuestionItem>
              ))
            )}
          </ModuleSection>
        </HistoryContainer>
      </DashboardStyle>
    </>
  );
}
