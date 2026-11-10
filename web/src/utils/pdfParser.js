/**
 * @file pdfParser.js
 * @description Utility for extracting text from PDF files using a dual strategy:
 * 1. pdfjs-dist for text-layer extraction (fast, works for text-based PDFs)
 * 2. Tesseract.js OCR fallback for image-heavy/scanned PDFs
 *
 * ARCHITECTURE: Async Generator Pattern
 * - parsePdf yields results page-by-page to enable iterative processing.
 * - First yield is { type: "info", pageCount } metadata.
 * - Subsequent yields are { type: "page", text, pageNumber, method } per page.
 *
 * @dependencies
 * - pdfjs-dist: PDF rendering and text extraction
 * - tesseract.js: OCR engine for image-based text extraction
 *
 * @exports parsePdf (default) — async generator
 * @interconnections Used by BulkImportPage.jsx (iterative loop)
 */

import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";

// Configure pdf.js worker — use CDN-hosted worker for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_PAGES = 30;
const MIN_CHARS_PER_PAGE = 50; // Below this threshold, OCR is triggered

/**
 * Validates the input file before processing.
 * @param {File} file - The file to validate
 * @throws {Error} If validation fails
 */
function validateFile(file) {
  if (!file) {
    throw new Error("No file provided.");
  }
  if (file.type !== "application/pdf") {
    throw new Error("Invalid file type. Only PDF files are accepted.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please use a smaller PDF.`,
    );
  }
}

/**
 * Async generator: Extracts text from a PDF using pdfjs-dist text layer.
 * Yields { text, pageNumber } for each page.
 * @param {pdfjsLib.PDFDocumentProxy} pdfDoc - Loaded PDF document
 * @param {number} startPage - Page number to start from (1-indexed)
 * @yields {{ text: string, pageNumber: number }}
 */
async function* extractTextViaPdfjs(pdfDoc, startPage = 1) {
  for (let i = startPage; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    yield { text: pageText, pageNumber: i };
  }
}

/**
 * Async generator: Extracts text from a PDF using Tesseract.js OCR.
 * Renders each page to a canvas, runs OCR, then cleans up memory.
 * @param {pdfjsLib.PDFDocumentProxy} pdfDoc - Loaded PDF document
 * @yields {{ text: string, pageNumber: number }}
 */
async function* extractTextViaTesseract(pdfDoc) {
  const worker = await createWorker("eng");

  try {
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale = better OCR accuracy

      // Render page to canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      // Run OCR on the rendered image
      const {
        data: { text },
      } = await worker.recognize(canvas);

      // Explicit canvas cleanup to free memory between pages
      canvas.width = 0;
      canvas.height = 0;

      yield { text, pageNumber: i };
    }
  } finally {
    await worker.terminate();
  }
}

/**
 * Main PDF parser — async generator with dual strategy
 * (pdfjs text extraction → Tesseract OCR fallback).
 *
 * Yields:
 *   1. { type: "info", pageCount: number } — once, at start
 *   2. { type: "page", text: string, pageNumber: number, method: "pdfjs" | "tesseract" } — per page
 *
 * Strategy decision is made once based on Page 1's character density:
 * - If Page 1 has >= MIN_CHARS_PER_PAGE chars via pdfjs → use pdfjs for all pages
 * - Otherwise → fall back to Tesseract OCR for all pages (including re-scanning Page 1)
 *
 * @param {File} file - The PDF file to parse
 * @yields {{ type: string, [key: string]: any }}
 * @throws {Error} On validation failure or extraction error
 */
export default async function* parsePdf(file) {
  // Step 1: Validate
  validateFile(file);

  // Step 2: Load PDF with pdfjs-dist
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  if (pdfDoc.numPages > MAX_PAGES) {
    throw new Error(
      `PDF has ${pdfDoc.numPages} pages, but the maximum allowed is ${MAX_PAGES}. Please split the document.`,
    );
  }

  // Step 3: Yield metadata — caller uses this to set up progress tracking
  yield { type: "info", pageCount: pdfDoc.numPages };

  // Step 4: Strategy decision — probe Page 1 with pdfjs text extraction
  const page1 = await pdfDoc.getPage(1);
  const page1TextContent = await page1.getTextContent();
  const page1Text = page1TextContent.items.map((item) => item.str).join(" ");
  const useOCR = page1Text.length < MIN_CHARS_PER_PAGE;

  if (useOCR) {
    // Scanned/image PDF — yield all pages via Tesseract OCR (including Page 1)
    for await (const page of extractTextViaTesseract(pdfDoc)) {
      yield { type: "page", ...page, method: "tesseract" };
    }
  } else {
    // Text-based PDF — yield Page 1 (already extracted), then remaining pages
    yield { type: "page", text: page1Text, pageNumber: 1, method: "pdfjs" };

    // Yield remaining pages (2..N) via pdfjs generator
    for await (const page of extractTextViaPdfjs(pdfDoc, 2)) {
      yield { type: "page", ...page, method: "pdfjs" };
    }
  }
}
