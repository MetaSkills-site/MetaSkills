/**
 * @file Progress.jsx
 * @description A reusable progress bar component that visualizes a percentage value.
 * It supports custom gradients and features a smooth width transition animation.
 *
 * @dependencies
 * - react: For state and effect hooks.
 * - styled-components: For styling the progress bar and container.
 *
 * @exports Progress (default)
 * @interconnections Used in PerformanceOverviewCard and other progress-tracking widgets.
 */

import { useEffect, useState } from "react";
import styled from "styled-components";

const ProgressStyled = styled.div`
  position: relative;
  height: 30px;
  width: 40%;
  background-color: #e8eaf680;
  border-radius: 8px;
  overflow: hidden;
  padding: 0 !important;
  margin: 16px auto;
  box-shadow: inset 0 0 13px -2px #bc826021;

  & > div {
    height: 100%;
    // Uses a default gradient if none is provided via props
    background: ${(props) =>
      props.$gradient || "linear-gradient(90deg, #ff3f80, #ff9800, #ffc107)"};
    width: 0px;
    border-radius: inherit;
    transition: width 0.8s ease;
    box-shadow:
      -3px -3px 10px -3px #6173d726,
      3px 3px 10px #ce5c5324,
      6px 0 13px #d712121c;
  }
`;

function Progress(props) {
  const [progress, setProgress] = useState(0);

  /**
   * Effect to animate the progress bar width on mount or value change.
   * A small timeout is used to ensure the transition is visible.
   */
  useEffect(() => {
    const timer = setTimeout(() => setProgress(props.progress), 100);
    return () => clearTimeout(timer);
  }, [props.progress]);

  return (
    <ProgressStyled className={`${props.className}`} $gradient={props.gradient}>
      <div style={{ width: `${progress}%` }}></div>
    </ProgressStyled>
  );
}

export default Progress;
