/**
 * @file FeaturesSection.jsx
 * @description Renders a grid of cards showcasing the primary features and benefits of the platform,
 * such as Graded Resources, Targeted Modules, In-Depth Analytics, and Unlimited Practice.
 *
 * @dependencies
 * - React: Basic component structure.
 * - HomeStyles: Styled components for the section, grid layout, and feature cards.
 * - react-icons/io5: Icons to visually represent each feature.
 *
 * @exports FeaturesSection - The functional component displaying platform features.
 *
 * @interconnections
 * - Receives a `featuresRef` prop to facilitate smooth-scroll navigation from the hero section.
 * - Operates as a mid-page section on the Home landing page.
 */

import {
  Section,
  SectionTitle,
  CardsContainer,
  FeatureCard,
  IllustrationBadge,
  CardTitle,
  CardDesc,
} from "./HomeStyles";
import {
  IoLibraryOutline,
  IoLocateOutline,
  IoStatsChartOutline,
  IoInfiniteOutline,
} from "react-icons/io5";

const FeaturesSection = ({ featuresRef }) => {
  return (
    <Section id="features-section" ref={featuresRef} $bg="#fafafa">
      {/* Animated section heading with entrance effect */}
      <SectionTitle
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        What We <span>Offer</span>
      </SectionTitle>

      <CardsContainer>
        {/* Map through a list of feature objects to generate cards dynamically */}
        {[
          {
            icon: <IoLibraryOutline />,
            bg: "linear-gradient(135deg, #FF9800, #FF5722)",
            shadow: "rgba(255, 87, 34, 0.2)",
            title: "Graded Resources",
            desc: "Access a vast library of resources tailored specifically for Grade 3 to 12, ensuring age-appropriate learning.",
          },
          {
            icon: <IoLocateOutline />,
            bg: "linear-gradient(135deg, #4CAF50, #009688)",
            shadow: "rgba(76, 175, 80, 0.2)",
            title: "Targeted Modules",
            desc: "Enhance your skills with focused modules designed to target specific areas for deep practice and mastery.",
          },
          {
            icon: <IoStatsChartOutline />,
            bg: "linear-gradient(135deg, #2196F3, #3F51B5)",
            shadow: "rgba(33, 150, 243, 0.2)",
            title: "In-Depth Analytics",
            desc: "Track your progress with detailed reports and visualized data insights to understand your growth.",
          },
          {
            icon: <IoInfiniteOutline />,
            bg: "linear-gradient(135deg, #E91E63, #9C27B0)",
            shadow: "rgba(233, 30, 99, 0.2)",
            title: "Unlimited Practice",
            desc: "Train without limits in our Marathon mode, offering endless algorithmic questions for continuous improvement.",
          },
        ].map((card, index) => (
          <FeatureCard
            key={index}
            // Cards slide in from opposite sides based on their index
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
          >
            {/* Visual icon badge with custom theme colors */}
            <IllustrationBadge $bg={card.bg} $shadow={card.shadow}>
              {card.icon}
            </IllustrationBadge>
            <CardTitle>{card.title}</CardTitle>
            <CardDesc>{card.desc}</CardDesc>
          </FeatureCard>
        ))}
      </CardsContainer>
    </Section>
  );
};

export default FeaturesSection;
