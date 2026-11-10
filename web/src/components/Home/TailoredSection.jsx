/**
 * @file TailoredSection.jsx
 * @description A detailed section of the Home page showcasing that the educational content
 * is specifically handcrafted for Grades 3-12. It utilizes sticky headers and scroll-snapped
 * stages to present Math and English proficiency modules.
 *
 * @dependencies
 * - framer-motion: For scroll-linked animations and transitions.
 * - HomeStyles: Layout components including SplitContent, StickyHeader, and SnapStage.
 * - Marquee: To display subject-specific tags in a scrolling loop.
 * - useProgressiveFade: Custom hook to manage content visibility as it scrolls into view.
 *
 * @exports TailoredSection - The functional component for the tailored curriculum display.
 *
 * @interconnections
 * - Uses the Marquee component to render MATH_TAGS and ENGLISH_TAGS.
 * - Leverages useProgressiveFade for smooth entry/exit animations of text blocks.
 */

import { motion } from "framer-motion";
import {
  ScrollContainerWrapper,
  StickyHeaderContainer,
  StickyTrack,
  StickyTitle,
  SnapStage,
  CenteredText,
  SplitContent,
  SplitLeft,
  SplitRightTags,
} from "./HomeStyles";
import { Marquee, MATH_TAGS, ENGLISH_TAGS } from "./Marquee";
import { useProgressiveFade } from "../../hooks/useProgressiveFade";

const TailoredSection = () => {
  // Independent fade controls for each snapping stage to ensure clean transitions
  const fade1 = useProgressiveFade();
  const fade2 = useProgressiveFade();
  const fade3 = useProgressiveFade();
  const fade4 = useProgressiveFade();
  const fade5 = useProgressiveFade();

  return (
    <ScrollContainerWrapper>
      {/* Sticky section header that stays visible during the scroll through stages */}
      <StickyHeaderContainer>
        <StickyTrack>
          <StickyTitle
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Tailored for <span>Grades 3-12</span>
          </StickyTitle>
        </StickyTrack>
      </StickyHeaderContainer>

      {/* Stage 1: Handcrafted Excellence Introduction */}
      <SnapStage>
        <motion.div {...fade1}>
          <CenteredText>
            <h3>Handcrafted Excellence</h3>
            <p>
              We have sums for grades 3 to 12 that are handmade, carefully
              thought out, and written to challenge and inspire. Our English
              learning material features interesting stories with
              fill-in-the-blank assignments, tailored specifically for each
              class to enhance comprehension and vocabulary.
            </p>
          </CenteredText>
        </motion.div>
      </SnapStage>

      {/* Stage 2: Math Mastery with Scrolling Tags */}
      <SnapStage>
        <div
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <SplitContent>
            <SplitLeft as={motion.div} {...fade2}>
              <h3>Math Mastery</h3>
              <p>
                Over 15+ comprehensive modules filled with sums covering various
                topics. From basics to advanced concepts, ensuring a solid
                foundation.
              </p>
            </SplitLeft>
            <SplitRightTags as={motion.div} {...fade3}>
              {/* Render multiple marquee rows for math topics */}
              {MATH_TAGS.map((rowTags, index) => (
                <Marquee
                  key={index}
                  tags={rowTags}
                  direction={index % 2 === 0 ? "left" : "right"}
                  speed={30 + index * 5}
                />
              ))}
            </SplitRightTags>
          </SplitContent>
        </div>
      </SnapStage>

      {/* Stage 3: English Proficiency with Scrolling Tags */}
      <SnapStage>
        <div
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <SplitContent>
            <SplitRightTags as={motion.div} {...fade4}>
              {/* Render multiple marquee rows for English topics */}
              {ENGLISH_TAGS.map((rowTags, index) => (
                <Marquee
                  key={index}
                  tags={rowTags}
                  direction={index % 2 === 0 ? "left" : "right"}
                  speed={35 + index * 5}
                />
              ))}
            </SplitRightTags>
            <SplitLeft as={motion.div} {...fade5}>
              <h3>English Proficiency</h3>
              <p>
                We offer graded reading passages with fill-in-the-blanks, rich
                stories, and handpicked narratives. Each question is handcrafted
                from the passages, tailored to elevate each grade&apos;s
                learning experience.
              </p>
            </SplitLeft>
          </SplitContent>
        </div>
      </SnapStage>
    </ScrollContainerWrapper>
  );
};

export default TailoredSection;
