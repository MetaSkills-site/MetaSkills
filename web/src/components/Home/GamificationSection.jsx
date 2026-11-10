/**
 * @file GamificationSection.jsx
 * @description This section highlights the rewards and motivation system of the platform.
 * It uses a "Carrot" currency metaphor to encourage consistent learning and milestone achievement.
 *
 * @dependencies
 * - framer-motion: For entrance animations and orbiting icon effects.
 * - HomeStyles: Styled components for theme-consistent layout and typography.
 * - react-icons/io5: Icons representing different reward categories (diamonds, flames, ribbons).
 * - Carrot: A specialized SVG component representing the primary reward unit.
 * - styled-components: For localized animation containers.
 *
 * @exports GamificationSection - The functional component for the rewards section.
 *
 * @interconnections
 * - Complements the educational sections by providing an extrinsic motivation layer.
 * - Uses the Carrot component as its central visual anchor.
 */

import { motion } from "framer-motion";
import {
  Section,
  SectionTitle,
  SplitContent,
  SplitLeft,
  SplitRightTags,
} from "./HomeStyles";
import {
  IoDiamondOutline,
  IoFlameOutline,
  IoRibbonOutline,
} from "react-icons/io5";
import Carrot from "../Carrot";

import styled from "styled-components";

// --- Local Styled Components ---

/**
 * Container for the central carrot and orbiting icons.
 */
const IllustrationContainer = styled.div`
  width: 100%;
  height: 400px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 900px) {
    height: 300px;
  }
`;

/**
 * Central carrot visual with a glowing drop shadow and floating animation.
 */
const CentralCarrot = styled(motion.div)`
  font-size: 15rem;
  color: #ff9800;
  filter: drop-shadow(0 20px 30px rgba(255, 152, 0, 0.4));
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 10rem;
  }
`;

/**
 * Reusable icon component for floating reward symbols.
 */
const FloatingIcon = styled(motion.div)`
  position: absolute;
  font-size: 2.5rem;
  color: ${(props) => props.$color || "#555"};
  background: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 1.8rem;
    width: 45px;
    height: 45px;
  }
`;

const GamificationSection = () => {
  return (
    <Section $bg="#f8f9fa" id="gamification-section">
      <SectionTitle
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: "40px" }}
      >
        Get Addicted to <span>Learning</span>
      </SectionTitle>

      <SplitContent>
        {/* Left Side: Text explaining the "Carrot" reward system */}
        <SplitLeft>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ paddingRight: "30px" }}
          >
            <h3>Earn While You Learn</h3>
            <p style={{ marginBottom: "20px" }}>
              Consistent effort deserves recognition. We award you with{" "}
              <strong>Carrots</strong> for each milestone you secure.
            </p>
            <p>
              Collect them by completing entire modules, answering standard
              questions, or surviving long rounds in the Marathon modes. The
              more you learn, the more you earn.
            </p>
          </motion.div>
        </SplitLeft>

        {/* Right Side: Visual Illustration with orbiting reward icons */}
        <SplitRightTags style={{ height: "auto" }}>
          <IllustrationContainer>
            <CentralCarrot
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Carrot size="15rem" />
            </CentralCarrot>

            {/* Orbiting Icons representing different achievements */}
            <FloatingIcon
              $color="#E91E63" // Pink for module completion
              style={{ top: "10%", left: "15%" }}
              animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <IoDiamondOutline />
            </FloatingIcon>

            <FloatingIcon
              $color="#F44336" // Red for learning streaks (flame)
              style={{ bottom: "15%", right: "15%" }}
              animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <IoFlameOutline />
            </FloatingIcon>

            <FloatingIcon
              $color="#FFC107" // Gold for general achievements (ribbon)
              style={{ top: "20%", right: "5%" }}
              animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 7,
                ease: "easeInOut",
                delay: 1.5,
              }}
            >
              <IoRibbonOutline />
            </FloatingIcon>
          </IllustrationContainer>
        </SplitRightTags>
      </SplitContent>
    </Section>
  );
};

export default GamificationSection;
