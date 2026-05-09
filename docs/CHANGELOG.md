# CHANGELOG

All notable changes to the MetaSkills project will be documented in this file.

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
