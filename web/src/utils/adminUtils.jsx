/**
 * @file adminUtils.jsx
 * @description UI utility components for admin views, providing media skeleton fallbacks, Slate rich text rendering, collapsible questions, and difficulty badges.
 * @architecture Shared component layer consumed by admin views (e.g., ViewPassages, ViewQuestions) for consistent data formatting and rich presentation.
 * @agent_note When modifying DifficultyBadge thresholds or ExpandableQuestion height, verify mobile responsiveness and keyboard accessibility.
 */

/**
 * FILE: AdminUtils.jsx
 * PURPOSE: Atomic utility components for administrative content views, including image rendering, HTML display, and difficulty badges.
 * DEPENDENCIES:
 * - SlateRenderer: Core engine for rendering rich-text content.
 * - react-loading-skeleton: Provides visual feedback during data loading.
 * - styled-components: For component-level styling.
 * EXPORTS:
 * - CustomImage: Lazy-loaded image component with skeleton fallback.
 * - HtmlContent: Wrapper for rendering Slate JSON content.
 * - ExpandableQuestion: Truncated content block with 'show more' interaction.
 * - DifficultyBadge: Renders a styled pill for difficulty scores.
 * INTERCONNECTIONS: Extensively used across administrative pages like ViewPassages and ViewQuestions for consistent content presentation.
 */

import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { IoIosArrowDown } from "react-icons/io";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SlateRenderer from "../components/SlateRenderer";

// Wrapper for HTML/Slate content to handle global styles like image and paragraph formatting
const ContentWrapper = styled.div`
  img {
    max-width: 30%;
    height: auto;
    border-radius: 8px;
    margin: 10px 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: block;
  }
  p {
    margin: 0;
  }
`;

/**
 * CustomImage component handles lazy loading of images with a skeleton screen fallback.
 *
 * @component
 * @param {Object} props - Image component properties.
 * @param {string} props.src - Image source URL.
 * @param {string} [props.alt] - Accessible alternate text.
 * @returns {JSX.Element} Image wrapped in loader container with fallback handling.
 */
export const CustomImage = ({ src, alt, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
      }}
    >
      {/* Display skeleton while image is loading */}
      {loading && (
        <Skeleton height={200} width={300} style={{ maxWidth: "100%" }} />
      )}
      <img
        src={src}
        alt={alt}
        {...props}
        onLoad={() => setLoading(false)}
        onError={() => {
          console.error("Image failed to load:", src);
          setError(true);
          setLoading(false);
        }}
        style={{
          display: loading || error ? "none" : "block",
          maxWidth: "100%",
          ...props.style,
        }}
      />
      {/* Error state fallback */}
      {error && (
        <div style={{ color: "red", padding: "10px", border: "1px solid red" }}>
          Failed to load image
        </div>
      )}
    </div>
  );
};

/**
 * HtmlContent component renders Slate-based rich text using the SlateRenderer.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Array|string|Object} props.html - Slate document AST or formatted text.
 * @param {Object} [props.style] - Optional CSS properties to apply to wrapper.
 * @returns {JSX.Element} Rendered rich-text content wrapper.
 */
export const HtmlContent = ({ html, style }) => {
  return (
    <ContentWrapper style={style}>
      <SlateRenderer slate={html} />
    </ContentWrapper>
  );
};

// Overlay for the 'show more' gradient on truncated content
const BlurOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: linear-gradient(to bottom, transparent, white);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 5px;
  cursor: pointer;
`;

// Animated icon for the expandable block
const MoreIcon = styled(IoIosArrowDown)`
  color: #ff5722;
  width: 24px;
  height: 24px;
  animation: bounce 2s infinite;

  @keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-3px);
    }
  }
`;

// Wrapper that controls the max-height of truncated content
const ExpandableWrapper = styled.div`
  position: relative;
  max-height: ${(props) => (props.expanded ? "none" : "100px")};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

/**
 * ExpandableQuestion component allows long content to be truncated and expanded on click.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Array|string|Object} props.html - Content payload to render and truncate.
 * @returns {JSX.Element} Expandable container with collapsible overlay.
 */
export const ExpandableQuestion = ({ html }) => {
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const contentRef = useRef(null);

  // Determine if content exceeds truncation threshold
  useEffect(() => {
    if (contentRef.current && contentRef.current.scrollHeight > 100) {
      setShowMore(true);
    }
  }, [html]);

  return (
    <ExpandableWrapper expanded={expanded}>
      <div ref={contentRef}>
        <HtmlContent html={html} />
      </div>
      {/* Show expansion trigger if content is truncated and not yet expanded */}
      {showMore && !expanded && (
        <BlurOverlay
          onClick={() => setExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setExpanded(true);
            } else if (e.key === " ") {
              e.preventDefault();
              setExpanded(true);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Show more"
        >
          <MoreIcon />
        </BlurOverlay>
      )}
    </ExpandableWrapper>
  );
};

// Styled component for difficulty level pills
const Badge = styled.span`
  font-size: 12px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
  margin-top: 8px;
  color: ${(props) => props.$color};
  background: ${(props) => props.$bg};
  border: 1px solid ${(props) => props.$border};
`;

/**
 * DifficultyBadge component maps numeric difficulty scores to labeled color-coded pills.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {number|null} props.difficulty - Difficulty score index (0-100).
 * @returns {JSX.Element|null} Styled difficulty badge pill or null if no score provided.
 */
export const DifficultyBadge = ({ difficulty }) => {
  if (difficulty === undefined || difficulty === null) return null;

  let label = "Medium";
  let color = "#ef6c00";
  let bg = "#fff3e0";
  let border = "#ffe0b2";

  // Difficulty mapping logic
  if (difficulty <= 35) {
    label = "Easy";
    color = "#2e7d32"; // Green
    bg = "#e8f5e9";
    border = "#c8e6c9";
  } else if (difficulty > 35 && difficulty <= 60) {
    label = "Medium";
    color = "#ef6c00"; // Orange
    bg = "#fff3e0";
    border = "#ffe0b2";
  } else if (difficulty > 60 && difficulty <= 80) {
    label = "Hard";
    color = "#c62828"; // Red
    bg = "#ffebee";
    border = "#ffcdd2";
  } else {
    label = "Very Hard";
    color = "#4a148c"; // Purple
    bg = "#f3e5f5";
    border = "#e1bee7";
  }

  return (
    <Badge $color={color} $bg={bg} $border={border}>
      {label} ({difficulty})
    </Badge>
  );
};

// Styled component for displaying question index numbers with gradient support
export const QuestionNumber = styled.span`
  display: block;
  border-right: solid 2px rgba(204, 204, 204, 0.23);
  padding-right: 5px;
  margin-right: 5px;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  min-width: 20px;
  font-family: var(--font-primary, sans-serif);
  font-weight: ${(props) => props.$weight || 700};
  color: ${(props) => (props.$gradient ? "transparent" : "inherit")};
  background: ${(props) => props.$gradient || "none"};
  -webkit-background-clip: ${(props) =>
    props.$gradient ? "text" : "border-box"};
  -webkit-text-fill-color: ${(props) =>
    props.$gradient ? "transparent" : "inherit"};
`;
