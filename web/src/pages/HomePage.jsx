/**
 * @file HomePage.jsx
 * @description The main landing page component for the MetaSkills platform.
 * It features several sections (Hero, Features, Tailored, Marathon, Gamification, CTA, Footer)
 * and uses a progressive fade scroll effect for navigation.
 *
 * @dependencies
 * - react: For useRef and useContext hooks.
 * - react-router-dom: For useNavigate and Navigate components.
 * - SessionContext: To check the user's login state.
 * - HomeStyles, useProgressiveFade: For layout and scroll context.
 * - HeroSection, FeaturesSection, TailoredSection, MarathonSection, CTASection, GamificationSection, FooterSection: Components for the different sections of the landing page.
 *
 * @exports HomePage (default)
 * @interconnections Main entry point for unauthenticated users. Redirects to /dashboard if logged in.
 */

import { useRef, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { SessionContext } from "../context/SessionProvider";

import { MainContainer } from "../components/Home/HomeStyles";
import { ScrollContext } from "../hooks/useProgressiveFade";
import HeroSection from "../components/Home/HeroSection";
import FeaturesSection from "../components/Home/FeaturesSection";
import TailoredSection from "../components/Home/TailoredSection";
import MarathonSection from "../components/Home/MarathonSection";
import CTASection from "../components/Home/CTASection";
import GamificationSection from "../components/Home/GamificationSection";
import FooterSection from "../components/Home/FooterSection";

function HomePage() {
  const navigate = useNavigate();
  const { user } = useContext(SessionContext);

  // Features Ref used for scroll navigation from Hero
  const featuresRef = useRef(null);
  const scrollRef = useRef(null);

  // If the user is already authenticated, redirect them to the dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ScrollContext.Provider value={scrollRef}>
      <MainContainer ref={scrollRef} className="main-scroll-container">
        {/* Section 1: Hero - Initial landing section with call to action */}
        <HeroSection navigate={navigate} />

        {/* Section 2: Features - Highlights key platform features */}
        <FeaturesSection featuresRef={featuresRef} />

        {/* Section 3: Grade & Subjects (Scroll Stages) - Tailored content based on user's grade/subjects */}
        <TailoredSection />

        {/* Section 3.5: Marathon Mode (Unlimited Practice) - Explains the marathon practice mode */}
        <MarathonSection />

        {/* Section 4: Gamification - Details the reward and progression systems */}
        <GamificationSection />

        {/* Section 5: CTA - Final call to action for user signup */}
        <CTASection />

        {/* Section 6: Footer & Contact - Links and contact information */}
        <FooterSection />
      </MainContainer>
    </ScrollContext.Provider>
  );
}

export default HomePage;
