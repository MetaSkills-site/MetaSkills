/**
 * FILE PURPOSE: HighlightedText — A utility for rendering text with embedded highlighting markers.
 *
 * ROLE:
 * Parses a string for {{highlight}} pattern and wraps the inner content in a
 * specialized styled span. This is crucial for questions where specific parts
 * of a sentence need to be emphasized (e.g., Tense identification or MCQ context).
 *
 * DEPENDENCIES:
 * - styled-components: For default highlight styling (orange underline/bold).
 *
 * EXPORTS:
 * - HighlightedText (default): The parser component.
 * - HighlightSpan: The underlying styled component for custom extensions.
 *
 * INTERCONNECTIONS:
 * - Used in Marathon Tense, MCQ, and Grammar modules to highlight focal points of questions.
 */
import styled from "styled-components";

/**
 * HighlightSpan
 * Default styling: bold text with a distinct orange underline to draw eye attention.
 */
const HighlightSpan = styled.span`
  text-decoration: underline;
  text-decoration-color: #ff5722;
  font-weight: bold;
  color: #333;
`;

export default function HighlightedText({
  text,
  HighlightComponent = HighlightSpan,
  className,
}) {
  if (!text) return null;

  // REGEX LOGIC: Split by {{...}} pattern, keeping the delimiters in the resulting array.
  // This allows us to map through the parts and identify which are markers vs regular text.
  const parts = text.split(/(\{\{.*?\}\})/);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part is a highlighted section (wrapped in double curly braces)
        if (part.startsWith("{{") && part.endsWith("}}")) {
          // Extract content by removing the first and last two characters ({{ and }})
          const content = part.slice(2, -2);
          return <HighlightComponent key={index}>{content}</HighlightComponent>;
        }
        // Regular text segments remain unchanged
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export { HighlightSpan };
