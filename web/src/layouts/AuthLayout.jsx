/**
 * @file AuthLayout.jsx
 * @description Layout wrapper providing branding, keyframe glow animations, and navigation shell for authentication workflows.
 * @architecture Wraps public authentication child routes (/auth, /admin/login) using React Router's Outlet, managing cover image skeleton states.
 * @agent_note Ensure subHeader prop defaults and UniversalBackButton navigation behavior remain intact when adjusting styling or nested routing.
 */

/**
 * FILE PURPOSE: Authentication layout wrapper for MetaSkills.
 * Provides a consistent visual background with animations and a responsive container for auth-related forms (Login, Signup, etc.).
 *
 * DEPENDENCIES:
 * - react-router-dom: Outlet for nested auth routes, useNavigate for navigation.
 * - styled-components: For themed UI and keyframe animations.
 * - UniversalBackButton: Shared component for consistent "Back" navigation.
 * - SkeletonLoader: Provides visual feedback during image loading.
 *
 * EXPORTS:
 * - Auth: Default functional component acting as the layout root for /auth routes.
 *
 * INTERCONNECT:
 * - Wraps routes defined in App.jsx under the "/auth" path.
 * - Manages 'isCoverLoaded' state to transition between Skeleton and actual Cover image.
 */

import { Outlet, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { useState } from "react";
import { SkeletonRect } from "../components/SkeletonLoader";
import UniversalBackButton from "../components/common/UniversalBackButton";

// --- Animations ---

/**
 * pulseGlow: Creates a breathing radial shadow effect for the background decoration.
 */
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 50px 20px rgba(255, 87, 34, 0.2); }
  50% { box-shadow: 0 0 70px 30px rgba(233, 30, 99, 0.3); }
  100% { box-shadow: 0 0 50px 20px rgba(255, 87, 34, 0.2); }
`;

// --- Styled Components ---

/**
 * Wrapper: Main viewport-filling container with flex centering.
 */
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-content: center;
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  background: white;
  margin-bottom: 20px;
`;

/**
 * AuthBackground: Absolute-positioned layer providing the stylized glow effect behind the content.
 */
const AuthBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60vh;
    height: 60vh;
    background: radial-gradient(
      circle,
      rgba(255, 152, 0, 0.4) 0%,
      rgba(233, 30, 99, 0.2) 50%,
      transparent 80%
    );
    filter: blur(60px);
    animation: ${pulseGlow} 4s infinite ease-in-out;
  }
`;

/**
 * Cover: The primary branding image displayed above auth forms.
 */
const Cover = styled.img`
  width: 100%;
  object-fit: cover;
  object-position: center;
  margin: 20px;
  border-radius: 10px;
`;

const Header = styled.h1`
  font-family: var(--font-display);
  font-size: 55px;
  background: linear-gradient(90deg, #ff538d, #ff7b51);
  filter: drop-shadow(1px 1px 1px rgb(255 123 81 / 50%));
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  margin: 50px 20px 20px 20px;
  z-index: 1;
  position: relative;
`;

const SubHeader = styled.h2`
  font-family: var(--font-primary);
  font-size: 16px;
  font-weight: bold;
  color: #0000008c;
  z-index: 1;
  position: relative;
`;

/**
 * Section: Centered content area for the form and its assets.
 */
const Section = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-content: center;
  width: -moz-fit-content;
  width: fit-content;
  height: 100%;
  z-index: 1;
  position: relative;
`;

/**
 * Authentication layout component wrapping child auth views with branding and animated background.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} [props.subHeader="Sign in to MetaSkills"] - Subtitle displayed below the application brand name.
 * @returns {JSX.Element} The rendered layout containing background glow, header branding, cover image, and nested route outlet.
 */
export default function AuthLayout({ subHeader = "Sign in to MetaSkills" }) {
  const navigate = useNavigate();
  // isCoverLoaded tracks image loading to toggle visibility between Skeleton and Img
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);

  return (
    <Wrapper>
      {/* Universal back button to return to the landing page */}
      <UniversalBackButton
        variant="floating"
        onClick={() => navigate("/")}
        text="Home"
      />

      {/* Decorative animated background layer */}
      <AuthBackground />

      <Header>MetaSkills</Header>
      <SubHeader>{subHeader}</SubHeader>

      <Section>
        {/* Render Skeleton while the cover image is fetching */}
        {!isCoverLoaded && (
          <SkeletonRect
            $width="350px"
            $height="250px"
            $radius="10px"
            style={{ margin: "20px" }}
          />
        )}

        {/* Main cover image; remains hidden until loaded to prevent layout shift */}
        <Cover
          src="/cover.webp"
          onLoad={() => setIsCoverLoaded(true)}
          style={{ display: isCoverLoaded ? "block" : "none" }}
        />

        {/* Outlet renders the specific auth sub-page (e.g., Login, Register) */}
        <Outlet />
      </Section>
    </Wrapper>
  );
}
