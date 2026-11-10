/**
 * @file Marquee.jsx
 * @description A reusable scrolling marquee component used to display a continuous loop of tags
 * representing various curriculum topics or features. It includes predefined data constants
 * for Math and English subjects.
 *
 * @dependencies
 * - HomeStyles: Styled components for the marquee container, track, and tags.
 *
 * @exports
 * - Marquee: The functional component for the scrolling display.
 * - MATH_TAGS: Predefined list of mathematical topics.
 * - ENGLISH_TAGS: Predefined list of English/Language Arts topics.
 *
 * @interconnections
 * - Utilized in sections like FeaturesSection to showcase the breadth of content.
 */

import { MarqueeContainer, MarqueeTrack, MarqueeTag } from "./HomeStyles";

/**
 * Marquee Component
 * @param {Array} tags - List of strings or objects {text, color} to display.
 * @param {string} direction - 'left' or 'right' scrolling direction.
 * @param {number} speed - Duration of one full loop in seconds.
 */
export const Marquee = ({ tags, direction = "left", speed = 20 }) => {
  return (
    <MarqueeContainer>
      <MarqueeTrack
        // Determine start and end positions based on direction prop
        initial={{ x: direction === "left" ? 0 : "-50%" }}
        animate={{ x: direction === "left" ? "-50%" : 0 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: speed,
        }}
      >
        {/* 
            Triplicate tags to ensure a seamless loop. 
            The track animates to -50% (or 0) where the visual repeats perfectly.
        */}
        {[...tags, ...tags, ...tags].map((tag, i) => (
          <MarqueeTag key={i} $highlight={tag.color}>
            {tag.text || tag}
          </MarqueeTag>
        ))}
      </MarqueeTrack>
    </MarqueeContainer>
  );
};

// --- Data Constants ---
// Organized by "rows" to facilitate multiple marquee strips with different content.

export const MATH_TAGS = [
  // Row 1: Number System & Basics
  [
    { text: "Number System", color: "#e91e63" },
    "Divisibility Rules",
    "Multiples",
    "Factors",
    { text: "Prime Factorization", color: "#9c27b0" },
    "LCM & HCF",
    "Remainders",
    "Modulus Arithmetic",
    "Even & Odd",
    "Consecutive Numbers",
  ],
  // Row 2: Operations & Word Problems
  [
    "Addition",
    "Subtraction",
    { text: "Long Division", color: "#ff5722" },
    "Mental Math",
    "Word Problems",
    "Real-life Applications",
    { text: "Money Problems", color: "#4caf50" },
    "Unit Cost",
    "Daily Life Math",
  ],
  // Row 3: Fractions, Alg, Geom
  [
    { text: "Fractions", color: "#2196f3" },
    "Square Roots",
    "Simplification",
    "Algebraic Identities",
    "Ratios",
    "Proportions",
    { text: "Percentages", color: "#ff9800" },
    "Linear Equations",
    "Algebraic Expressions",
  ],
  // Row 4: Logic & Time
  [
    { text: "Age Problems", color: "#795548" },
    "Time-based Problems",
    "Calendar",
    "Leap Year",
    { text: "Pattern Observation", color: "#607d8b" },
    "Digit Patterns",
    "Number Patterns",
  ],
];

export const ENGLISH_TAGS = [
  // Row 1: Reading & Vocab
  [
    { text: "Reading Comprehension", color: "#009688" },
    "Unseen Passages",
    "Inference",
    { text: "Main Idea", color: "#3f51b5" },
    "Detail-based Questions",
    "Vocabulary",
    "Word Meanings",
  ],
  // Row 2: Grammar
  [
    { text: "Synonyms & Antonyms", color: "#e91e63" },
    "Contextual Vocabulary",
    "Grammar",
    "Sentence Structure",
    { text: "Parts of Speech", color: "#ff5722" },
    "Tenses",
    "Subject–Verb Agreement",
  ],
  // Row 3: Writing
  [
    { text: "Paragraph Writing", color: "#9c27b0" },
    "Short Answers",
    "Sentence Formation",
    { text: "Clarity of Expression", color: "#2196f3" },
    "Creative Writing",
    "Creative Writing",
  ],
];
