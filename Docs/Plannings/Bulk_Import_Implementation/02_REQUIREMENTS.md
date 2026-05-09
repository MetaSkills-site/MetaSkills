# Blueprint: AI-Assisted Bulk Question Import - Requirements

## 1. Affected Systems & Domains
- **Frontend App:** PDF Parsing, AI interaction state management, Bulk review UI, existing UI Editor integration.
- **Backend API:** Generative AI routing, Quiz/Question controllers, validation logic.
- **Database:** `Questions` and `Module` collections.
- **External Services:** Gemini API, Google Cloud Storage (GCS).

## 2. Dependencies
### Frontend Dependencies
- `tesseract.js` or `pdfjs-dist`: For extracting text from uploaded PDFs.
- `bson-objectid`: For generating valid MongoDB ObjectIds on the frontend before sending.

### Backend Dependencies
- Existing: `@google/genai` (or current Gemini SDK), `mongoose`.

## 3. Files to Modify/Add

### Backend (`metaskills-backend/`)
- `controllers/genai.controller.js`
  - **Modify:** Add a new method (e.g., `parseQuestionsText`) or update existing to handle bulk text-to-JSON requests specifically tailored for question structures.
- `controllers/quiz.controller.js`
  - **Modify:** Add a `bulkImportQuestions` method.
- `routes/genai.routes.js`
  - **Modify:** Add route for the new genai controller method.
- `routes/quiz.routes.js`
  - **Modify:** Add `POST /bulk-import` route.
- `models/Questions.model.js`
  - **Review:** Ensure schema supports bulk insertion without conflicts.
- `models/Module.model.js`
  - **Review:** Ensure `questionIds` array can be efficiently updated.
- `validators/quiz.validator.js` (or equivalent)
  - **Add:** Strict validation schema (e.g., Joi or Zod) for the bulk incoming payload.

### Frontend (`metaskills-frontend/`)
- `src/components/BulkImport/` (New Directory)
  - `BulkImportModal.jsx`: Main entry point.
  - `PdfUploader.jsx`: Handles file selection and text extraction.
  - `PreviewEditor.jsx`: Renders the list of drafts using the existing UI Editor.
- `src/services/api.js` (or equivalent)
  - **Modify:** Add endpoints for `/api/genai/parse-questions` and `/api/quiz/bulk-import`.
- `src/utils/pdfParser.js` (New)
  - **Add:** Logic wrapping Tesseract.js / PDF.js to extract clean text.

## 4. Environment Variables
- Ensure `GEMINI_API_KEY` is configured and has sufficient quota.
- Ensure GCS credentials are correct for image uploads during the editing phase.
