/**
 * @file ModuleCompleted.jsx
 * @description Celebratory completion screen summarizing module performance, calculating carrot rewards, and triggering confetti.
 * @architecture Module lifecycle completion view mounted when all questions in a module have been answered.
 * @agent_note Queries module progress via TanStack Query to ensure accurate breakdown of question rewards and completion bonuses.
 */

/**
 * FILE PURPOSE: ModuleCompleted — The visual and logical climax of a learning module attempt.
 *
 * ROLE:
 * Celebrates the completion of a module. It calculates and displays the gamified
 * carrot rewards (Correct Answers + Completion Bonus) and provides a summary
 * of the user's performance before returning them to the module list.
 *
 * DEPENDENCIES:
 * - TanStack Query: Fetches fresh progress data to ensure reward calculation is accurate.
 * - SessionContext: Provides user credentials and current carrot balance.
 * - styled-components: For themed cards, tooltips, and reward equation layout.
 * - react-icons: Visual status indicators (checkmark).
 * - Confetti: Visual celebration effect.
 *
 * EXPORTS:
 * - ModuleCompleted (default): The functional component rendering the celebration UI.
 *
 * INTERCONNECTIONS:
 * - Triggered by the Quiz controller when all questions in a module have been answered.
 */
import styled from "styled-components";
import { useNavigate, useParams } from "react-router-dom";
import { Font } from "../styles/Font.style";
import { HiCheckCircle } from "react-icons/hi";
import { useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SessionContext } from "../context/SessionProvider";
import Confetti from "./common/Confetti";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";

/* ─── Styled Components ─── */

const Container = styled.div`
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Card = styled.div`
  background: white;
  border-radius: 30px;
  padding: 60px 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  text-align: center;
  position: relative;
  overflow: hidden;
  width: 100%;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #4caf50, #8bc34a);
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-primary);
  font-weight: bold;
  border-radius: 10px;
  padding: 12px 30px;
  font-size: 16px;
  letter-spacing: 0.6px;
  width: -moz-fit-content;
  width: fit-content;
  margin: 30px auto 0;
  background: linear-gradient(45deg, #4caf50, #8bc34a);
  color: #fff;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(0);
  }
`;

const EquationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 2rem;
  flex-wrap: wrap;
`;

const CarrotValue = styled.span`
  color: ${(props) => props.color || "#333"};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  position: relative;
  cursor: help;

  /* Tooltip logic for reward breakdown */
  &:hover::after {
    content: attr(data-label);
    position: absolute;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    animation: tooltipFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    pointer-events: none;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;

/* ─── Main Component ─── */

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {string} [props.subject] - Academic subject identifier used for return navigation fallback.
 * @returns {JSX.Element} The rendered module completion celebration card with reward breakdown.
 */
function ModuleCompleted({ subject }) {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const { user, updateUser } = useContext(SessionContext);

  /**
   * carrotStats Query
   * Fetches module progress and gamification configuration (multipliers/bonuses).
   * Calculates the breakdown of rewards based on actual performance.
   */
  const { data: carrotStats } = useQuery({
    queryKey: ["modules-progress-completed", user?.id, moduleId],
    enabled: !!user && !!moduleId,
    queryFn: async () => {
      const res = await apiClient.post(API_ENDPOINTS.getModulesProgress.url, {
        userId: user.id,
      });
      const json = res.data;
      if (!json.success) return null;

      const foundModule = json.data.find((m) => m._id === moduleId);
      if (!foundModule) return null;

      // REWARD CALCULATION LOGIC:
      // — For MCQ/SA: questions = correctCount × stdAward (binary, unchanged).
      // — For FIB: questions = sum of proportional awards (e.g. 75% accuracy = 4/5 carrots).
      // We use backend-computed totalCarrotsForQuestions which mirrors the exact
      // awarding formula in submitAnswer, so display always matches reality.
      const stdAward = json.gamification?.STD_QUESTION_AWARD || 5;
      const modAward = json.gamification?.MODULE_COMPLETION_AWARD || 50;
      const correctCount = foundModule.correctQuestionsCount || 0;
      // The actual total carrots earned from questions (proportional for FIB)
      const totalCarrotsForQuestions =
        foundModule.totalCarrotsForQuestions ?? correctCount * stdAward;

      // SOURCE OF TRUTH: server-computed latest value from DB
      const latestCarrots = json.carrots || user.carrots;
      const currentTotal =
        typeof latestCarrots === "object"
          ? latestCarrots.count || 0
          : latestCarrots || 0;

      const totalEarnedInModule = totalCarrotsForQuestions + modAward;

      return {
        fetchedSubject: foundModule.subject,
        previous: Math.max(0, currentTotal - totalEarnedInModule),
        questions: totalCarrotsForQuestions,
        bonus: modAward,
        correctCount,
        totalAnswered: foundModule.totalQuestions || 0,
        stdAward,
        carrots: json.carrots,
      };
    },
  });

  useEffect(() => {
    if (carrotStats?.carrots !== undefined && carrotStats?.carrots !== null) {
      updateUser({ carrots: carrotStats.carrots });
    }
  }, [carrotStats?.carrots, updateUser]);

  // subject prop takes priority; fall back to what the query resolved from DB
  const targetSubject = subject || carrotStats?.fetchedSubject;

  const totalEarnedInModule = carrotStats
    ? carrotStats.questions + carrotStats.bonus
    : 0;

  // SOURCE OF TRUTH: server-computed previous value is preferred over client's potentially stale context.
  const displayPrevious = carrotStats?.previous ?? 0;

  return (
    <Container>
      <Card>
        <HiCheckCircle
          size={80}
          color="#4caf50"
          style={{ marginBottom: "20px" }}
        />

        <Font
          $size="32px"
          $weight="bold"
          $color="#333"
          style={{ marginBottom: "10px", display: "block" }}
        >
          Module Completed!
        </Font>

        <Font
          $size="16px"
          $color="#666"
          style={{ marginBottom: "30px", display: "block" }}
        >
          Great job! You have answered all questions in this module (
          <span style={{ fontWeight: "bold" }}>
            {carrotStats?.correctCount || 0}
          </span>
          {" fully correct"}
          {carrotStats?.totalAnswered > 0 &&
            carrotStats.totalAnswered !== carrotStats.correctCount && (
              <span style={{ color: "#ff9800" }}>
                {" "}
                out of {carrotStats.totalAnswered}
              </span>
            )}
          ).
        </Font>

        {/* ─── Reward Equation View ─── */}
        {carrotStats && (
          <div>
            <div
              style={{ fontSize: "1rem", color: "#888", marginBottom: "10px" }}
            >
              Carrots Earned
            </div>
            <EquationContainer>
              {/* Part 1: Starting Balance */}
              <CarrotValue color="#757575" data-label="Previous Total">
                {displayPrevious}
              </CarrotValue>

              <span style={{ color: "#ccc" }}>+</span>

              {/* Part 2: Question Performance Reward */}
              <CarrotValue
                color="#2196f3"
                data-label={`Question performance (${carrotStats.correctCount} fully correct)`}
              >
                {carrotStats.questions}
              </CarrotValue>

              <span style={{ color: "#ccc" }}>+</span>

              {/* Part 3: Fixed Module Completion Bonus */}
              <CarrotValue color="#ff9800" data-label="Module Completion Bonus">
                {carrotStats.bonus}
              </CarrotValue>

              <span style={{ color: "#ccc" }}>=</span>

              {/* Result: Final Grand Total */}
              <CarrotValue
                color="#4caf50"
                data-label="New Total"
                style={{ fontSize: "2.4rem" }}
              >
                {displayPrevious + totalEarnedInModule} 🥕
              </CarrotValue>
            </EquationContainer>
          </div>
        )}

        <Button
          onClick={() =>
            targetSubject ? navigate(`/modules/${targetSubject}`) : navigate(-1)
          }
        >
          {targetSubject ? "Back to modules" : "Go Back"}
        </Button>
      </Card>

      {/* ─── Celebration Effects ─── */}
      <Confetti trigger={!!carrotStats} />
    </Container>
  );
}

export default ModuleCompleted;
