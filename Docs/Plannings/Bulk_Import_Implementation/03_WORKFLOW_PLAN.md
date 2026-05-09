# Blueprint: AI-Assisted Bulk Question Import - Workflow Plan

This phased execution plan ensures safe and verifiable implementation of the bulk import feature.

## Phase 1: Frontend Text Extraction Foundation
1. **Dependency Installation:** Install `tesseract.js` (and optionally `pdfjs-dist`) on the frontend.
2. **Utility Creation:** Build `src/utils/pdfParser.js` to handle PDF ingestion and return raw text.
3. **UI Component - Uploader:** Create `PdfUploader.jsx` allowing admins to select a PDF.
4. **Validation:** Upload a sample PDF and verify the raw text output in the console.

## Phase 2: AI Parsing Backend integration
1. **Prompt Engineering:** Design a strict Gemini prompt that enforces a JSON schema output for questions (question text, options array, correct option index).
2. **Controller Update:** Update `genai.controller.js` to include the `parseQuestionsText` endpoint.
3. **Route Configuration:** Expose `POST /api/genai/parse-questions`.
4. **Validation:** Send raw text to the new endpoint via Postman/curl and verify the structured JSON array response. Ensure the API gracefully handles hallucinated or malformed AI responses.

## Phase 3: Frontend Preview & Curation UI
1. **Component - PreviewEditor:** Build `PreviewEditor.jsx` to loop over the AI's JSON output.
2. **Editor Integration:** Embed the existing Slate.js UI Editor for each question field (text, explanation, options).
3. **GCS Integration:** Hook up the existing `utils/storage.js` for image uploads within the PreviewEditor.
4. **Data Mapping:** Implement logic to map the final reviewed data into Slate.js JSON format and generate MongoDB `ObjectId`s for the questions locally.
5. **Validation:** Review a draft, add an image, and inspect the final constructed payload before submission to ensure all IDs and formatting match backend expectations.

## Phase 4: Bulk Insertion Backend Logic
1. **Validation Middleware:** Create strict Joi/Zod validators for the bulk payload to prevent malformed data from reaching the DB.
2. **Controller Logic:** Implement `bulkImportQuestions` in `quiz.controller.js`.
   - Start Mongoose Session / Transaction.
   - Execute `Questions.insertMany()`.
   - Update `Module.findByIdAndUpdate(..., { $push: { questionIds: { $each: newIds } } })`.
   - Commit or Abort Transaction.
3. **Route Configuration:** Expose `POST /api/quiz/bulk-import`.
4. **Validation:** Write a standalone test script `_test_bulk_import.js` to simulate a payload and verify data is correctly inserted and linked in the database without hitting the frontend.

## Phase 5: End-to-End Integration & Polish
1. **Connect Frontend to Backend:** Point the frontend submit button to the new bulk import endpoint.
2. **Error Handling & Loading States:** Add spinners for PDF processing, AI parsing, and saving. Implement toast notifications for successes and errors.
3. **Validation:** Perform a full manual E2E test with a complex PDF, ensuring all layers succeed and the module updates.
