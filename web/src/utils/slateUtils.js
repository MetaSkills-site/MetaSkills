/**
 * FILE PURPOSE: Utility layer for parsing, traversing, and serializing Slate JSON content structures.
 *
 * DEPENDENCIES:
 * - slate: Core types and verification checks.
 *
 * EXPORTS:
 * - isEmptySlate: Boolean check for default editor states.
 * - extractBlanks: Collects ground-truth answers from nested blank nodes.
 * - convertSlateToHtml: Recursive serializer for rendering content in non-Slate contexts.
 * - extractTextFromSlate: Deep traversal to extract raw string content.
 *
 * INTERCONNECT:
 * - Primary content processing engine for questionValidation, OptionCard, and SlateRenderer.
 */

import { Text } from "slate";

const escapeHtml = (text) => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Validates if the Slate content is empty.
 * Checks for default empty state (single paragraph with empty text).
 * @param {Array} value - Slate JSON value
 * @returns {boolean}
 */
export const isEmptySlate = (value) => {
  if (!value || !Array.isArray(value) || value.length === 0) return true;
  // Check for single empty paragraph
  if (
    value.length === 1 &&
    value[0].type === "paragraph" &&
    value[0].children &&
    value[0].children.length === 1 &&
    value[0].children[0].text === ""
  ) {
    return true;
  }
  return false;
};

/**
 * Extracts filling-the-blanks answers from Slate nodes.
 * @param {Array} nodes
 * @returns {Array} List of extracted blank answers
 */
export const extractBlanks = (nodes) => {
  const blanks = [];
  const traverse = (node) => {
    if (node.type === "blank" || node.type === "inline-blank") {
      const answer = node.correctAnswer || node.data?.correctAnswer;
      if (answer) {
        blanks.push(answer);
      }
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return blanks;
};

/**
 * Serializes Slate nodes to HTML string.
 * Handles: paragraph, math, image, table, block-quote, numbered-list, bulleted-list, link, blank.
 * Handles markings: bold, italic, underline, code.
 * @param {Object} node
 * @returns {string} HTML string
 */
export const convertSlateToHtml = (node) => {
  if (Array.isArray(node)) {
    return node.map((n) => convertSlateToHtml(n)).join("");
  }
  if (Text.isText(node)) {
    let string = escapeHtml(node.text);
    if (node.bold) string = `<strong>${string}</strong>`;
    if (node.italic) string = `<em>${string}</em>`;
    if (node.underline) string = `<u>${string}</u>`;
    if (node.code) string = `<code>${string}</code>`;
    return string;
  }

  if (!node) return "";

  const children = node.children
    ? node.children.map((n) => convertSlateToHtml(n)).join("")
    : "";

  switch (node.type) {
    case "block-quote":
      return `<blockquote>${children}</blockquote>`;
    case "bulleted-list":
      return `<ul>${children}</ul>`;
    case "heading-one":
      return `<h1>${children}</h1>`;
    case "heading-two":
      return `<h2>${children}</h2>`;
    case "list-item":
      return `<li>${children}</li>`;
    case "numbered-list":
      return `<ol>${children}</ol>`;
    case "paragraph":
      return `<p>${children}</p>`;
    case "link":
      return `<a href="${escapeHtml(node.url)}">${children}</a>`;
    case "image":
      return `<img src="${escapeHtml(node.url)}" alt="uploaded" style="max-width: 100%; height: auto;" />`;
    case "math":
      return `<math-field read-only style="display:inline-block">${escapeHtml(node.latex)}</math-field>`;
    case "table":
      return `<table class="slate-table"><tbody>${children}</tbody></table>`;
    case "table-row":
      return `<tr>${children}</tr>`;
    case "table-cell":
      return `<td>${children}</td>`;
    case "blank":
    case "inline-blank":
      // Render blank as a placeholder span
      return `<span class="fill-in-blank" style="display:inline-block; min-width:30px; border-bottom:1px solid black;">&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
    default:
      return children;
  }
};

/**
 * Extracts plain text from Slate nodes.
 * @param {Array|Object|String} node
 * @returns {string} Plain text
 */
export const extractTextFromSlate = (node) => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) {
    return node.map(extractTextFromSlate).join(" ");
  }
  if (node.text) {
    return node.text;
  }
  if (node.children) {
    return node.children.map(extractTextFromSlate).join("");
  }
  return "";
};

/**
 * Parses simple markdown (paragraphs, bold, inline/block LaTeX) to Slate JSON.
 *
 * Handles:
 *  - Block math:   $$...$$  → { type:"math", inline:false }
 *  - Inline math:  $...$    → { type:"math", inline:true }  (with text guards)
 *  - Bold:         **text** or __text__
 *  - Italic:       *text*  or  _text_
 *  - Paragraphs:   separated by \n or \n\n
 *
 * @param {string} markdown - Input markdown string from AI
 * @returns {Array} Slate JSON array
 */
export const markdownToSlate = (markdown) => {
  if (!markdown || typeof markdown !== "string") {
    return [{ type: "paragraph", children: [{ text: "" }] }];
  }

  // FIX 1: Normalize Windows-style line endings (\r\n) and bare \r to \n
  // so that newline-splitting works regardless of which AI model served the text.
  const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split on block math delimiters ($$...$$).
  // Using a capture group means odd-indexed entries are block-math content (no $$),
  // even-indexed entries are surrounding text.
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  const topLevelBlocks = normalized.split(blockRegex);

  const slateStructure = [];

  /**
   * Parses an inline text string into Slate leaf/inline children.
   * Handles inline math, bold, and italic.
   *
   * FIX 2: Slate requires that inline void nodes (math) are always
   * surrounded by text nodes inside a paragraph's children array.
   * After building the raw children list we insert empty-string guards
   * so Slate's normalizer never silently deletes the math nodes.
   */
  const parseInlineAndText = (textStr) => {
    // Regex matches inline math ($...$), bold (**...** / __...__), and italic (*...* / _..._)
    // Capturing these allows splitting the string while keeping the delimiters for identification.
    const tokenRegex =
      /(\$[^$\n]+\$|\*\*[^*]+\*\*|__[^_]+__|[*_][^*_\n]+[*_])/g;
    const parts = textStr.split(tokenRegex);
    const raw = [];

    parts.forEach((part) => {
      if (!part) return;

      // Detect inline math: starts/ends with single $ and has content in between
      if (
        part.length > 2 &&
        part.startsWith("$") &&
        part.endsWith("$") &&
        !part.startsWith("$$")
      ) {
        // Create an inline math node with child text guard for Slate compatibility
        raw.push({
          type: "math",
          latex: part.slice(1, -1).trim(),
          inline: true,
          children: [{ text: "" }],
        });
      } else if (
        part.startsWith("**") &&
        part.endsWith("**") &&
        part.length > 4
      ) {
        // Bold formatting (Markdown standard)
        raw.push({ text: part.slice(2, -2), bold: true });
      } else if (
        part.startsWith("__") &&
        part.endsWith("__") &&
        part.length > 4
      ) {
        // Alternative bold syntax
        raw.push({ text: part.slice(2, -2), bold: true });
      } else if (
        ((part.startsWith("*") && part.endsWith("*")) ||
          (part.startsWith("_") && part.endsWith("_"))) &&
        part.length > 2
      ) {
        // Italic formatting
        raw.push({ text: part.slice(1, -1), italic: true });
      } else {
        // Plain text segment
        raw.push({ text: part });
      }
    });

    if (raw.length === 0) return [{ text: "" }];

    // Insert empty-string text guards to ensure Slate stability.
    // Standard Slate requirement: Inline void elements MUST be flanked by text nodes.
    const guarded = [];
    raw.forEach((node, i) => {
      const isVoid = node.type === "math";
      const prevIsVoid = i > 0 && raw[i - 1].type === "math";

      // Ensure the array starts with a text node if the first element is a void math node
      if (i === 0 && isVoid) guarded.push({ text: "" });

      // Insert a separator text node between two consecutive void nodes
      if (isVoid && prevIsVoid) guarded.push({ text: "" });

      guarded.push(node);

      // Ensure the array ends with a text node if the last element is a void node
      if (i === raw.length - 1 && isVoid) guarded.push({ text: "" });
    });

    return guarded;
  };

  topLevelBlocks.forEach((block, index) => {
    if (index % 2 === 1) {
      // Odd index indicates content captured inside $$ delimiters (Block Math)
      const latex = block.trim();
      if (!latex) return; // Ignore empty block math markers
      slateStructure.push({
        type: "math",
        latex,
        inline: false,
        children: [{ text: "" }],
      });
    } else {
      // Even index indicates surrounding text/inline markdown
      // Skip segments that are entirely whitespace (e.g. gaps between adjacent math blocks)
      if (!block.trim()) return;

      // Group text into paragraphs by splitting on double newlines
      const paraGroups = block.trim().split(/\n\n+/);
      paraGroups.forEach((group) => {
        if (!group.trim()) return;

        // Further split each group into lines (single newlines)
        const lines = group.split(/\n/);
        lines.forEach((line) => {
          // Add a paragraph block for each meaningful line of text
          if (!line.trim() && lines.length > 1) return;
          slateStructure.push({
            type: "paragraph",
            children: parseInlineAndText(line),
          });
        });
      });
    }
  });

  return slateStructure.length > 0
    ? slateStructure
    : [{ type: "paragraph", children: [{ text: "" }] }];
};

/**
 * Converts markdown text to Slate JSON, with automatic inline-blank node
 * insertion for fill-in-the-blank questions.
 *
 * Patterns like "___", "____", "_____" (3+ underscores) are converted to
 * { type: "inline-blank", correctAnswer: "", children: [{ text: "" }] }
 *
 * If a `correctAnswers` array is provided, answers are assigned to blanks
 * in order of appearance.
 *
 * @param {string} markdown - Input text from AI with _____ blanks
 * @param {string[]} correctAnswers - Ordered array of correct answers
 * @returns {Array} Slate JSON array with inline-blank nodes
 */
export const markdownToSlateWithBlanks = (markdown, correctAnswers = []) => {
  if (!markdown || typeof markdown !== "string") {
    return [{ type: "paragraph", children: [{ text: "" }] }];
  }

  // First get the standard Slate structure
  const baseSlate = markdownToSlate(markdown);

  // Post-process: find text nodes containing 3+ consecutive underscores
  // and split them into text + inline-blank + text
  let blankIndex = 0;
  const BLANK_PATTERN = /_{3,}/g;

  const processChildren = (children) => {
    const result = [];
    for (const child of children) {
      if (child.text !== undefined) {
        // This is a text leaf — check for blank patterns
        const text = child.text;
        const parts = [];
        let lastIndex = 0;
        let match;

        BLANK_PATTERN.lastIndex = 0;
        while ((match = BLANK_PATTERN.exec(text)) !== null) {
          // Add text before the blank
          if (match.index > lastIndex) {
            parts.push({ ...child, text: text.slice(lastIndex, match.index) });
          }
          // Add the inline-blank node
          parts.push({
            type: "inline-blank",
            correctAnswer: correctAnswers[blankIndex] || "",
            children: [{ text: "" }],
          });
          blankIndex++;
          lastIndex = match.index + match[0].length;
        }

        // Add remaining text after last blank
        if (lastIndex < text.length) {
          parts.push({ ...child, text: text.slice(lastIndex) });
        }

        if (parts.length > 0) {
          // Ensure text guards around inline-blank nodes (Slate void requirement)
          const guarded = [];
          parts.forEach((part, i) => {
            const isVoid = part.type === "inline-blank";
            const prevIsVoid = i > 0 && parts[i - 1].type === "inline-blank";
            if (i === 0 && isVoid) guarded.push({ text: "" });
            if (isVoid && prevIsVoid) guarded.push({ text: "" });
            guarded.push(part);
            if (i === parts.length - 1 && isVoid) guarded.push({ text: "" });
          });
          result.push(...guarded);
        } else {
          result.push(child);
        }
      } else if (child.children) {
        // Recurse into element children
        result.push({ ...child, children: processChildren(child.children) });
      } else {
        result.push(child);
      }
    }
    return result;
  };

  return baseSlate.map((node) => {
    if (node.children) {
      return { ...node, children: processChildren(node.children) };
    }
    return node;
  });
};
