# Architecture

**Analysis Date:** 2025-02-14

## Pattern Overview

**Overall:** Client-Side Extraction with AI Service Fallback Chain

**Key Characteristics:**
- **Client-Side Heavy Processing:** PDF text extraction and OCR are performed in the browser to reduce backend load and allow for immediate user feedback.
- **Lazy Initialization:** External AI clients are initialized per-request or lazily via getter functions.
- **Model Fallback Chain:** A sequential fallback pattern is used to iterate over a prioritized list of models (Groq -> Gemini -> etc.).
- **Human-in-the-Loop:** Bulk import relies on AI for initial parsing but provides a comprehensive frontend review/edit interface before data persistence.

## Layers

**Frontend Components:**
- **Uploader:** `metaskills-frontend/src/components/BulkImport/PdfUploader.jsx` handles file ingestion and extraction progress.
- **Review UI:** `metaskills-frontend/src/pages/admin/BulkImportPage.jsx` manages the multi-phase workflow (Upload -> Parsing -> Preview -> Import).

**Frontend Utilities:**
- **PDF Parser:** `metaskills-frontend/src/utils/pdfParser.js` implements the dual-strategy extraction logic (Text Layer vs. OCR).

**Backend Controllers:**
- **GenAI Controller:** `metaskills-backend/controllers/genai.controller.js` orchestrates AI model execution for question parsing.
- **Quiz Controller:** `metaskills-backend/controllers/quiz.controller.js` (presumably) handles the final bulk insertion into the database.

**Service Layer:**
- **AI Service:** `metaskills-backend/services/ai.service.js` provides a unified interface for multiple AI providers (Google, OpenAI, Groq, NVIDIA) with fallback logic.

## Data Flow

**PDF Processing Workflow:**
1. **Selection:** Admin selects a PDF in the `PdfUploader` component.
2. **Frontend Extraction:** 
   - `pdfParser.js` attempts extraction via `pdfjs-dist` (text layer).
   - If text density is low (< 50 chars/page), it triggers `Tesseract.js` (OCR) by rendering pages to a canvas.
3. **AI Parsing:** 
   - Extracted `rawText` is sent to `POST /api/genai/parse-questions`.
   - Backend `parseQuestionsText` controller invokes the AI fallback chain using the `question_parser` prompt.
   - AI returns structured JSON drafts.
4. **Curation:** Admin reviews and edits drafts in the `BulkImportPage` UI.
5. **Persistence:** Final JSON is sent to `POST /api/quiz/bulk-import` for database insertion.

## Key Abstractions

**AI Provider Adapters:**
- Purpose: Abstract differences between Google GenAI and OpenAI-compatible APIs (Groq, NVIDIA).
- Location: `metaskills-backend/services/ai.service.js`.

**Prompt Router:**
- Purpose: Map feature modes (e.g., `question_parser`) to specific prompt templates and model priorities.
- Location: `metaskills-backend/config/aiPromptConfig.js`.

---

*Architecture analysis: 2025-02-14*
