/**
 * @file CustomStepper.jsx
 * @description A reusable multi-step progress indicator and navigation component designed for admin workflows.
 *
 * Dependencies:
 * - styled-components: For dynamic, prop-based styling of circles, titles, and progress bars.
 * - react-icons: Visual indicators for completion (checkmark) and navigation (arrows).
 * - Tooltip & InfoTooltip: Provides context-sensitive help for keyboard shortcuts.
 * - useStepperShortcuts: Custom hook for managing keyboard-based navigation (Alt + . / Alt + Backspace).
 *
 * Exports:
 * - CustomStepper (default): The main functional component for the stepper UI.
 *
 * Interconnections:
 * - Frequently used in AddQuestions.jsx to manage the question creation wizard.
 */

import styled from "styled-components";
import { IoCheckmark } from "react-icons/io5";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { NavIcon } from "./AdminStyles.jsx";
import Tooltip from "../Tooltip";
import { Kbd } from "../InfoTooltip";
import useStepperShortcuts from "../../hooks/event-hooks/useStepperShortcuts";

/**
 * Main container for the stepper, ensuring proper alignment of navigation and progress items.
 */
const StepperContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
`;

/**
 * Wrapper for an individual step, centering the circle and title vertically.
 */
const StepWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
`;

/**
 * The circular indicator for each step, colored based on its active/complete status.
 */
const StepCircle = styled.div`
  width: ${(props) => props.$size || 20}px;
  height: ${(props) => props.$size || 20}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.$fontSize || 10}px;
  font-weight: 600;
  background-color: ${(props) => {
    if (props.$isComplete || props.$isActive) {
      return props.$activeColor || "#f3522eff";
    }
    return "#e0e0e0";
  }};
  color: ${(props) => {
    if (props.$isComplete || props.$isActive) {
      return "#fff";
    }
    return "#999";
  }};
  transition: all 0.3s ease;
  z-index: 2;
  position: relative;
`;

/**
 * Text label displayed below each step circle.
 */
const StepTitle = styled.div`
  margin-top: 8px;
  font-size: ${(props) => props.$fontSize || 14}px;
  color: ${(props) => {
    if (props.$isComplete || props.$isActive) {
      return props.$activeColor || "#f3522eff";
    }
    return "#999";
  }};
  text-align: center;
  transition: color 0.3s ease;
  font-weight: ${(props) => (props.$isActive ? "600" : "400")};
`;

/**
 * Container for the progress bar line between steps.
 */
const ProgressBarContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 8px;
  position: relative;
`;

/**
 * The actual horizontal line connecting steps, showing completion progress.
 */
const ProgressBar = styled.div`
  width: 100%;
  height: 2px;
  background-color: ${(props) =>
    props.$isComplete ? props.$completeBarColor || "#f3522eff" : "#e0e0e0"};
  transition: background-color 0.3s ease;
`;

export default function CustomStepper({
  steps = [],
  activeStep = 0,
  activeColor = "#f3522eff",
  size = 20,
  circleFontSize = 10,
  titleFontSize = 14,
  completeBarColor = "#f3522eff",
  onNext,
  onPrev,
  isNextDisabled = false,
}) {
  // Initialize keyboard shortcuts for 'Next' and 'Previous' navigation.
  useStepperShortcuts({ onNext, onPrev, isNextDisabled });

  return (
    <StepperContainer>
      {/* Backwards navigation button, hidden on the first step. */}
      <div
        style={{
          visibility: activeStep > 0 ? "visible" : "hidden",
          marginTop: "-20px",
        }}
      >
        <Tooltip
          delayDuration={400}
          side="top"
          width="max-content"
          text={
            <>
              Previous <Kbd>Alt</Kbd> + <Kbd>Backspace</Kbd>
            </>
          }
        >
          <NavIcon onClick={onPrev} role="button" aria-label="Previous">
            <IoIosArrowBack />
          </NavIcon>
        </Tooltip>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "space-between",
          margin: "0 20px",
        }}
      >
        {/* Render each step defined in the steps array. */}
        {steps.map((step, index) => {
          const isComplete = index < activeStep;
          const isActive = index === activeStep;
          const isLast = index === steps.length - 1;

          return (
            <StepWrapper key={index}>
              <StepCircle
                $size={size}
                $fontSize={circleFontSize}
                $isComplete={isComplete}
                $isActive={isActive}
                $activeColor={activeColor}
              >
                {/* Show checkmark for completed steps, otherwise show the step number. */}
                {isComplete ? (
                  <IoCheckmark size={circleFontSize + 2} />
                ) : (
                  index + 1
                )}
              </StepCircle>
              <StepTitle
                $fontSize={titleFontSize}
                $isComplete={isComplete}
                $isActive={isActive}
                $activeColor={activeColor}
              >
                {step.title}
              </StepTitle>
              {/* Render a progress bar between steps, except after the last step. */}
              {!isLast && (
                <ProgressBarContainer>
                  <ProgressBar
                    $isComplete={isComplete}
                    $completeBarColor={completeBarColor}
                  />
                </ProgressBarContainer>
              )}
            </StepWrapper>
          );
        })}
      </div>

      {/* Forward navigation button, hidden on the final step. */}
      <div
        style={{
          visibility: activeStep < steps.length - 1 ? "visible" : "hidden",
          marginTop: "-20px",
        }}
      >
        <Tooltip
          delayDuration={400}
          side="top"
          width="max-content"
          text={
            <>
              Next{" "}
              {!isNextDisabled && (
                <>
                  <Kbd>Alt</Kbd> + <Kbd>.</Kbd>
                </>
              )}
            </>
          }
        >
          <NavIcon
            role="button"
            aria-label="Next"
            onClick={isNextDisabled ? undefined : onNext}
            style={{
              opacity: isNextDisabled ? 0.5 : 1,
              cursor: isNextDisabled ? "not-allowed" : "pointer",
            }}
          >
            <IoIosArrowForward />
          </NavIcon>
        </Tooltip>
      </div>
    </StepperContainer>
  );
}
