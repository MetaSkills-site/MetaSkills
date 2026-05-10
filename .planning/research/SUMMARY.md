# Research Summary: Iterative PDF Import

## Executive Summary
The Iterative PDF Import system is designed to transform complex, multi-page PDFs into structured question banks using a "Streaming" approach. Unlike traditional batch processing which forces users to wait for the entire document, this architecture processes pages individually in the frontend using `Tesseract.js` for OCR and LLMs for parsing. This allows for immediate user feedback and parallelized workflows.

The core strategy moves the heavy lifting (OCR and initial parsing) to the client-side to save server resources and improve UX, while maintaining data integrity through backend MongoDB transactions. The primary risks involve browser memory management (handling many large blobs) and maintaining question continuity when a question spans multiple pages. By implementing a "Context Overflow" strategy and a robust page-level state machine, we can provide a reliable, high-performance import experience.

## Key Findings

### From STACK.md
- **Frontend Heavy:** Uses `pdf-lib` for splitting, `Tesseract.js` (with Worker Pools) for OCR, and `pdfjs-dist` for rendering.
- **Backend Reliability:** Relies on Mongoose Transactions (`startSession`) to ensure "All-or-Nothing" imports, preventing partial/corrupt data.
- **Concurrency:** Employs `p-map` or similar for controlling parallel AI requests to avoid rate limits or browser hanging.

### From FEATURES.md
- **Streaming UI:** Users can review Page 1 while Page 20 is still being processed.
- **Side-by-Side Validation:** Essential differentiator where the user sees the original PDF canvas next to the extracted text.
- **Incremental Progress:** Page-by-page status tracking (Pending -> OCR -> AI -> Complete).

### From ARCHITECTURE.md
- **Pipeline Pattern:** PDF -> Splitter -> OCR Pool -> AI Parser -> Review Store -> Backend.
- **Overlap Strategy:** AI calls include the tail-end of the previous page to handle split-page questions.
- **Worker Recycling:** Fixed pool of 4 Tesseract workers to minimize initialization overhead.

### From PITFALLS.md
- **Memory Leaks:** Crucial to call `URL.revokeObjectURL` and clear canvases after use.
- **Transaction Timeouts:** Large imports (>200 questions) may need chunked transactions if processing exceeds 60s.
- **AI Context Fragments:** Without context-passing, questions split across pages will be corrupted.

## Implementation Specification

### 1. Data Schema for Incremental Drafts
To support persistence across sessions and protect against crashes, drafts should be stored in a dedicated `ImportSession` collection.

```typescript
// ImportSession Schema
{
  userId: ObjectId,
  filename: String,
  status: "processing" | "review" | "finalizing",
  pages: [{
    pageNumber: Number,
    status: "pending" | "ocr" | "ai" | "complete" | "error",
    ocrText: String, // Extracted raw text
    questions: [QuestionSchema], // Parsed questions from this page
    errorMessage: String
  }],
  createdAt: Date
}
```
*   **Merge Strategy**: When Page N is completed, the frontend updates the specific index in the `pages` array. If a question is a "continuation" (see AI Prompting), it is merged into the last question of Page N-1.

### 2. UI Component Design: Streaming Progress
The `ImportTracker` sidebar provides real-time feedback:

- **Component Structure**:
    - `ProgressHeader`: Overall % and total questions found.
    - `PageList`: A scrollable list of `PageCard` components.
- **PageCard States**:
    - `Pending`: Grayed out, waiting for worker availability.
    - `OCR`: Pulsing animation, showing "Reading Text...".
    - `AI`: Pulsing animation, showing "Extracting Questions...".
    - `Complete`: Green checkmark, shows count of questions found.
    - `Error`: Red alert, with a "Retry" button.

### 3. Error Handling: Retry & Skip Logic
- **Page-Level Retry**: Users can click "Retry" on an `Error` card. This re-triggers the OCR/AI pipeline for *that page only*.
- **Skip Logic**: If a page is unreadable (e.g., a diagram or low-quality scan), the user can "Skip" it. This marks the page as `skipped` in the schema, allowing the rest of the import to proceed.
- **Validation Gate**: The "Finalize Import" button is disabled until all pages are either `complete` or `skipped`.

### 4. AI Prompting for Continuity
To handle questions split across pages, the prompt uses a "Context Bridge".

**System Instruction:**
> "You are a Question Extraction AI. You will receive text from Page [N] of a document. 
> I will also provide the last 300 characters of Page [N-1] as 'PREVIOUS_CONTEXT'.
> 
> TASK:
> 1. Identify all questions on Page [N].
> 2. If the start of Page [N] completes a sentence or question from 'PREVIOUS_CONTEXT', mark the first object in your JSON output with `isContinuation: true`.
> 3. Provide the 'fragment' and the 'full_merged_question'.
> 4. Return valid JSON only."

## Roadmap Implications

### Suggested Phase Structure
1.  **Phase 1: OCR & PDF Pipeline** — Focus on `pdf-lib` splitting and `Tesseract.js` worker pool. (Standard patterns)
2.  **Phase 2: Streaming State & UI** — Implementation of the `ImportSession` schema and the Progress Sidebar. (Needs research-phase for optimal React state management)
3.  **Phase 3: AI Continuity & Parsing** — Refining prompts and implementing the "Context Bridge" logic. (Needs research-phase for prompt engineering)
4.  **Phase 4: Transactional Backend** — MongoDB transaction service for the final commit. (Standard patterns)

## Confidence Assessment
| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Tesseract.js and pdf-lib are industry standards for browser-side processing. |
| Features | HIGH | Streaming UX is well-understood in modern web apps. |
| Architecture | MEDIUM | Question continuity (splitting across pages) is the most complex logic. |
| Pitfalls | HIGH | Memory management and transaction limits are well-documented. |

### Gaps to Address
- **Mobile Support**: OCR performance on low-end mobile devices is unknown and may require a backend fallback.
- **Large Document Limits**: What is the hard limit for PDF pages before the browser crashes regardless of cleanup?

## Sources
- Tesseract.js v5 Documentation (Worker Pools)
- MongoDB Transactional Guarantees (Official Docs)
- pdf-lib API Reference
- Previous internal research on LLM Context Windows
