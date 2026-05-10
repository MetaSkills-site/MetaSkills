# Bulk Import Implementation: Gaps & Solutions Plan

This document serves as an addendum to the existing implementation blueprints, addressing critical gaps identified in the bulk question upload workflow. It provides detailed implementation strategies for each gap to ensure a robust, user-friendly, and maintainable feature.

## 1. Missing Bi-Directional Reference Mapping

**Severity:** Critical
**Gap:** The frontend pseudo-code mapping fails to inject the `modules` array into each question, meaning questions won't belong to the target module.
**Solution Strategy:**
*   **Backend Responsibility:** The responsibility of linking questions to modules should reside entirely on the backend to maintain data integrity.
*   **Implementation Steps:**
    1.  The `bulkImportQuestions` endpoint must receive the `moduleId` along with the array of question drafts from the frontend.
    2.  Before executing `Questions.insertMany(parsedQuestions)`, iterate through the `parsedQuestions` array and inject `modules: [moduleId]` into every question object.
    3.  After successful insertion, the backend must extract the generated `_id`s from the newly inserted questions.
    4.  Update the parent `Module` document by pushing these new `_id`s into its `questionIds` array.

## 2. Context and Image Detachment

**Severity:** High (UX/Data Gap)
**Gap:** AI parsing from raw text strips images from the PDF, making it hard for the admin to re-attach diagrams to questions.
**Solution Strategy:**
*   **UI Enhancements (Split View):**
    *   Implement a side-by-side split view in the "Curation" phase UI.
    *   **Left pane:** Display the original uploaded PDF natively.
    *   **Right pane:** Display the AI-generated question drafts for review and editing.
*   **Attachment Workflow Integration:**
    *   Leverage the existing "Context Attachments" logic in the frontend.
    *   Enable users to easily extract or reference images from the left pane (if possible via UI clipping) or manually upload images to attach to specific questions without losing their context during the curation process.

## 3. Ignored Question Types

**Severity:** Medium (Functional Gap)
**Gap:** The AI prompt strictly looks for MCQs. Other question types (Fill-in-the-Blanks, Short Answer) will be ignored or mangled.
**Solution Strategy:**
*   **Phase 1: Explicit Communication (Immediate Fix):**
    *   Display a prominent warning/info banner in the upload UI explicitly stating that the parser currently only extracts MCQs, and other formats will be ignored.
*   **Phase 2: Prompt and Schema Updates (Future Enhancement):**
    *   Update the AI prompt to recognize and categorize multiple question types based on the text.
    *   Modify the output JSON schema to include a `type` identifier.
    *   Update backend validation and frontend Slate editor mapping to handle these diverse question types dynamically.

## 4. Slate.js Data Transformation Complexity

**Severity:** High (Data Formatting Gap)
**Gap:** Extracting text to Slate JSON using a simple paragraph wrapper destroys AI formatting (bolding, line breaks, etc.).
**Solution Strategy:**
*   **Standardized Intermediary Format:**
    *   Update the AI prompt to explicitly instruct the model to output text using standard Markdown for any rich formatting (bold, italic, lists).
*   **Robust Conversion:**
    *   The frontend must implement a robust Markdown-to-Slate JSON converter mechanism.
    *   Instead of wrapping text blindly, parse the Markdown strings returned by the AI to generate accurate Slate ASTs, preserving semantic formatting and structure for the rich text editor.

## 5. Token Limits & AI Truncation

**Severity:** Critical (Reliability Gap)
**Gap:** Sending a 60,000-character payload to Gemini might result in silent truncation or incomplete answers.
**Solution Strategy:**
*   **Frontend Chunking Strategy:**
    *   Implement logic on the frontend to safely chunk the extracted text.
    *   Use a reasonable heuristic (e.g., chunks of ~10,000 characters, or ideally split along natural page boundaries).
*   **Batched Processing:**
    *   Send these chunks as sequential or parallel batched requests to the backend AI proxy.
    *   Provide a clear progress indicator in the UI (e.g., "Analyzing page 1 of 5...").
*   **Result Aggregation:**
    *   Accumulate the parsed question drafts from each chunk and append the aggregated results in the curation UI once fully processed.

## 6. Frontend ObjectID Generation (Anti-Pattern)

**Severity:** High (Architecture Gap)
**Gap:** Generating `bson-objectid`s on the client bypasses Mongoose defaults and is a bad practice.
**Solution Strategy:**
*   **Backend ID Generation:**
    *   Remove client-side ObjectID generation completely.
    *   The frontend should submit question drafts to the backend strictly *without* `_id` fields.
    *   Rely on Mongoose's internal logic during `Questions.insertMany()` to automatically generate secure, properly formed ObjectIDs.
*   **Reference Resolution:**
    *   (As mentioned in Solution 1), use these newly returned backend-generated `_id`s to correctly update the relationships on the `Module` document.