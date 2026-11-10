/**
 * FILE PURPOSE: A standardized landing/start page component for various quiz modules.
 * It displays the title, statistics, overall progress, and a prominent start button.
 *
 * DEPENDENCIES:
 * - Progress: Component to visualize module completion percentage.
 * - Splash: Loading state component.
 * - UniversalBackButton: Standardized back navigation.
 * - styled-components: For themed and responsive layout.
 *
 * EXPORTS:
 * - StartPage: Default export.
 *
 * INTERCONNECT:
 * - Consumed by ModuleStartPage.jsx and MarathonStartPage.jsx.
 * - Adapts its theme (colors/gradients) based on the specific module context.
 */

import styled from "styled-components";
import { HiChevronRight } from "react-icons/hi";
import { Font } from "../../styles/Font.style";
import Progress from "../Progress";
import SplashPage from "../../pages/SplashPage";
import UniversalBackButton from "./UniversalBackButton";

// --- Styled Components (Themed and Responsive) ---

const Container = styled.div`
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 30px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: ${(props) =>
      props.$gradient || "linear-gradient(90deg, #ff9800, #ff3f80)"};
  }

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin: 40px 0;
`;

const StatBox = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StartButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 30px auto 10px;
  padding: 10px;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StyledProgress = styled(Progress)`
  width: 100%;
  margin: 10px 0;
  height: 12px;
  background-color: #eee;

  > div {
    background: ${(props) =>
      props.$gradient || "linear-gradient(90deg, #ff9800, #ff3f80)"};
  }
`;

const TitleText = styled(Font)`
  margin-top: 40px;
  margin-bottom: 20px;
  display: block;
`;

const SubtitleText = styled.p`
  color: #666;
  font-size: 18px;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const ProgressContainer = styled.div`
  max-width: 300px;
  margin: 0 auto 30px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const StartLabelText = styled(Font)`
  display: block;
  margin: auto;
  height: -moz-fit-content;
  height: fit-content;
`;

const ChevronIcon = styled(HiChevronRight)`
  margin: auto;
  height: -moz-fit-content;
  height: fit-content;
  opacity: 0.8;
`;

// --- Main Component ---

const StartPage = ({
  title,
  subtitle,
  stats = [], // Array of { label, value, color }
  progress = null, // Number (0-100) or null/undefined if not used
  onStart,
  onBack,
  startLabel = "Start",
  theme = {}, // { gradient, primary, secondary, hoverBg }
  loading = false,
}) => {
  // 1. Display splash screen if the module data is still loading
  if (loading) return <SplashPage />;

  const {
    gradient = "linear-gradient(90deg, #ff9800, #ff3f80)", // Default Orange/Pink (Module)
    primary = "#ff3f80",
  } = theme;

  return (
    <Container>
      <Card $gradient={gradient}>
        {/* Navigation back to the dashboard/previous list */}
        <UniversalBackButton
          variant="hero"
          onClick={onBack}
          theme={theme}
          text="Back"
        />

        <TitleText
          $size="36px"
          $weight="bold"
          $color="#333"
          $gradient={gradient}
        >
          {title}
        </TitleText>

        {subtitle && <SubtitleText>{subtitle}</SubtitleText>}

        {/* Dynamic statistics display (e.g. Best Score, Questions, Time) */}
        {stats && stats.length > 0 && (
          <StatGrid>
            {stats.map((stat, index) => (
              <StatBox key={index}>
                <Font
                  $size="24px"
                  $weight="bold"
                  $color={stat.color || primary}
                >
                  {stat.value}
                </Font>
                <Font $size="14px" $color="#666">
                  {stat.label}
                </Font>
              </StatBox>
            ))}
          </StatGrid>
        )}

        {/* Progress Section: Visualizes user's current advancement in the module */}
        {progress !== null && progress !== undefined && (
          <ProgressContainer>
            <ProgressHeader>
              <Font $size="14px" $color="#666">
                Overall Progress
              </Font>
              <Font $size="14px" $color="#666">
                {Math.round(progress)}%
              </Font>
            </ProgressHeader>
            <StyledProgress progress={progress} $gradient={gradient} />
          </ProgressContainer>
        )}

        {/* Primary action button to begin the quiz/session */}
        <StartButton onClick={onStart}>
          <StartLabelText
            $name="Made"
            $color={primary}
            $gradient={gradient}
            $size="25px"
          >
            {startLabel}
          </StartLabelText>
          <ChevronIcon size={35} fill={primary} />
        </StartButton>
      </Card>
    </Container>
  );
};

export default StartPage;
