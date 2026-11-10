/**
 * FILE PURPOSE: NotFound — The fallback page for unhandled application routes (404).
 *
 * ROLE:
 * Provides a user-friendly and visually engaging way to inform users that
 * the requested URL does not exist. It includes a primary action button
 * to return to the home dashboard.
 *
 * DEPENDENCIES:
 * - react-router-dom: useNavigate for client-side redirection.
 * - styled-components: For full-screen layout, themed gradients, and floating animations.
 *
 * EXPORTS:
 * - NotFound (default): The functional component rendering the 404 UI.
 *
 * INTERCONNECTIONS:
 * - Defined as the catch-all '*' route in the primary router configuration.
 */
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

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

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 900;
  color: #ff5722;
  margin: 0;
  line-height: 1;
  text-shadow: 4px 4px 0px rgba(255, 87, 34, 0.1);

  @media (max-width: 768px) {
    font-size: 6rem;
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #333;
  margin: 10px 0 20px;
  font-weight: 700;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: #666;
  max-width: 500px;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const HomeButton = styled.button`
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 3px solid #ff5722;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(255, 87, 34, 0.2);
  }
`;

/**
 * Illustration
 * An animated emoji container that floats up and down to add dynamic visual interest.
 */
const Illustration = styled.div`
  font-size: 100px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;

  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0px);
    }
  }
`;

/* ─── Main Component ─── */

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container>
      <Illustration>🛸</Illustration>
      <ErrorCode>404</ErrorCode>
      <Title>Page Not Found</Title>
      <Description>
        Oops! The page you are looking for seems to have drifted into a black
        hole. Let&apos;s get you back to safety.
      </Description>
      <HomeButton onClick={() => navigate("/")}>Go Back Home</HomeButton>
    </Container>
  );
}
