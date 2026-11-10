/**
 * @file textChunker.js
 * @description Paragraph-aware, token-safe text chunking utility for the
 * PDF question parser pipeline. Splits raw extracted text into chunks that
 * stay within AI model token limits while respecting paragraph and question
 * boundaries.
 *
 * WHY: AI models used by the parser have per-request token limits as low as
 * 6,000 TPM (llama-3.1-8b-instant) to 8,000 TPM (gpt-oss-120b). The system
 * instruction alone consumes ~1,600 tokens, leaving ~1,500-3,000 tokens for
 * user text. Sending a full PDF page (~4,000+ tokens) causes 413 errors.
 *
 * STRATEGY:
 *   1. Split on paragraph boundaries (double newlines).
 *   2. Detect question number patterns to avoid splitting mid-question.
 *   3. Group paragraphs into chunks that fit within MAX_CHARS_PER_CHUNK.
 *   4. Oversized single paragraphs are split at sentence boundaries.
 *
 * @exports chunkText — main function
 * @exports CHUNK_CONSTANTS — exported constants for testing
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Max characters of raw user text per AI request.
 * All models have 128K+ context windows (131,072 for Groq, 128,000 for Nvidia),
 * so context size is NOT the bottleneck. The real limit is Groq free-tier TPM
 * (6,000 tokens/min), but with per-model retry + inter-batch delays, we can
 * safely send ~3,000 tokens (~12,000 chars / ~2,000 words) per chunk.
 * Fewer, larger chunks = fewer API calls = less rate-limit pressure.
 */
const MAX_CHARS_PER_CHUNK = 12000;

/** Don't create batches smaller than this (merge into previous chunk). */
const MIN_CHARS_PER_CHUNK = 200;

/** Regex to detect the start of a new question (question number pattern). */
const QUESTION_BOUNDARY_REGEX =
  /^(?:Q\.?\s*\d+[.):\s]|\d+[.):\s]|\(\d+\)|\([ivxlc]+\))/;

/** Regex to find sentence-ending punctuation followed by whitespace. */
const SENTENCE_END_REGEX = /[.?!]\s+/g;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Splits raw text into logical paragraphs. A paragraph break is defined as:
 *   - Two or more consecutive newlines, OR
 *   - A single newline where the next line starts with a question number
 *
 * @param {string} text - Raw text to split
 * @returns {string[]} Array of paragraph strings (trimmed, non-empty)
 */
function splitIntoParagraphs(text) {
  if (!text || typeof text !== "string") return [];

  // First, split on double newlines (standard paragraph breaks)
  const roughBlocks = text.split(/\n{2,}/);

  const paragraphs = [];

  for (const block of roughBlocks) {
    // Within each block, check for question boundaries on single newlines
    const lines = block.split(/\n/);
    let currentParagraph = "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // If line starts a new question AND we have accumulated text, flush
      if (
        QUESTION_BOUNDARY_REGEX.test(trimmedLine) &&
        currentParagraph.trim()
      ) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = trimmedLine;
      } else {
        // Continue building current paragraph
        currentParagraph += (currentParagraph ? " " : "") + trimmedLine;
      }
    }

    // Flush remaining text in the block
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }
  }

  return paragraphs;
}

/**
 * Splits a single oversized paragraph at the nearest sentence boundary
 * to create sub-chunks that fit within the character limit.
 *
 * @param {string} paragraph - A single paragraph exceeding MAX_CHARS_PER_CHUNK
 * @param {number} maxChars - Maximum character count per sub-chunk
 * @returns {string[]} Array of sub-paragraph strings
 */
function splitAtSentenceBoundary(paragraph, maxChars) {
  const subChunks = [];
  let remaining = paragraph;

  while (remaining.length > maxChars) {
    // Search for the last sentence-ending punctuation within the limit
    const window = remaining.substring(0, maxChars);
    let lastSentenceEnd = -1;

    SENTENCE_END_REGEX.lastIndex = 0; // Reset stateful regex
    let match;
    while ((match = SENTENCE_END_REGEX.exec(window)) !== null) {
      lastSentenceEnd = match.index + match[0].length;
    }

    if (lastSentenceEnd > MIN_CHARS_PER_CHUNK) {
      // Split at sentence boundary
      subChunks.push(remaining.substring(0, lastSentenceEnd).trim());
      remaining = remaining.substring(lastSentenceEnd).trim();
    } else {
      // No good sentence boundary — split at word boundary near the limit
      const lastSpace = window.lastIndexOf(" ");
      if (lastSpace > MIN_CHARS_PER_CHUNK) {
        subChunks.push(remaining.substring(0, lastSpace).trim());
        remaining = remaining.substring(lastSpace).trim();
      } else {
        // Absolute fallback: hard split at maxChars (rare edge case)
        subChunks.push(remaining.substring(0, maxChars).trim());
        remaining = remaining.substring(maxChars).trim();
      }
    }
  }

  // Push the remainder
  if (remaining.trim()) {
    subChunks.push(remaining.trim());
  }

  return subChunks;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Splits raw PDF text into token-safe chunks that respect paragraph and
 * question boundaries.
 *
 * @param {string} rawText - Full raw text to chunk
 * @param {object} [options] - Optional configuration overrides
 * @param {number} [options.maxCharsPerChunk] - Override max chars per chunk
 * @returns {{ text: string, index: number }[]} Array of chunks with index
 */
export function chunkText(rawText, options = {}) {
  const maxChars = options.maxCharsPerChunk || MAX_CHARS_PER_CHUNK;

  if (!rawText || typeof rawText !== "string") {
    return [];
  }

  const trimmed = rawText.trim();

  // Short-circuit: if the entire text fits in one chunk, return as-is
  if (trimmed.length <= maxChars) {
    return [{ text: trimmed, index: 0 }];
  }

  const paragraphs = splitIntoParagraphs(trimmed);
  const chunks = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    // Case 1: Single paragraph exceeds the limit — split it further
    if (para.length > maxChars) {
      // Flush the current chunk first
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // Split the oversized paragraph at sentence boundaries
      const subChunks = splitAtSentenceBoundary(para, maxChars);
      for (const sub of subChunks) {
        chunks.push(sub);
      }
      continue;
    }

    // Case 2: Adding this paragraph would exceed the limit
    const candidateLength = currentChunk
      ? currentChunk.length + 2 + para.length // +2 for the "\n\n" separator
      : para.length;

    if (candidateLength > maxChars) {
      // Flush current chunk (if it has content)
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = para;
    } else {
      // Case 3: Fits — append to current chunk
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }

  // Flush final chunk
  if (currentChunk.trim()) {
    // If final chunk is too small, merge with previous
    if (currentChunk.trim().length < MIN_CHARS_PER_CHUNK && chunks.length > 0) {
      const lastChunk = chunks[chunks.length - 1];
      // Only merge if it doesn't exceed the limit; otherwise keep as separate
      if (lastChunk.length + 2 + currentChunk.trim().length <= maxChars) {
        chunks[chunks.length - 1] = lastChunk + "\n\n" + currentChunk.trim();
      } else {
        chunks.push(currentChunk.trim());
      }
    } else {
      chunks.push(currentChunk.trim());
    }
  }

  // Convert to indexed objects
  return chunks.map((text, index) => ({ text, index }));
}

/** Exported constants for testing */
export const CHUNK_CONSTANTS = {
  MAX_CHARS_PER_CHUNK,
  MIN_CHARS_PER_CHUNK,
  QUESTION_BOUNDARY_REGEX,
};
