/**
 * @file OfflinePage.jsx
 * @description A full-screen overlay component shown when the user loses internet connectivity.
 * It periodically checks for connection restoration and provides a manual retry button.
 *
 * @dependencies
 * - react: For state and effect hooks.
 * - styled-components: For layout and pulsing animations.
 *
 * @exports OfflinePage (default)
 * @interconnections Triggered by the network status listeners in the application root.
 */

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff5f2 0%, #fff 100%);
  font-family: var(--font-primary);
  text-align: center;
  padding: 20px;
`;

const Icon = styled.div`
  font-size: 80px;
  margin-bottom: 20px;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 15px;
  font-weight: 800;
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 3px solid rgba(255, 87, 34, 0.1);
  border-radius: 50%;
  border-top: 3px solid #ff5722;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 20px;
`;

const StatusText = styled.span`
  font-size: 0.9rem;
  color: #ff5722;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Button = styled.button`
  padding: 12px 30px;
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 1rem;
  color: white;
  background: linear-gradient(90deg, #ff5722, #f4511e);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.3);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  margin-top: 20px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Effect to monitor network status.
   * It uses a combination of the 'online' event and periodic resource fetching to confirm connectivity.
   */
  useEffect(() => {
    const checkConnection = () => {
      if (navigator.onLine) {
        setIsChecking(true);
        // Perform a HEAD request to a small asset to verify actual internet access (vs just being connected to a local router)
        fetch("/favicon.ico", { method: "HEAD", cache: "no-store" })
          .then(() => {
            // Connection is fully restored; reload the application
            window.location.reload();
          })
          .catch(() => {
            setIsChecking(false);
          });
      } else {
        // If navigator.onLine is false, we are definitely offline
        setIsChecking(false);
      }
    };

    const interval = setInterval(checkConnection, 3000);
    window.addEventListener("online", checkConnection);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkConnection);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    window.location.reload();
  };

  return (
    <Container>
      <Icon>📡</Icon>
      <Title>No Internet Connection</Title>
      <Message>
        It seems you are offline. Please check your internet connection. We are
        trying to reconnect...
      </Message>

      {isChecking && <Spinner />}

      <StatusText>
        {isChecking ? "Checking connection..." : "Waiting for network..."}
      </StatusText>

      <Button onClick={handleRetry}>Try Again Now</Button>
    </Container>
  );
}
