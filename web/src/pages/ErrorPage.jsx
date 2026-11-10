/**
 * FILE PURPOSE: ErrorPage — The global boundary for handling and reporting application errors.
 *
 * ROLE:
 * When a fatal JS error occurs (handled via react-router error boundaries), this
 * component captures the stack trace, allows the user to report it to the dev team
 * (with AI-driven analysis feedback), and provides clear recovery paths (Reload/Home).
 *
 * DEPENDENCIES:
 * - react-router-dom: useRouteError for capturing error metadata.
 * - react-hot-toast: For user feedback on reporting status.
 * - react-icons: Visual status indicators.
 * - styled-components: For full-screen error layout and interactive buttons.
 *
 * EXPORTS:
 * - ErrorPage (default): The functional component managing error state and reporting.
 *
 * INTERCONNECTIONS:
 * - Defined as the 'errorElement' in the primary router configuration.
 */
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useRouteError, useNavigate } from "react-router-dom";
import { IoCopyOutline, IoCheckmarkOutline } from "react-icons/io5";
import { toast, Toaster } from "react-hot-toast";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";

/* ─── Styled Components ─── */

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

const ErrorIcon = styled.div`
  font-size: 80px;
  color: #ff5722;
  margin-bottom: 20px;
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
  margin-bottom: 10px;
  line-height: 1.6;
`;

const ErrorWrapper = styled.div`
  position: relative;
  max-width: 80%;
  margin-bottom: 30px;
`;

const ErrorDetails = styled.pre`
  background: rgba(255, 87, 34, 0.05);
  padding: 15px 45px 15px 15px;
  border-radius: 8px;
  border: 1px solid rgba(255, 87, 34, 0.1);
  color: #d32f2f;
  font-size: 0.9rem;
  overflow-x: auto;
  font-family: monospace;
  margin: 0;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 87, 34, 0.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: #ff5722;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid #fff;
  width: 16px;
  height: 16px;
  animation: ${spin} 1s linear infinite;
`;

const Button = styled.button`
  padding: 12px 25px;
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 1rem;
  border-radius: 50px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;

  ${(props) =>
    props.$primary
      ? `
    color: white;
    background: linear-gradient(90deg, #ff5722, #f4511e);
    box-shadow: 0 4px 15px rgba(255, 87, 34, 0.3);
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
    }
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
  `
      : `
    background: white;
    color: #ff5722;
    border: 2px solid #ff5722;
    &:hover {
      background: #fff5f2;
      transform: translateY(-2px);
    }
  `}
`;

const FullPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  animation: fadeIn 0.3s ease-in;
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const PhaseText = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-top: 30px;
  font-weight: 700;
  text-align: center;
  transition: opacity 0.5s ease;
`;

/* ─── AI Feedback Phases ─── */
const PHASES = [
  "Sending...",
  "Analyzing the problem with AI...",
  "Generating a report for the developer...",
  "Sending report to developer...",
];

/* ─── Main Component ─── */

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Log the actual error for developer console visibility once
  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  /**
   * PHASE TIMER LOGIC
   * Cycles through descriptive strings during the async reporting process
   * to provide a polished "AI-assisted" feedback experience.
   */
  useEffect(() => {
    if (!reporting) {
      setPhaseIndex(0);
      return;
    }

    const t1 = setTimeout(() => setPhaseIndex(1), 2500);
    const t2 = setTimeout(() => setPhaseIndex(2), 5500);
    const t3 = setTimeout(() => setPhaseIndex(3), 8500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reporting]);

  /**
   * handleReport
   * Serializes the error object and sends it to the central diagnostic endpoint.
   */
  const handleReport = async () => {
    setReporting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    try {
      await apiClient.post(
        API_ENDPOINTS.reportUserError.url,
        {
          error: {
            message: error?.message || "Unknown error",
            stack: error?.stack,
            status: error?.status,
            statusText: error?.statusText,
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
          platform:
            navigator.userAgentData?.platform || navigator.platform || "",
          language: navigator.language,
        },
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      // response from apiClient is already resolved, don't need response.ok check in same way but can assume success if no throw
      toast.success("Error reported successfully. Thank you!");
      setReported(true);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.error("Reporting timed out after 5 seconds");
        toast.error("Reporting took too long. Please try again later.");
      } else {
        console.error("Reporting failed:", err);
        toast.error("Failed to send error report. Please try again.");
      }
    } finally {
      setReporting(false);
    }
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = error?.statusText || error?.message || "Unknown Error";
      await navigator.clipboard.writeText(text);
      toast.success("Error code copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      toast.error("Failed to copy error to clipboard");
    }
  };

  /* ─── Loading / Phase View ─── */
  if (reporting) {
    return (
      <Container>
        <FullPageWrapper>
          <Spinner
            style={{
              width: "60px",
              height: "60px",
              borderWidth: "4px",
              borderColor: "rgba(255, 87, 34, 0.3)",
              borderTopColor: "#ff5722",
            }}
          />
          <PhaseText>{PHASES[phaseIndex]}</PhaseText>
        </FullPageWrapper>
      </Container>
    );
  }

  /* ─── Success / Reported View ─── */
  if (reported) {
    return (
      <Container>
        <Toaster position="top-center" />
        <FullPageWrapper>
          <IoCheckmarkOutline
            size={80}
            color="#4caf50"
            style={{ marginBottom: "20px" }}
          />
          <Title>Report Sent Successfully!</Title>
          <Message>
            The developer has been notified along with an AI analysis of the
            issue. Thank you for your help.
          </Message>
          <ButtonGroup style={{ marginTop: "30px" }}>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button $primary onClick={() => navigate("/")}>
              Go Home
            </Button>
          </ButtonGroup>
        </FullPageWrapper>
      </Container>
    );
  }

  /* ─── Default Error View ─── */
  return (
    <Container>
      <Toaster position="top-center" />
      <ErrorIcon>⚠️</ErrorIcon>
      <Title>Something went wrong</Title>
      <Message>
        We encountered an unexpected error. Please report this issue to help us
        fix it.
      </Message>

      {/* Captured Error Snippet */}
      {error && (
        <ErrorWrapper>
          <ErrorDetails>{error.statusText || error.message}</ErrorDetails>
          <CopyButton onClick={handleCopy} title="Copy error code">
            {copied ? (
              <IoCheckmarkOutline size={18} color="#4caf50" />
            ) : (
              <IoCopyOutline size={18} />
            )}
          </CopyButton>
        </ErrorWrapper>
      )}

      <ButtonGroup>
        <Button $primary onClick={handleReport} disabled={reporting}>
          Report Issue
        </Button>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </ButtonGroup>
    </Container>
  );
}
