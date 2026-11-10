/**
 * @file HomeStyles.js
 * @description A centralized collection of styled-components and keyframe animations
 * used across the Home page and its various sections. It defines the theme,
 * layout, and interactive visual behaviors of the landing page.
 *
 * @dependencies
 * - styled-components: For CSS-in-JS styling and theme management.
 * - framer-motion: For adding animation capabilities to styled components.
 *
 * @exports
 * - Animations: float, pulseGlow, bounce, slideInLeft, slideInRight.
 * - Layout: MainContainer, Section, SnapStage.
 * - Components: LoginButtonPos, HeroText, FeatureCard, MarqueeTag, etc.
 *
 * @interconnections
 * - This file is the primary styling source for all components in `src/components/Home/`.
 */

import styled, { keyframes, css } from "styled-components";
import { motion } from "framer-motion";

// --- Animations ---

/** Floating effect for icons and visuals */
export const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
`;

/** Pulsing glow effect used for central visual elements */
export const pulseGlow = keyframes`
  0% { box-shadow: 0 0 50px 20px rgba(255, 87, 34, 0.2); }
  50% { box-shadow: 0 0 70px 30px rgba(233, 30, 99, 0.3); }
  100% { box-shadow: 0 0 50px 20px rgba(255, 87, 34, 0.2); }
`;

/** Gentle bounce animation for indicators */
export const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

/** Entry animation from the left with a slight rotation */
export const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-100px) rotate(-10deg); }
  to { opacity: 1; transform: translateX(0) rotate(0); }
`;

/** Entry animation from the right with a slight rotation */
export const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(100px) rotate(10deg); }
  to { opacity: 1; transform: translateX(0) rotate(0); }
`;

// --- Styled Components ---

/**
 * The root container for the home page.
 * Implements vertical scroll-snapping for a slide-like experience.
 */
export const MainContainer = styled.div`
  height: 100vh;
  width: 100vw;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  font-family: var(--font-primary);
  background: #f8f9fa;

  @media (max-width: 768px) {
    width: 100%;
  }

  /* Hide scrollbar for a minimalist, sleek aesthetic */
  scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  &scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  ::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }
`;

/**
 * A generic full-height section component.
 * Acts as a container for individual landing page "slides".
 */
export const Section = styled.section`
  min-height: 100vh;
  height: auto;
  padding: 40px 0;
  box-sizing: border-box;
  width: 100%;
  scroll-snap-align: start;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: ${(props) => props.$bg || "white"};
`;

// --- Hero Section Styles ---

/** Positioner for the primary login/CTA button */
export const LoginButtonPos = styled.div`
  position: absolute;
  top: 30px;
  right: 40px;
  z-index: 10;

  @media (max-width: 768px) {
    top: 20px;
    right: 20px;
  }
`;

/** Gradient-filled button with Framer Motion hover/tap capabilities */
export const FilledButton = styled(motion.button)`
  background: linear-gradient(135deg, #ff5722, #e91e63);
  border: none;
  padding: 12px 32px;
  border-radius: 30px;
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 1rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 20px rgba(233, 30, 99, 0.3);

  svg {
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    padding: 8px 24px;
    font-size: 0.9rem;

    svg {
      font-size: 1rem;
    }
  }
`;

/** Container for the main hero icon with drop shadow and z-index management */
export const IconWrapper = styled(motion.div)`
  z-index: 2;
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.15));
  }

  @media (max-width: 768px) {
    width: 150px;
    height: 150px;
  }
`;

/** Semi-transparent glassmorphism overlay behind the hero logo */
export const GlassOverlay = styled.div`
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.24),
    rgba(255, 255, 255, 0.07)
  );
  backdrop-filter: blur(10px);
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    width: 170px;
    height: 170px;
  }
`;

/** Large gradient-text heading for the hero section */
export const HeroText = styled(motion.h1)`
  font-family: var(--font-display);
  font-size: 5rem;
  font-weight: 700;
  margin-top: 20px;
  z-index: 2;
  background: linear-gradient(90deg, #ff5722, #e91e63);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  letter-spacing: -2px;

  @media (max-width: 768px) {
    font-size: 2.8rem;
  }
`;

/** Animated "Scroll Down" prompt at the bottom of the hero section */
export const ScrollIndicator = styled(motion.div)`
  position: absolute;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #888;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 2;
  cursor: pointer;
`;

// --- Features Section Styles ---

/** Large section heading with a custom under-skew highlight */
export const SectionTitle = styled(motion.h2)`
  font-family: var(--font-display);
  font-size: 3rem;
  margin-bottom: 60px;
  color: #333;
  text-align: center;

  span {
    color: #ff5722;
    position: relative;
    display: inline-block;

    &::after {
      content: "";
      position: absolute;
      bottom: 5px;
      left: 0;
      width: 100%;
      height: 10px;
      background: rgba(255, 87, 34, 0.2);
      z-index: -1;
      transform: skewX(-10deg);
    }
  }

  @media (max-width: 768px) {
    font-size: 1.8rem;
    margin-bottom: 40px;
  }
`;

/** Responsive grid for feature cards */
export const CardsContainer = styled.div`
  display: grid;
  gap: 30px;
  max-width: 1400px;
  width: 90%;
  justify-content: center;
  grid-template-columns: repeat(4, 1fr);

  @media (max-width: 1350px) {
    grid-template-columns: repeat(2, 1fr);
    max-width: 800px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/** Individual feature card with hover lift effect */
export const FeatureCard = styled(motion.div)`
  background: white;
  padding: 40px 30px;
  border-radius: 24px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.02);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

/** Colored icon container for feature cards */
export const IllustrationBadge = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  margin-bottom: 20px;
  color: ${(props) => props.$color || "#fff"};
  background: ${(props) =>
    props.$bg || "linear-gradient(135deg, #ff5722, #e91e63)"};
  box-shadow: 0 10px 20px
    ${(props) => props.$shadow || "rgba(233, 30, 99, 0.2)"};

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
    border-radius: 12px;
    margin-bottom: 15px;
  }
`;

export const CardTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #222;

  @media (max-width: 768px) {
    font-size: 1.3rem;
    margin-bottom: 10px;
  }
`;

export const CardDesc = styled.p`
  color: #666;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    line-height: 1.5;
  }
`;

// --- Continuous Scroll Section Styles ---

/** Wrapper for sections that use sticky headers and snap-stages */
export const ScrollContainerWrapper = styled.div`
  width: 100%;
  position: relative;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
`;

/** Container that holds the sticky header, ensuring it covers the section scroll length */
export const StickyHeaderContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;

  @media (max-width: 768px) {
    position: relative;
    height: auto;
    padding-top: 40px;
  }
`;

/** The sticky track where the title lives */
export const StickyTrack = styled.div`
  position: sticky;
  top: 10vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  pointer-events: none;

  @media (max-width: 768px) {
    position: relative;
    top: 0;
  }
`;

export const StickyTitle = styled(motion.h2)`
  font-family: var(--font-display);
  font-size: 3rem;
  color: #333;
  margin: 0;
  text-align: center;
  pointer-events: auto;

  span {
    color: #ff5722;
    position: relative;
    display: inline-block;

    &::after {
      content: "";
      position: absolute;
      bottom: 5px;
      left: 0;
      width: 100%;
      height: 10px;
      background: rgba(255, 87, 34, 0.2);
      z-index: -1;
      transform: skewX(-10deg);
    }
  }

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

/**
 * A snapping stage within a ScrollContainerWrapper.
 * Each stage typically covers 100vh.
 */
export const SnapStage = styled.div`
  min-height: 100vh;
  height: auto;
  width: 100%;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 5%;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;

  /* Allow bleeding for decorative overlays */
  & > .snap-stage-overlay,
  & > ${GlassOverlay} {
    overflow: visible;
  }

  @media (max-width: 768px) {
    height: auto;
    min-height: 100vh;
    overflow: hidden;
    padding: 30px 5%;
  }
`;

export const SnapStageOverlay = styled.div`
  position: absolute;
  overflow: visible;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

/** Container for centrally aligned headings and descriptions */
export const CenteredText = styled.div`
  max-width: 800px;
  text-align: center;

  h3 {
    font-family: var(--font-display);
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 30px;
    background: linear-gradient(90deg, #ff5722, #e91e63);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    @media (max-width: 768px) {
      font-size: 1.8rem;
      margin-bottom: 15px;
    }
  }

  p {
    font-size: 1.4rem;
    color: #555;
    line-height: 1.8;

    @media (max-width: 768px) {
      font-size: 1.1rem;
      line-height: 1.5;
    }
  }
`;

/** Layout component for splitting content into text and visual sides */
export const SplitContent = styled.div`
  display: flex;
  width: 100%;
  max-width: 1200px;
  gap: 50px;
  align-items: center;

  @media (max-width: 900px) {
    flex-direction: column;
    text-align: center;
    gap: 30px;
  }
`;

/** Left-side container for split content, typically holds text */
export const SplitLeft = styled.div`
  width: 55%;
  h3 {
    font-family: var(--font-display);
    font-size: 2.2rem;
    margin-bottom: 20px;
    color: #333;

    @media (max-width: 768px) {
      font-size: 1.5rem;
      margin-bottom: 10px;
    }
  }

  p {
    font-size: 1.2rem;
    color: #666;
    line-height: 1.6;

    @media (max-width: 768px) {
      font-size: 0.95rem;
      line-height: 1.5;
    }
  }

  /* Handles re-ordering for zig-zag layouts on desktop */
  @media (min-width: 901px) {
    &:last-child {
      order: 1;
    }
  }

  @media (max-width: 900px) {
    width: 100%;
    order: 0;
  }
`;

/** Right-side container for split content, typically holds tags or illustrations */
export const SplitRightTags = styled.div`
  width: 40%;
  height: 400px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (min-width: 901px) {
    &:first-child {
      order: 0;
    }
  }

  @media (max-width: 900px) {
    width: 100%;
    height: 300px;
    order: 1;
  }

  @media (max-width: 768px) {
    height: 200px;
  }
`;

// --- Marquee Styles ---

/** Outer wrapper for the marquee with side fading masks */
export const MarqueeContainer = styled.div`
  width: 100%;
  overflow: hidden;
  margin-bottom: 20px;
  mask-image: linear-gradient(
    to right,
    transparent,
    black 10%,
    black 90%,
    transparent
  );
`;

/** Flex track that animates the tags in a continuous loop */
export const MarqueeTrack = styled(motion.div)`
  display: flex;
  gap: 15px;
  width: max-content;
`;

/** Individual tag within the marquee with optional color highlighting */
export const MarqueeTag = styled.div`
  padding: 8px 20px;
  background: white;
  border-radius: 50px;
  font-family: var(--font-primary);
  font-weight: 600;
  color: #555;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap;
  font-size: 0.95rem;

  ${(props) =>
    props.$highlight &&
    css`
      color: ${props.$highlight};
      border-color: ${props.$highlight};
      background: ${props.$highlight}10; // 10% opacity
    `}
`;

// --- Other Styled Components ---

/** Track for the vertical progress indicator in multi-stage sections */
export const ProgressContainer = styled.div`
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 200px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
  z-index: 20;

  @media (max-width: 768px) {
    right: 20px;
    height: 150px;
  }
`;

/** The moving thumb that represents current scroll progress */
export const ProgressThumb = styled.div`
  width: 100%;
  height: 33%; // 1/3rd of the height by default
  background: linear-gradient(to bottom, #ff5722, #e91e63);
  border-radius: 4px;
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.1s linear;
  will-change: transform;
`;

// --- Footer Styles ---

/** Layout wrapper for the footer content */
export const FooterContent = styled.div`
  display: flex;
  width: 90%;
  max-width: 1200px;
  justify-content: space-between;
  align-items: flex-start;
  gap: 50px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

export const FooterLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FooterRight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  align-items: flex-end;

  @media (max-width: 768px) {
    align-items: center;
  }
`;

export const FooterLinks = styled.div`
  display: flex;
  gap: 20px;
  flex-direction: column;
`;

export const FooterLink = styled.a`
  text-decoration: none;
  color: #555;
  font-weight: 600;
  font-size: 1.1rem;
  transition: color 0.3s;

  &:hover {
    color: #ff5722;
  }
`;

export const Copyright = styled.p`
  color: #999;
  font-size: 0.9rem;
  margin-top: 20px;
`;

export const ContactTitle = styled.h4`
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 10px;
`;

/** Wrapper for individual contact details like email */
export const ContactItem = styled.div`
  margin-bottom: 20px;
  p {
    font-size: 1rem;
    color: #666;
    margin-bottom: 5px;
  }
  a {
    color: #ff5722;
    text-decoration: none;
    font-weight: 600;
  }
`;

/** Icons for developer contact (Email, GitHub, etc.) */
export const DeveloperIcons = styled.div`
  display: flex;
  gap: 15px;

  a {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #555;
    font-size: 1.2rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      color: #ff5722;
      box-shadow: 0 8px 15px rgba(233, 30, 99, 0.2);
    }
  }
`;
