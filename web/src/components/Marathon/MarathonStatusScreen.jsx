import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  IoCheckmarkCircleOutline,
  IoHomeOutline,
  IoTimeOutline,
} from "react-icons/io5";

const Container = styled.div`
  ${(props) =>
    props.$fullScreen
      ? `
    height: 100vh;
    width: 100vw;
  `
      : `
    width: 100%;
    padding: 40px 20px;
    border-radius: 16px;
  `}
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${(props) =>
    props.$fullScreen
      ? "linear-gradient(135deg, #f0fdf4 0%, #fff 100%)"
      : "transparent"};
  font-family: var(--font-primary);
  text-align: center;
  padding: ${(props) => (props.$fullScreen ? "20px" : "40px 20px")};
`;

const IconWrapper = styled.div`
  font-size: 100px;
  color: #4caf50;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 15px;
  font-weight: 800;
`;

const Message = styled.p`
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const Button = styled.button`
  padding: 14px 30px;
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 1.1rem;
  border-radius: 50px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  background: linear-gradient(90deg, #4caf50, #45a049);
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  }
`;

const TimerText = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #4caf50;
  margin-bottom: 30px;
  background: rgba(76, 175, 80, 0.1);
  padding: 15px 30px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.05);
`;

const formatTimeUntil = (difference) => {
  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference / 1000 / 60) % 60);
  const seconds = Math.floor((difference / 1000) % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export default function MarathonStatusScreen({
  icon = <IoCheckmarkCircleOutline />,
  title = "Daily Goal Reached!",
  message = "Incredible work! You've learned your 20 new words for today. Spacing out your learning is the crucial key to long-term memory. Take a break, and come back tomorrow, or wait till the next available time for your next batch of vocabulary!",
  timeUntilNext,
  onRefresh,
  buttonIcon = <IoHomeOutline size={20} />,
  buttonText = "Back to Marathon Home",
  buttonAction,
  fullScreen = true,
}) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!timeUntilNext) return "";
    const date = new Date(timeUntilNext);
    if (isNaN(date.getTime())) return "00:00:00";
    const diff = date - new Date();
    if (diff <= 0) return "00:00:00";
    return formatTimeUntil(diff);
  });
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!timeUntilNext) return;

    let timer;

    const calculateTimeLeft = () => {
      const date = new Date(timeUntilNext);
      if (isNaN(date.getTime())) {
        if (timer) clearInterval(timer);
        if (onRefreshRef.current) onRefreshRef.current();
        return "00:00:00";
      }

      const difference = date - new Date();

      if (difference <= 0) {
        if (timer) clearInterval(timer);
        if (onRefreshRef.current) onRefreshRef.current();
        return "00:00:00";
      }

      return formatTimeUntil(difference);
    };

    setTimeLeft(calculateTimeLeft());

    timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeUntilNext]);

  return (
    <Container $fullScreen={fullScreen}>
      <IconWrapper>{icon}</IconWrapper>
      <Title>{title}</Title>
      <Message>{message}</Message>

      {timeUntilNext && (
        <TimerText>
          <IoTimeOutline size={28} />
          Next review in: {timeLeft}
        </TimerText>
      )}

      <Button onClick={buttonAction || (() => navigate("/marathon"))}>
        {buttonIcon}
        {buttonText}
      </Button>
    </Container>
  );
}
