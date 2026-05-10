# Project Research Summary

**Project:** Iterative PDF Import Workflow
**Domain:** Document Processing / EdTech
**Researched:** 2024-05-31
**Confidence:** HIGH

## Executive Summary

The research concludes that a robust PDF import workflow should move away from server-side batch processing toward a frontend-centric, iterative "streaming" pipeline. By utilizing `pdf-lib` and `Tesseract.js` within the browser, we can provide immediate feedback to users as each page is processed. This approach minimizes server load and allows for real-time human intervention/review while the rest of the document is still being analyzed.

The recommended approach involves splitting the PDF into single-page blobs, queuing them for OCR using a worker pool, and sequentially sending the text to an AI parser. This iterative loop ensures that large files do not crash the system and that questions split across page boundaries can be handled by providing small overlapping text fragments to the AI.

The primary risks identified are browser memory exhaustion (OOM) from accumulated blobs/canvases and potential context loss for questions that span multiple pages. These are mitigated by aggressive memory management (URL revocation) and a "last-10%-overlap" strategy for AI parsing context.

## Key Findings

### Recommended Stack

The stack focuses on browser-side performance and backend data integrity.

**Core technologies:**
- **Tesseract.js (^5.x):** Optical Character Recognition — Performs OCR in Web Workers to keep the UI responsive.
- **pdf-lib (^1.17.x):** PDF Manipulation — Splitting large PDFs into manageable single-page blobs without server round-trips.
- **pdfjs-dist (^4.x):** PDF Rendering — Renders PDF pages to high-resolution canvases for OCR processing.
- **Mongoose / MongoDB:** Data Persistence — Using multi-document transactions to ensure "all-or-nothing" imports of the final question set.

### Expected Features

**Must have (table stakes):**
- **Page-by-Page Progress:** Visual indicators (progress bars) for each individual page and overall document status.
- **All-or-Nothing Import:** Ensuring a partially failed import doesn't leave orphan records in the database.

**Should have (competitive):**
- **Streaming Review UI:** Allowing users to start editing/approving questions from Page 1 while later pages are still being processed.
- **AI-Assisted Tagging:** Automatically structuring raw OCR text into JSON-formatted questions, options, and metadata.

**Defer (v2+):**
- **Auto-Merging:** Intelligent merging of multiple separate PDF files into a single context.

### Architecture Approach

A pipeline-based architecture where data flows from raw PDF -> Page Blobs -> OCR Text -> AI JSON -> Review State -> DB.

**Major components:**
1. **OCR Scheduler:** Manages a pool of Tesseract workers to parallelize page processing (limited by hardware concurrency).
2. **AI Accumulator:** A state manager that holds partial results and handles the "overlapping context" needed to parse questions split across pages.
3. **Transaction Service:** A backend module that performs bulk validation and atomic insertion of the final structured data.

### Critical Pitfalls

1. **Memory Overload (Blob Leak):** Failure to revoke object URLs or clear canvases will crash the browser on large PDFs. **Prevention:** Implement strict cleanup hooks after each page finishes.
2. **Transaction Timeouts:** MongoDB default 60s limit can block large imports. **Prevention:** Use chunked validation but keep the final write atomic.
3. **Context Clipping:** AI missing parts of questions that span pages. **Prevention:** Pass the tail end of the previous page's text as context for the next page.

## Implications for Roadmap

### Phase 1: Frontend PDF & OCR Engine
**Rationale:** The core bottleneck and most complex technical part is reliable client-side OCR. This must be solved before UI or AI logic.
**Delivers:** A working "Page Splitter" and "OCR Worker Pool" that can convert any PDF into a list of text strings.
**Addresses:** Page-by-Page Progress, PDF Splitting.
**Avoids:** Main-Thread Blocking.

### Phase 2: AI Parsing & Context Accumulation
**Rationale:** Converting raw text into structured questions is the next dependency. This phase handles the logic of questions spanning pages.
**Delivers:** An "AI Accumulator" that sends page text to LLM and merges results into a unified draft list.
**Uses:** Overlap context strategy.
**Implements:** AI-Assisted Tagging.

### Phase 3: Iterative Review UI
**Rationale:** Once data is being parsed, users need a way to see and edit it "streaming" into the page.
**Delivers:** The 'BulkImportPage' update with side-by-side PDF vs. Editor view and per-page progress bars.
**Addresses:** Streaming Review UI.

### Phase 4: Atomic Backend Import
**Rationale:** The final step is moving the reviewed data from the browser to the database securely.
**Delivers:** Mongoose Transaction-based API endpoint for bulk question creation.
**Avoids:** Data corruption from partial failures.

### Phase Ordering Rationale

- **Technical Foundation:** OCR and PDF splitting are the foundation for everything else.
- **Logic over UI:** AI parsing logic (especially page-spanning questions) is a major risk and should be solved before building the polished Review UI.
- **Frontend-First:** Since the heavy lifting is in the browser, the backend remains a simple final-stage validator.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (AI Parsing):** Specific prompting strategies to handle the "Overlap" text without duplicating questions need validation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (OCR):** Tesseract.js worker pools are well-documented.
- **Phase 4 (Backend):** Mongoose transactions are a standard industry pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Library choices are standard and well-tested. |
| Features | HIGH | Table stakes are well-defined in the competitive landscape. |
| Architecture | HIGH | Pipeline pattern is robust for this type of data-heavy flow. |
| Pitfalls | MEDIUM | Memory leaks are always a risk in JS; implementation must be rigorous. |

**Overall confidence:** HIGH

### Gaps to Address

- **Large Document Performance:** While 50-page PDFs are fine, 500-page PDFs might need "virtual scrolling" or aggressive memory offloading to disk (IndexedDB).
- **AI Token Cost:** Real-time page-by-page AI parsing could get expensive; consider a "first-pass" local heuristic to skip blank or non-question pages.

## Sources

### Primary (HIGH confidence)
- Tesseract.js v5 Documentation (Worker Pools/WASM)
- pdf-lib API Reference (Page Splitting)
- Mongoose Transaction Guide

### Secondary (MEDIUM confidence)
- PDF.js rendering benchmarks
- LLM prompt engineering patterns for document parsing

---
*Research completed: 2024-05-31*
*Ready for roadmap: yes*
