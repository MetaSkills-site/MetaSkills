/**
 * FILE PURPOSE: SlateRenderer — The primary recursive renderer for Slate JSON content.
 *
 * ROLE:
 * Maps Slate node types (paragraphs, math, tables, images, links) to specific
 * React components and HTML primitives. It ensures that content created in the
 * Admin Editor is rendered faithfully and consistently across the user-facing app.
 *
 * DEPENDENCIES:
 * - MathField: Specialized renderer for 'math' nodes using the MathLive engine.
 * - html-react-parser: Fallback mechanism for legacy HTML string content.
 * - styled-components: Standardized styles for rich-text elements like quotes and tables.
 *
 * EXPORTS:
 * - SlateRenderer (default): Main entry point for rich-text rendering.
 *
 * INTERCONNECTIONS:
 * - Extensively consumed by question blocks, explanations, and passage renderers.
 * - Mirrors the transformation logic found in the 'convertSlateToHtml' utility.
 * - Supports subject-specific 'customRenderers' injection for extensibility.
 */

import styled from "styled-components";
import parse from "html-react-parser";
import MathField from "./MathField";

/* ─── Styled Components ─── */

const BlockQuote = styled.blockquote`
  border-left: 2px solid #ddd;
  margin-left: 0;
  margin-right: 0;
  padding-left: 10px;
  color: #aaa;
  font-style: italic;
`;

const Image = styled.img`
  display: block;
  max-width: 100%;
  max-height: 20em;
  box-shadow: 0 0 0 2px #ff5722;
  border-radius: 20px;
  margin: 10px 0;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  table-layout: fixed;
`;

const StyledTd = styled.td`
  border: 1px solid #ddd;
  padding: 8px;
  vertical-align: top;
  word-break: break-word;
  overflow-wrap: break-word;
`;

/**
 * MathFieldRenderer
 * Encapsulates the MathLive field for consistent vertical alignment and spacing.
 */
const MathFieldRenderer = ({ latex, inline }) => {
  return (
    <span
      contentEditable={false} // Prevents interaction with the field in read-only view
      style={{
        verticalAlign: "middle",
        margin: inline ? "0 2px" : "10px 0",
        display: inline ? "inline-block" : "block",
      }}
    >
      <MathField
        value={latex}
        readOnly
        block={!inline}
        style={{
          display: inline ? "inline-block" : "block",
          fontSize: "1em",
          minWidth: "10px",
          minHeight: "1.2em",
        }}
      />
    </span>
  );
};

/* ─── Main Component ─── */

const SlateRenderer = ({ slate, customRenderers = {} }) => {
  /**
   * CONTENT NORMALIZATION LOGIC
   * 1. Null check.
   * 2. String fallback: handles either JSON strings or legacy HTML strings.
   * 3. Recursive wrap: ensures root objects are treated as the start of a render tree.
   */
  if (!slate) return null;

  if (typeof slate === "string") {
    try {
      const parsed = JSON.parse(slate);
      if (
        Array.isArray(parsed) ||
        (typeof parsed === "object" && parsed !== null)
      ) {
        return (
          <SlateRenderer slate={parsed} customRenderers={customRenderers} />
        );
      }
    } catch {
      // Treat as legacy HTML if JSON parsing fails
    }
    return <>{parse(slate)}</>;
  }

  if (!Array.isArray(slate)) {
    if (typeof slate === "object") {
      return <SlateNode node={slate} customRenderers={customRenderers} />;
    }
    return null;
  }

  return (
    <>
      {slate.map((node, index) => (
        <SlateNode key={index} node={node} customRenderers={customRenderers} />
      ))}
    </>
  );
};

/**
 * SlateNode
 * The recursive heart of the renderer. Branches into leaf nodes (text) or element nodes.
 */
const SlateNode = ({ node, customRenderers = {} }) => {
  if (!node) return null;

  // CUSTOM RENDERER HOOK: Allows parent components to override rendering for specific types.
  if (node.type && customRenderers[node.type]) {
    return customRenderers[node.type](node);
  }

  /* ─── Leaf Nodes (Text) ─── */
  if (node.text !== undefined) {
    let children = node.text;

    // Apply formatting styles sequentially
    if (node.bold) children = <strong>{children}</strong>;
    if (node.code) children = <code>{children}</code>;
    if (node.italic) children = <em>{children}</em>;
    if (node.underline) children = <u>{children}</u>;

    return <>{children}</>;
  }

  /* ─── Element Nodes ─── */
  const children = node.children
    ? node.children.map((n, i) => (
        <SlateNode key={i} node={n} customRenderers={customRenderers} />
      ))
    : null;

  switch (node.type) {
    case "block-quote":
      return <BlockQuote>{children}</BlockQuote>;
    case "bulleted-list":
      return <ul>{children}</ul>;
    case "heading-one":
      return <h1>{children}</h1>;
    case "heading-two":
      return <h2>{children}</h2>;
    case "list-item":
      return <li>{children}</li>;
    case "numbered-list":
      return <ol>{children}</ol>;
    case "image":
      return <Image src={node.url} alt="content" />;
    case "link":
      return (
        <a href={node.url} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    case "math":
      return <MathFieldRenderer latex={node.latex} inline={node.inline} />;
    case "table":
      return (
        <StyledTable>
          <tbody>{children}</tbody>
        </StyledTable>
      );
    case "table-row":
      return <tr>{children}</tr>;
    case "table-cell":
      return (
        <StyledTd style={{ backgroundColor: node.background }}>
          {children}
        </StyledTd>
      );
    case "paragraph":
      return (
        <p style={{ margin: "0 0 10px 0", textAlign: node.align || "left" }}>
          {children}
        </p>
      );

    case "inline-blank":
      /**
       * INLINE BLANK FALLBACK
       * Renders a placeholder space with an underline.
       * Used in the editor and in generic views before interactive inputs are injected.
       */
      return (
        <span
          className="fill-in-blank"
          style={{
            display: "inline-block",
            minWidth: "30px",
            borderBottom: "1px solid black",
            margin: "0 4px",
          }}
        >
          &nbsp;&nbsp;&nbsp;&nbsp;
        </span>
      );

    default:
      return <>{children}</>;
  }
};

export default SlateRenderer;
