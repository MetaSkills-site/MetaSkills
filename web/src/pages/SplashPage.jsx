/**
 * @file SplashPage.jsx
 * @description A full-screen splash loading component.
 * It displays a rotating spinner and the platform logo while the application is initializing or loading significant data.
 *
 * @dependencies
 * - styled-components: For layout, animations, and styling.
 * - Logo: The platform's logo image.
 *
 * @exports SplashPage (default)
 * @interconnections Used as a fallback in Suspense or during initial session verification in App.jsx.
 */

import styled, { keyframes } from "styled-components";
const Logo = "/apple-touch-icon.png";

/**
 * Keyframes for the spinner rotation animation.
 */
const Rotate = keyframes`
  from {
    rotate: 0deg;
  }
  to {
    rotate: 360deg;
  }
`;

const SplashWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  background: #fff;
  > img {
    display: block;
    margin: auto;
    opacity: 0.8;
  }
`;

const Spinner = styled.div`
  width: 250px;
  height: 250px;
  z-index: 2;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  border-radius: 50%;
  border: solid 15px transparent;
  border-top: solid 15px #e91e6330;
  border-right: solid 15px #ff980040;
  animation: ${Rotate} 800ms ease-in-out infinite;
`;

export default function SplashPage() {
  return (
    <SplashWrapper>
      {/* Visual elements: a rotating colored spinner and the central logo */}
      <Spinner />
      <img src={Logo} alt="MetaSkills" />
    </SplashWrapper>
  );
}
