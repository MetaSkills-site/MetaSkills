/**
 * @file MarathonLayout.jsx
 * @description A reusable layout wrapper for all Marathon-style learning modules.
 * It provides a consistent header with navigation (Exit), a real-time timer,
 * an error reporting mechanism, and a "Carrot" currency display.
 *
 * @dependencies
 * - React (useState, useEffect, useContext): State and effect management for the timer and user session.
 * - react-router-dom (useNavigate): For handling the exit navigation.
 * - react-icons/io5: Icons for back arrow and time.
 * - SessionContext: To access the current user's session and token.
 * - Carrot: Component to display and handle the user's reward currency.
 * - MarathonStyles: Styled components for the layout (Container, Header, etc.).
 *
 * @exports MarathonLayout - The functional layout component.
 *
 * @interconnections
 * - Wraps various marathon pages (Math, English, Vocabulary) to provide common UI elements.
 * - Communicates with the Carrot component for real-time currency updates.
 */

import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoTimeOutline } from "react-icons/io5";
import { SessionContext } from "../context/SessionProvider";
import Carrot from "../components/Carrot";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  Container,
  Header,
  TimerContainer,
  CarrotContainer,
  RightControlsContainer,
} from "../components/Marathon/MarathonStyles";
import styled from "styled-components";

/**
 * Styled button specifically for reporting content errors.
 */
const ReportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ffe0b2;
  padding: 8px 12px;
  border-radius: 20px;
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ffe0b2;
    transform: translateY(-1px);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export default function MarathonLayout({
  children,
  exitPath,
  startTime,
  submitted,
  elapsedTimeOverride = null, // Used if the parent manages time (e.g., during result display)
  onReportClick, // Callback triggered when the user reports an issue
}) {
  const navigate = useNavigate();
  const { user } = useContext(SessionContext);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Internal Isolated Timer Logic: Calculates seconds since startTime
  useEffect(() => {
    let interval;
    if (!submitted && startTime) {
      interval = setInterval(() => {
        // Calculate diff between now and when the marathon started, clamping at 0
        setElapsedTime(
          Math.max(0, Math.floor((Date.now() - startTime) / 1000)),
        );
      }, 1000);
      setElapsedTime(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    } else if (!startTime) {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [submitted, startTime]);

  // Use override time if provided (usually for static display), otherwise use current tracker
  const displayTime =
    elapsedTimeOverride !== null ? elapsedTimeOverride : elapsedTime;

  /**
   * Formats seconds into a MM:SS string.
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Container>
      <Header>
        {/* Navigation: Exit button to return to the previous context or home */}
        <button
          type="button"
          aria-label="Exit Marathon"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            color: "#666",
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
          }}
          onClick={() => navigate(exitPath)}
        >
          <IoArrowBack size={20} />{" "}
          <span style={{ fontWeight: 600 }}>Exit Marathon</span>
        </button>

        <RightControlsContainer>
          {/* Real-time session timer display */}
          <TimerContainer>
            <IoTimeOutline />
            {formatTime(displayTime)}
          </TimerContainer>

          {/* Conditional Report Button: only shown if the parent provides an action */}
          {onReportClick && (
            <ReportButton onClick={onReportClick}>
              <FaExclamationTriangle /> Report Error
            </ReportButton>
          )}

          {/* User's Carrot counter: count updates dynamically from the context */}
          <CarrotContainer>
            <Carrot
              size="20px"
              showCount={true}
              count={user?.carrots}
              token={user?.token}
            />
          </CarrotContainer>
        </RightControlsContainer>
      </Header>

      {/* Main content area for the specific marathon module */}
      {children}
    </Container>
  );
}
