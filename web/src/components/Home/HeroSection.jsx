/**
 * @file HeroSection.jsx
 * @description The primary landing section (above-the-fold) for the Home page. It features
 * the brand logo, a call-to-action login button, and an animated scroll indicator.
 *
 * @dependencies
 * - React (useState): State management for image loading.
 * - HomeStyles: Styled components for the hero section's visual layout.
 * - AuroraBackground: An animated background component.
 * - SkeletonLoader (SkeletonCircle): Visual placeholder during logo loading.
 * - react-icons: Icons for person and chevron-down.
 *
 * @exports HeroSection - The main landing view component.
 *
 * @interconnections
 * - Receives a `navigate` function as a prop for routing.
 * - Interacts with the browser DOM to scroll into the features section.
 */

import { useState } from "react";
import {
  Section,
  LoginButtonPos,
  FilledButton,
  GlassOverlay,
  IconWrapper,
  HeroText,
  ScrollIndicator,
} from "./HomeStyles";
import AuroraBackground from "./AuroraBackground";
import { SkeletonCircle } from "../SkeletonLoader";
import { IoPerson, IoChevronDown } from "react-icons/io5";

const HeroSection = ({ navigate }) => {
  // Tracks loading status of the hero logo to handle skeleton-to-image transition
  const [isHeroIconLoaded, setIsHeroIconLoaded] = useState(false);

  return (
    <Section isActive={true}>
      {/* Dynamic animated background */}
      <AuroraBackground />

      {/* CTA: Login button positioned at the top right */}
      <LoginButtonPos>
        <FilledButton
          onClick={() => navigate("/auth")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Login <IoPerson />
        </FilledButton>
      </LoginButtonPos>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <GlassOverlay />
        {/* Animated container for the brand logo */}
        <IconWrapper
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          {!isHeroIconLoaded && <SkeletonCircle $size="200px" />}
          <img
            src="/transparent_icon.webp"
            alt="MetaSkills Icon"
            onLoad={() => setIsHeroIconLoaded(true)}
            style={{ display: isHeroIconLoaded ? "block" : "none" }}
          />
        </IconWrapper>
        {/* Main brand heading with entry animation */}
        <HeroText
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          MetaSkills
        </HeroText>
      </div>

      {/* Animated scroll indicator that navigates to the features section on click */}
      <ScrollIndicator
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={() =>
          document
            .getElementById("features-section")
            .scrollIntoView({ behavior: "smooth" })
        }
      >
        Scroll Down
        <IoChevronDown />
      </ScrollIndicator>
    </Section>
  );
};

export default HeroSection;
