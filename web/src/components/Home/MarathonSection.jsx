/**
 * @file MarathonSection.jsx
 * @description A comprehensive section of the Home page that details the "Marathon" features.
 * It uses a scroll-snapping layout with multiple blocks explaining algorithmic math,
 * NLP-powered English, Spaced Repetition vocabulary, and AI feedback.
 *
 * @dependencies
 * - framer-motion: For scroll-based animations and interactive visual effects.
 * - react-icons/io5: Icons for representing different educational modules.
 * - HomeStyles: Layout components like ScrollContainerWrapper, SnapStage, etc.
 * - useProgressiveFade: Custom hook for handling element visibility on scroll.
 * - styled-components: For localized styling of illustrations and layout blocks.
 *
 * @exports MarathonSection - The main container component for the marathon feature details.
 *
 * @interconnections
 * - Interacts with the global scroll position via SnapStage components.
 * - Utilizes the useProgressiveFade hook to reveal content as it enters the viewport.
 */

import { motion } from "framer-motion";
import {
  IoInfinite,
  IoCalculatorOutline,
  IoHardwareChip,
  IoBookOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoCloseOutline,
  IoLanguageOutline,
  IoTextOutline,
  IoChatbubblesOutline,
  IoTimeOutline,
  IoRepeatOutline,
  IoTrendingUpOutline,
  IoSparklesOutline,
  IoCheckmarkDoneOutline,
  IoRibbonOutline,
} from "react-icons/io5";
import {
  ScrollContainerWrapper,
  StickyHeaderContainer,
  StickyTrack,
  StickyTitle,
  SnapStage,
} from "./HomeStyles";
import styled from "styled-components";
import { useProgressiveFade } from "../../hooks/useProgressiveFade";

// --- Custom Illustration Styles ---

/**
 * Container for the animated SVG/Icon visuals in each marathon block.
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

  @media (max-width: 768px) {
    height: 200px;
  }
`;

/**
 * Large central icon in the illustration with a drop shadow.
 */
const CentralVisual = styled(motion.div)`
  font-size: 15rem;
  color: ${(props) => props.$color || "#555"};
  filter: drop-shadow(
    0 20px 30px ${(props) => props.$shadow || "rgba(0,0,0,0.2)"}
  );
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 8rem;
  }
`;

/**
 * Smaller icons that float around the central visual with independent animations.
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
    font-size: 1.4rem;
    width: 35px;
    height: 35px;
  }
`;

// --- New Native Scroll Styles for Marathon Section ---

/**
 * Main wrapper for a single marathon feature block (text + visual).
 */
const BlockContainer = styled(motion.div)`
  display: flex;
  width: 90%;
  max-width: 1200px;
  gap: 50px;
  align-items: center;

  &.reverse {
    flex-direction: row-reverse;
  }

  @media (max-width: 900px) {
    flex-direction: column !important;
    text-align: center;
    gap: 20px;
  }
`;

const BlockContent = styled.div`
  flex: 1;

  .icon-wrapper {
    font-size: 4rem;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      font-size: 3rem;
      margin-bottom: 15px;
    }
  }

  h3 {
    font-family: var(--font-display);
    font-size: 2.2rem;
    margin-bottom: 20px;
    color: #333;

    @media (max-width: 768px) {
      font-size: 1.6rem;
      margin-bottom: 10px;
    }
  }

  p {
    font-size: 1.2rem;
    color: #666;
    line-height: 1.6;

    @media (max-width: 768px) {
      font-size: 1rem;
      line-height: 1.5;
    }
  }
`;

const BlockVisual = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  width: 100%;
`;

/**
 * MarathonBlock Component
 * Represents a single slide/stage in the marathon section.
 */
const MarathonBlock = ({ icon, iconColor, title, desc, reverse, children }) => {
  // Use custom hook for progressive opacity/transform based on scroll
  const fadeProps = useProgressiveFade();

  return (
    <SnapStage>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <BlockContainer className={reverse ? "reverse" : ""} {...fadeProps}>
          <BlockContent>
            <div className="icon-wrapper" style={{ color: iconColor }}>
              {icon}
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </BlockContent>
          <BlockVisual>{children}</BlockVisual>
        </BlockContainer>
      </div>
    </SnapStage>
  );
};

const MarathonSection = () => {
  // Intro section fade-in control
  const introFade = useProgressiveFade();

  return (
    <ScrollContainerWrapper id="marathon">
      {/* Section Sticky Header */}
      <StickyHeaderContainer>
        <StickyTrack>
          <StickyTitle
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            The <span>Marathon</span>
          </StickyTitle>
        </StickyTrack>
      </StickyHeaderContainer>

      {/* Intro Block: Sets the context for "Unlimited Practice" */}
      <SnapStage>
        <motion.div
          ref={introFade.ref}
          style={{
            ...introFade.style,
            textAlign: "center",
            maxWidth: "800px",
            width: "90%",
            margin: "0 auto",
          }}
        >
          <div
            style={{ fontSize: "5rem", color: "#ff5722", marginBottom: "20px" }}
            className="intro-icon"
          >
            <IoInfinite />
          </div>
          {/* Local responsive overrides for intro elements */}
          <style>
            {`
              @media (max-width: 768px) {
                .intro-icon {
                  font-size: 3rem !important;
                  margin-bottom: 15px !important;
                }
              }
            `}
          </style>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.5rem",
              marginBottom: "20px",
              background: "linear-gradient(90deg, #ff5722, #e91e63)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            className="intro-title"
          >
            Unlimited Practice
          </h3>
          <style>
            {`
              @media (max-width: 768px) {
                .intro-title {
                  font-size: 1.8rem !important;
                  margin-bottom: 15px !important;
                }
              }
            `}
          </style>
          <p
            style={{ fontSize: "1.4rem", color: "#555", lineHeight: "1.8" }}
            className="intro-desc"
          >
            Welcome to the Marathon. A place where learning never stops. Train
            without limits with our endless stream of questions.
          </p>
          <style>
            {`
              @media (max-width: 768px) {
                .intro-desc {
                  font-size: 1.1rem !important;
                  line-height: 1.5 !important;
                }
              }
            `}
          </style>
        </motion.div>
      </SnapStage>

      {/* Math Block: Visualizing dynamic sum generation */}
      <MarathonBlock
        icon={<IoCalculatorOutline />}
        iconColor="#e91e63"
        title="Algorithmic Sums"
        desc="Never run out of interesting problems to solve! Our smart algorithms generate unlimited math sums on the fly, ensuring you always have fresh material to challenge your brain."
        reverse={false}
      >
        <IllustrationContainer>
          <CentralVisual
            $color="#e91e63"
            $shadow="rgba(233, 30, 99, 0.4)"
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <IoCalculatorOutline />
          </CentralVisual>
          {/* Floating symbols indicating arithmetic operations */}
          <FloatingIcon
            $color="#ff5722"
            style={{ top: "15%", left: "10%" }}
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
              delay: 0.2,
            }}
          >
            <IoAddOutline />
          </FloatingIcon>
          <FloatingIcon
            $color="#9c27b0"
            style={{ bottom: "10%", right: "20%" }}
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
              delay: 0.8,
            }}
          >
            <IoRemoveOutline />
          </FloatingIcon>
          <FloatingIcon
            $color="#f44336"
            style={{ top: "10%", right: "15%" }}
            animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5.5,
              ease: "easeInOut",
              delay: 1.2,
            }}
          >
            <IoCloseOutline />
          </FloatingIcon>
        </IllustrationContainer>
      </MarathonBlock>

      {/* English Block: Highlighting NLP and grammar features */}
      <MarathonBlock
        icon={<IoHardwareChip />}
        iconColor="#2196f3"
        title="Intelligent English"
        desc="Powered by lightweight NLP. Master Tenses, Plurals, and Negatives in our Grammar Marathon, or immerse yourself in History and Stories with our Cloze tests."
        reverse={true}
      >
        <IllustrationContainer>
          <CentralVisual
            $color="#2196f3"
            $shadow="rgba(33, 150, 243, 0.4)"
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          >
            <IoHardwareChip />
          </CentralVisual>
          {/* Floating icons for language and text */}
          <FloatingIcon
            $color="#00bcd4"
            style={{ top: "10%", left: "15%" }}
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <IoLanguageOutline />
          </FloatingIcon>
          <FloatingIcon
            $color="#1976d2"
            style={{ bottom: "15%", right: "15%" }}
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            <IoTextOutline />
          </FloatingIcon>
          <FloatingIcon
            $color="#03a9f4"
            style={{ top: "20%", right: "5%" }}
            animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 7,
              ease: "easeInOut",
              delay: 1.5,
            }}
          >
            <IoChatbubblesOutline />
          </FloatingIcon>
        </IllustrationContainer>
      </MarathonBlock>

      {/* Vocabulary Block: Describing the Spaced Repetition (SRS) mechanism */}
      <MarathonBlock
        icon={<IoBookOutline />}
        iconColor="#9c27b0"
        title={
          <>
            Spaced Repetition
            <br />
            Vocabulary
          </>
        }
        desc={
          "Build an unshakeable lexicon. Our smart Adaptive Spaced Repetition System (SRS) learns when you're about to forget a word and dynamically schedules reviews—from 10 minutes up to 60 days—so you master vocabulary with minimal effort."
        }
        reverse={false}
      >
        <IllustrationContainer>
          <CentralVisual
            $color="#9c27b0"
            $shadow="rgba(156, 39, 176, 0.4)"
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <IoBookOutline />
          </CentralVisual>
          {/* Icons representing time and repetition */}
          <FloatingIcon
            $color="#e91e63"
            style={{ top: "15%", left: "10%" }}
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
              delay: 0.2,
            }}
          >
            <IoTimeOutline />
          </FloatingIcon>
          <FloatingIcon
            $color="#673ab7"
            style={{ bottom: "10%", right: "20%" }}
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
              delay: 0.8,
            }}
          >
            <IoRepeatOutline />
          </FloatingIcon>
          <FloatingIcon
            $color="#00bcd4"
            style={{ top: "10%", right: "15%" }}
            animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5.5,
              ease: "easeInOut",
              delay: 1.2,
            }}
          >
            <IoTrendingUpOutline />
          </FloatingIcon>
        </IllustrationContainer>
      </MarathonBlock>

      {/* AI Features Block: Future-looking AI capabilities */}
      <MarathonBlock
        icon={<IoSparklesOutline />}
        iconColor="#ff9800"
        title="AI-Powered Feedback"
        desc="Experience the future of learning. We use advanced AI models to instantly check your sentences, evaluate contextual accuracy, and deliver tailored feedback to supercharge your writing skills. Even more intelligent features are coming soon!"
        reverse={true}
      >
        <IllustrationContainer>
          <CentralVisual
            $color="#ff9800"
            $shadow="rgba(255, 152, 0, 0.4)"
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          >
            <IoSparklesOutline />
          </CentralVisual>
          {/* Icons for validation, achievement, and communication */}
          <FloatingIcon
            $color="#4caf50"
            style={{ top: "10%", left: "15%" }}
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <IoCheckmarkDoneOutline />
          </FloatingIcon>
          <FloatingIcon
            $color="#e91e63"
            style={{ bottom: "15%", right: "15%" }}
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            <IoRibbonOutline />
          </FloatingIcon>
          <FloatingIcon
            $color="#2196f3"
            style={{ top: "20%", right: "5%" }}
            animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 7,
              ease: "easeInOut",
              delay: 1.5,
            }}
          >
            <IoChatbubblesOutline />
          </FloatingIcon>
        </IllustrationContainer>
      </MarathonBlock>
    </ScrollContainerWrapper>
  );
};

export default MarathonSection;
