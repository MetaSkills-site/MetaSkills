/**
 * @file Markdown.jsx
 * @description A wrapper component for rendering Markdown content with LaTeX support using react-markdown.
 * It utilizes remark-math and rehype-katex to render mathematical expressions accurately.
 *
 * @dependencies
 * - react-markdown: For rendering markdown text.
 * - remark-math: For processing mathematical expressions in markdown.
 * - rehype-katex: For rendering math expressions using KaTeX.
 * - katex: Styles for mathematical symbols.
 *
 * @exports Markdown (default)
 * @interconnections Used throughout the app to display content like questions, explanations, and passages that contain markdown or math formatting.
 */

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function Markdown({ content }) {
  return (
    <ReactMarkdown
      // Add remarkMath to support math expressions like $x^2$ and rehypeKatex for rendering them
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  );
}
