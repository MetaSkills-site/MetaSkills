# Roadmap: Bulk Question Import Implementation

This document outlines the unified execution roadmap for the bulk question import feature. It integrates the core workflow plan with the necessary architectural gap solutions to ensure a robust, reliable, and user-friendly implementation.

## Phase 1: Frontend Text Extraction & Chunking Foundation
**Goal:** Establish a reliable mechanism to extract text from PDFs and prepare it for AI processing without hitting token limits.

- [ ] **Dependency Installation:** Install `tesseract.js` (and optionally `pdfjs-dist`) on the frontend.
- [ ] **Text Extraction & Chunking Utility:** Build `src/utils/pdfParser.js` to handle PDF ingestion. Implement **chunking logic** (e.g., splitting by ~10,000 characters or natural page boundaries) to mitigate AI truncation and token limits.
- [ ] **UI Component - Uploader:** Create `PdfUploader.jsx` allowing admins to select a PDF.
- [ ] **Limitation Banner:** Add a prominent warning in the upload UI explicitly stating that the parser currently **only extracts MCQs**, and other formats will be ignored.
- [ ] **Validation:** Upload a sample PDF and verify the accurately chunked raw text output in the console.

## Phase 2: AI Parsing Backend Integration
**Goal:** Configure the AI proxy to securely and accurately transform raw text chunks into structured, formatted JSON.

- [ ] **Prompt Engineering (Markdown Support):** Design a strict Gemini prompt enforcing a JSON schema for questions. Explicitly instruct the model to output rich text (bolding, lists, etc.) using **standard Markdown**.
- [ ] **Controller Update:** Update `genai.controller.js` to include the `parseQuestionsText` endpoint. Ensure it gracefully handles malformed AI responses.
- [ ] **Route Configuration:** Expose `POST /api/genai/parse-questions`.
- [ ] **Validation:** Send raw text chunks to the new endpoint via Postman/curl and verify the structured JSON array response containing proper Markdown formatting.

## Phase 3: Frontend Preview & Curation UI Construction
**Goal:** Build a robust, split-view interface for admins to review AI drafts against the original PDF, ensuring formatting and context are preserved.

- [ ] **Split View UI:** Build `PreviewEditor.jsx` featuring a **side-by-side split view** (Left: Original PDF native view, Right: AI-generated question drafts) to solve context and image detachment issues.
- [ ] **Markdown-to-Slate Conversion:** Implement a robust converter on the frontend to parse the AI's Markdown strings into accurate **Slate.js JSON (ASTs)**, preserving semantic formatting for the rich text editor.
- [ ] **Editor Integration & Attachments:** Embed the existing Slate.js Editor for question fields. Enable manual image attachments leveraging existing `utils/storage.js` logic within the curation pane.
- [ ] **Data Mapping (No Client IDs):** Implement mapping logic for the final payload. **Crucially eliminate client-side ObjectID generation**; submit drafts strictly without `_id` fields.
- [ ] **Validation:** Review a draft, verify formatting preservation, attach an image, and inspect the final constructed payload before submission to ensure no client IDs exist.

## Phase 4: Bulk Insertion Backend Logic
**Goal:** Safely persist curated questions to the database while maintaining absolute data integrity and relational linking.

- [ ] **Validation Middleware:** Create strict Joi/Zod validators for the incoming bulk payload to prevent malformed data.
- [ ] **Bi-Directional Reference Mapping:** Implement `bulkImportQuestions` in `quiz.controller.js`. The endpoint must receive `moduleId`. Iterate through the payload and **inject `modules: [moduleId]`** into every question object prior to insertion.
- [ ] **Transactional Insertion:** 
    - Start Mongoose Session / Transaction.
    - Execute `Questions.insertMany()` (allowing Mongoose to natively generate ObjectIDs).
    - Extract the newly generated `_id`s.
    - Update the parent `Module` via `Module.findByIdAndUpdate(..., { $push: { questionIds: { $each: newIds } } })`.
    - Commit or Abort Transaction.
- [ ] **Route Configuration:** Expose `POST /api/quiz/bulk-import`.
- [ ] **Validation:** Write a standalone test script (`_test_bulk_import.js`) to simulate a payload and verify Mongoose ID generation, insertion, and module linking without frontend interaction.

## Phase 5: End-to-End Integration & Polish
**Goal:** Connect all layers, handle batched processing states, and finalize the user experience.

- [ ] **Batched Processing UI:** Implement logic to send chunked texts as batched requests to the backend AI proxy. Add a clear progress indicator in the UI (e.g., "Analyzing page 1 of 5...").
- [ ] **Result Aggregation:** Accumulate parsed drafts from each chunk and append them to the curation UI once fully processed.
- [ ] **Connect Frontend & Backend:** Point the frontend submit button to the new bulk import endpoint. Add loading spinners and toast notifications for successes/errors.
- [ ] **Full Validation:** Perform a full manual E2E test with a complex PDF, ensuring extraction, chunking, AI parsing, formatting retention, manual edits, and final DB insertion all succeed flawlessly.

---
*Note: Support for non-MCQ question types via AI prompt updates is deferred to a future enhancement phase.*
