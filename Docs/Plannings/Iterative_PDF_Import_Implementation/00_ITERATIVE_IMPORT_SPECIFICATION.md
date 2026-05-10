# Master Specification: Iterative PDF Import & Non-MCQ Support

**Date:** Sunday, May 10, 2026
**Status:** Ready for Implementation
**Author:** Gemini CLI Agent

---

## 1. Project Overview
This project aims to transform the current batch-based PDF import workflow into an iterative, page-by-page "streaming" pipeline. This will improve responsiveness for large documents, handle questions split across page boundaries intelligently, and enable full support for Non-MCQ (Short Answer/Fill-in-the-Blank) question types.

---

## 2. Identified Issues (Current State)

### 2.1 Non-MCQ Suppression
*   **Backend Filtering:** `metaskills-backend/controllers/genai.controller.js` filters out any question with `< 2` options in the `validateDrafts` function. Since the AI correctly identifies Short Answers with `options: []`, they are silently deleted.
*   **Frontend Hardcoding:** `BulkImportPage.jsx` hardcodes `answerType: "MCQ"` for all imports and assumes a 4-option (A, B, C, D) slate structure, corrupting non-MCQ data.

### 2.2 Batch Processing Bottlenecks
*   **Memory Risks:** The system attempts to extract text from the entire PDF before showing any results, risking browser crashes (OOM) on files > 10MB or > 10 pages.
*   **AI Timeouts:** Sending 50 pages of text in a single request often leads to 504 Timeouts or context-window overflows.
*   **Broken Continuity:** Questions that start on one page and end on another are often split into two nonsensical fragments because the AI lacks context of the previous page's "tail."

---

## 3. Implementation Strategy

### 3.1 Page-by-Page Extraction (Generator Pattern)
Refactor `metaskills-frontend/src/utils/pdfParser.js` to use an `async function*` (Async Generator).
*   **Yielding:** The parser will `yield` each page's text immediately after OCR (Tesseract.js) or text extraction (pdfjs-dist).
*   **Cleanup:** After yielding, the parser will explicitly revoke Object URLs and clear canvases to free memory.

### 3.2 "Sliding Window" AI Context Bridge
To handle broken/cutout text between pages:
*   **Payload:** Each AI request for Page N will include:
    *   `currentPageText`: The raw text of the current page.
    *   `previousTail`: The last ~500 characters of Page N-1.
*   **AI Instruction:** Update `QUESTION_PARSER_SYSTEM_INSTRUCTION` to:
    *   Detect if Page N starts with a continuation of the `previousTail`.
    *   Merge continuation text into a single cohesive question object.
    *   Flag if the page ends with a "pending" question for the next iteration.

### 3.3 Streaming UI / UX
Transform `BulkImportPage.jsx` into a reactive state machine:
*   **Progress Sidebar:** A sidebar showing the status of each page: `[Pending]`, `[OCR Processing]`, `[AI Parsing]`, `[Ready]`, `[Error]`.
*   **Incremental Appending:** Question drafts are added to the list in real-time. Users can begin reviewing and editing Page 1 while Page 10 is still processing.
*   **Error Isolation:** If OCR fails on Page 5, the user can "Skip" or "Retry" that specific page without losing data from Pages 1-4.

---

## 4. Technical Specifications

### 4.1 Backend API Changes
*   **Endpoint:** `POST /api/genai/parse-questions`
*   **Payload Schema:**
    ```json
    {
      "rawText": "Current page text...",
      "contextTail": "Previous page's last few sentences...",
      "isContinuation": true
    }
    ```
*   **Validation Fix:** Modify `validateDrafts` to accept `options: []` and `correctOptionIndex: -1` when `questionType !== 'mcq'`.

### 4.2 Frontend Schema Mapping
*   **Short Answer (SA):** Map AI's `short_answer` to DB `answerType: "SA"` and `options: { type: "SA", sa: "" }`.
*   **Fill-in-the-Blank:** Map AI's `fill_in_the_blank` to DB `answerType: "fillInTheBlanks"`.

---

## 5. Success Criteria
1.  **Iterative Processing:** Questions from Page 1 appear in the UI while Page 2 is still being processed.
2.  **Continuity:** A question split across Page 1 and 2 is imported as a single, correct question entry.
3.  **Non-MCQ Support:** A PDF containing only Short Answer questions is successfully parsed and imported into the database with the correct `SA` type.
4.  **UI Feedback:** A clear progress indicator shows the percentage of the document processed at both a page and aggregate level.

---

## 6. Risk Assessment & Mitigation
*   **Risk:** Duplication of questions during "context bridge" merges.
    *   *Mitigation:* AI prompt instructions to explicitly check for overlap and deduplicate.
*   **Risk:** Browser memory leak from multiple OCR workers.
    *   *Mitigation:* Explicit worker termination and canvas disposal in the generator loop.
*   **Risk:** Large Import Transaction Failures.
    *   *Mitigation:* Implement a transactional backend import that validates all questions before the final write.
