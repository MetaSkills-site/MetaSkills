# CHANGELOG

All notable changes to the MetaSkills project will be documented in this file.

---

## [2026-05-10] - Iterative PDF Import with Sliding Window AI

### Summary
Transformed the bulk import pipeline from a batch model (extract all → send all → parse all) to an iterative page-by-page model with sliding window AI context bridging for cross-page question continuity.

### Changed
- `metaskills-frontend/src/utils/pdfParser.js`: Refactored from batch function to async generator (`async function*`). Now yields `{type:"info", pageCount}` metadata followed by `{type:"page", text, pageNumber, method}` per page. Explicit canvas cleanup and Tesseract worker termination per page.
- `metaskills-backend/config/aiPromptConfig.js`: Added CONTINUATION HANDLING section to system instruction for cross-page merging. Updated `QUESTION_PARSER_PROMPT_BUILDER` to accept `previousTail` parameter and inject `PREVIOUS_TAIL` context section.
- `metaskills-backend/controllers/genai.controller.js`: Updated `parseQuestionsText` to accept `previousTail` from request body, parse both legacy (plain array) and new (`{questions, residualText}`) AI response formats, include `residualText` in response with heuristic fallback.
- `metaskills-backend/middlewares/rateLimiters.js`: Increased GenAI rate limit from 20 to 30 requests/minute to support iterative page-by-page imports.
- `metaskills-frontend/src/components/BulkImport/PdfUploader.jsx`: Refactored from extraction+upload component to a pure file picker. Calls `onFileSelected(file)` instead of `onTextExtracted(text)`.
- `metaskills-frontend/src/pages/admin/BulkImportPage.jsx`: Rewired to consume async generator, iterative `for await` loop with per-page AI calls, sliding window context (`previousTail`/`residualText`), per-page progress bar, incremental draft appending, rate limit retry with exponential backoff, and partial failure resilience.

### Risk
- **Medium** — Core pipeline architecture change. Rate-limited retry logic handles 429s. Partial failures preserve previously parsed drafts. Backend maintains backward compatibility with legacy plain-array format.

### Verification
- Verified via `_test_validateDrafts.js` (44/44 tests passing: original 12 + 8 new sliding window format tests)
- Verified via `npx vite build` (exit code 0, no compilation errors)

---

## [2026-05-10] - Non-MCQ Bulk Import Support

### Summary
Expanded the AI-driven bulk import pipeline to support Short Answer (SA) and Fill-in-the-Blank (FITB) question types alongside existing MCQ support. Previously, the pipeline silently filtered out all non-MCQ questions.

### Changed
- `metaskills-backend/controllers/genai.controller.js`: Refactored `validateDrafts` to accept `short_answer` and `fill_in_the_blank` question types instead of requiring 2+ options for all questions. Added backward-compatible type inference for legacy MCQ-only payloads.
- `metaskills-backend/config/aiPromptConfig.js`: Added `correctAnswer` field to the AI output schema for non-MCQ types. Updated `QUESTION_PARSER_PROMPT_BUILDER` to explicitly request all question types.
- `metaskills-frontend/src/utils/slateUtils.js`: Added `markdownToSlateWithBlanks` utility to convert `_____` patterns into Slate `inline-blank` nodes with pre-populated `correctAnswer` values.
- `metaskills-frontend/src/pages/admin/BulkImportPage.jsx`: Full type-aware refactor of draft initialization, validation, preview badges, `buildMockQuestionForView`, `EditorDialogWrapper`, `handleSaveEdit`, and `handleImport` to handle MCQ, SA, and fillInTheBlanks independently.

### Risk
- **Low** — All MCQ code paths preserved unchanged. Backend `bulkImportQuestions` controller already supports all three types. No database schema changes required.

### Verification
- Verified via `_test_validateDrafts.js` (26/26 tests passing: MCQ, SA, FITB, backward compat, edge cases)

---

## [2026-05-10] - AI Service Refactoring

### Summary
Abstracted and centralized the AI API handling logic (Groq, Google GenAI, Nvidia) into a unified `AIService` module using the Provider Strategy pattern, removing duplicated logic and SDK initialization from Express controllers.

### Changed
- `metaskills-backend/services/ai.service.js`: Created the centralized orchestration service implementing the Provider Strategy Pattern with adapters and fallback logic.
- `metaskills-backend/config/aiPromptConfig.js`: Cleaned up configuration, abstracting it into generic layers.
- `metaskills-backend/controllers/genai.controller.js`: Removed direct client instantiations; integrated `aiService` for model inference, streaming, and pipeline operations.
- `metaskills-backend/controllers/email.controller.js`: Replaced isolated AI fallback loop with centralized `aiService.generateWithFallback()` call.

### Risk
- **Medium** — Critical API paths relying on AI fallback loops were abstracted. Streams and `AbortController` cancellation protocols were updated across controllers.

### Verification
- Verified via validation suite checks verifying consistent integration with `AIService` without direct SDK imports and ensuring proper AbortController routing.

---

## [2026-05-10] - Bulk Import Workflow Migration to Dedicated Page

### Summary
Migrated the Bulk Import Questions functionality from a modal (`BulkImportModal.jsx`) to a dedicated, full-screen `BulkImportPage.jsx` to improve usability, data integrity, and adhere to admin UI standards.

### Changed
**Frontend:**
- Created `BulkImportPage.jsx` with a 3-phase state machine (Upload, Parse, Preview/Submit).
- Integrated `sessionStorage` draft persistence scoped to the tab to prevent accidental data loss.
- Leveraged existing admin components (`QuestionEditor`, `EditorProvider`, `AdminItemCard`) for standardizing the editing experience.
- Refactored `AdminDashboardPage.jsx` to remove modal state/components and route directly to the new page.
- Re-used `validateQuestionStep`, `validateAnswerStep`, and `validateExplanationStep` directly in the bulk import flow for strict client-side verification before insertion.
- `main.jsx`: Added lazy loading route for `/admin/bulk-import`.

### Removed
- `BulkImportModal.jsx` and its associated components replaced by the dedicated page architecture.

### Risk
- **Low** — Pure UI/Frontend refactoring using existing API endpoints and validation patterns.

### Verification
- Verified state transitions, component rendering, and validation checks using standalone scripts (`_test_bulk_validation.js`) and UI testing.

---

## [2026-05-10] - AI-Assisted Bulk Question Import

### Summary
Implemented a full end-to-end "Human-in-the-Loop" pipeline for bulk-importing MCQ questions from PDFs into modules.

### Added
**Frontend:**
- `metaskills-frontend/src/utils/pdfParser.js` — Dual-strategy PDF text extraction (pdfjs-dist text layer + Tesseract.js OCR fallback). Enforces 5MB / 10-page limits.
- `metaskills-frontend/src/components/BulkImport/PdfUploader.jsx` — Drag-and-drop PDF upload component with progress tracking.
- `metaskills-frontend/src/components/BulkImport/PreviewEditor.jsx` — AI-parsed question draft curation UI with inline editing, correct-answer selection, and delete functionality.
- `metaskills-frontend/src/components/BulkImport/BulkImportModal.jsx` — 3-step modal orchestrator (Upload → AI Parse → Preview/Curate → Import).
- `metaskills-frontend/src/components/BulkImport/BulkImport.css` — Comprehensive styles for the bulk import workflow.

**Backend:**
- `parseQuestionsText` controller in `genai.controller.js` — Groq AI endpoint (non-streaming) for parsing raw PDF text into structured MCQ JSON drafts. Uses `openai/gpt-oss-120b` with `meta/llama3-70b-instruct` fallback. Includes JSON sanitization and validation.
- `bulkImportQuestions` controller in `quiz.controller.js` — ACID transactional bulk insertion of curated questions into a module. Full input validation, `insertMany` + module `questionIds` update in a single Mongoose transaction.
- `genaiRateLimiter` in `rateLimiters.js` — 20 requests/minute rate limiter for the AI parse endpoint.
- `question_parser` prompt config in `aiPromptConfig.js` — Strict JSON-only system instruction and prompt template for MCQ extraction.

**Tests:**
- `metaskills-backend/tests/_test_parse_questions.js` — Standalone test for JSON sanitization, draft validation, and end-to-end mock parsing pipeline.
- `metaskills-backend/tests/_test_bulk_import.js` — Standalone test for bulk import input validation (moduleId, questions array, per-question schema, payload shape).

### Changed
- `metaskills-backend/routes/genai.routes.js` — Added `POST /parse-questions` route with `protectAdmin` + `genaiRateLimiter`.
- `metaskills-backend/routes/quiz.routes.js` — Added `POST /bulk-import` route with `protectAdmin`.
- `metaskills-frontend/src/api/requestMap.js` — Added `genaiParseQuestions` and `bulkImportQuestions` API endpoint entries.
- `metaskills-frontend/src/pages/admin/AdminDashboardPage.jsx` — Added "Bulk Import" action button and integrated `BulkImportModal`.

### Dependencies
- **Frontend (new):** `tesseract.js@^7.0.0`, `pdfjs-dist@^5.7.284`, `bson-objectid@^2.0.4`
- **Backend:** No new dependencies (uses existing `openai` SDK via `getGroqClient()`)

### Risk
- **Medium** — New feature with AI integration. Rate-limited, admin-only access. Transaction-based DB writes with automatic rollback on failure.

### Verification
- Verified via `_test_parse_questions.js` (JSON sanitization, draft validation)
- Verified via `_test_bulk_import.js` (input validation, payload construction)
