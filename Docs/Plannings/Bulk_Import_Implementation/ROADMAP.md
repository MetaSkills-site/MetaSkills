# Roadmap: Bulk Question Import Implementation

This document outlines the unified execution roadmap for the bulk question import feature. It integrates the core workflow plan with the necessary architectural gap solutions to ensure a robust, reliable, and user-friendly implementation.

## Phase 1: Frontend Text Extraction & Chunking Foundation
**Goal:** Establish a reliable mechanism to extract text from PDFs and prepare it for AI processing without hitting token limits.

- [x] **Dependency Installation:** Install `tesseract.js` (and optionally `pdfjs-dist`) on the frontend.
- [x] **Text Extraction & Chunking Utility:** Build `src/utils/pdfParser.js` to handle PDF ingestion. Implement **chunking logic** (e.g., splitting by ~10,000 characters or natural page boundaries) to mitigate AI truncation and token limits.
- [x] **UI Component - Uploader:** Create `PdfUploader.jsx` allowing admins to select a PDF.
- [x] **Limitation Banner:** Add a prominent warning in the upload UI explicitly stating that the parser currently **only extracts MCQs**, and other formats will be ignored.
- [x] **Validation:** Upload a sample PDF and verify the accurately chunked raw text output in the console.

## Phase 2: AI Parsing Backend Integration
**Goal:** Configure the AI proxy to securely and accurately transform raw text chunks into structured, formatted JSON.

- [x] **Prompt Engineering (Markdown Support):** Design a strict Gemini prompt enforcing a JSON schema for questions. Explicitly instruct the model to output rich text (bolding, lists, etc.) using **standard Markdown**.
- [x] **Controller Update:** Update `genai.controller.js` to include the `parseQuestionsText` endpoint. Ensure it gracefully handles malformed AI responses.
- [x] **Route Configuration:** Expose `POST /api/genai/parse-questions`.
- [x] **Validation:** Send raw text chunks to the new endpoint via Postman/curl and verify the structured JSON array response containing proper Markdown formatting.

## Phase 3: Frontend Preview & Curation UI Construction
**Goal:** Build a robust, split-view interface for admins to review AI drafts against the original PDF, ensuring formatting and context are preserved.

- [x] **Split View UI:** Build `PreviewEditor.jsx` featuring a **side-by-side split view** (Left: Original PDF native view, Right: AI-generated question drafts) to solve context and image detachment issues.
- [x] **Markdown-to-Slate Conversion:** Implement a robust converter on the frontend to parse the AI's Markdown strings into accurate **Slate.js JSON (ASTs)**, preserving semantic formatting for the rich text editor.
- [x] **Editor Integration & Attachments:** Embed the existing Slate.js Editor for question fields. Enable manual image attachments leveraging existing `utils/storage.js` logic within the curation pane.
- [x] **Data Mapping (No Client IDs):** Implement mapping logic for the final payload. **Crucially eliminate client-side ObjectID generation**; submit drafts strictly without `_id` fields.
- [x] **Validation:** Review a draft, verify formatting preservation, attach an image, and inspect the final constructed payload before submission to ensure no client IDs exist.

## Phase 4: Bulk Insertion Backend Logic
**Goal:** Safely persist curated questions to the database while maintaining absolute data integrity and relational linking.

- [x] **Validation Middleware:** Create strict Joi/Zod validators for the incoming bulk payload to prevent malformed data.
- [x] **Bi-Directional Reference Mapping:** Implement `bulkImportQuestions` in `quiz.controller.js`. The endpoint must receive `moduleId`. Iterate through the payload and **inject `modules: [moduleId]`** into every question object prior to insertion.
- [x] **Transactional Insertion:** 
    - Start Mongoose Session / Transaction.
    - Execute `Questions.insertMany()` (allowing Mongoose to natively generate ObjectIDs).
    - Extract the newly generated `_id`s.
    - Update the parent `Module` via `Module.findByIdAndUpdate(..., { $push: { questionIds: { $each: newIds } } })`.
    - Commit or Abort Transaction.
- [x] **Route Configuration:** Expose `POST /api/quiz/bulk-import`.
- [x] **Validation:** Write a standalone test script (`_test_bulk_import.js`) to simulate a payload and verify Mongoose ID generation, insertion, and module linking without frontend interaction.

## Phase 5: Iterative PDF Import Workflow
**Goal:** Implement a robust, page-by-page PDF processing flow with a sliding window AI strategy and real-time progress updates.

- [ ] **Generator-based PDF Parser:** Refactor `pdfParser.js` into an async generator that yields text page-by-page. (Plan: 05-01)
- [ ] **Sliding Window AI Strategy:** Update backend prompts and controllers to handle `previousTail` context and return `residualText` for question continuity across pages. (Plan: 05-02)
- [ ] **Progressive Frontend Loop:** Update `BulkImportPage.jsx` with an iterative loop that updates per-page progress and appends drafts incrementally. (Plan: 05-03)
- [ ] **Non-MCQ Support & Validation:** Ensure full support for Short Answer and Fill-in-the-Blank question types, including robust frontend validation.
- [ ] **Full Integration Validation:** Perform manual E2E tests with complex PDFs containing split questions and multiple types.

---
*Note: This phase replaces the original Phase 5 "End-to-End Integration & Polish" with more advanced iterative processing capabilities.*
