---
phase: 05-iterative-import
plan: 03
type: execute
wave: 3
depends_on: [05-02]
files_modified: [metaskills-frontend/src/pages/admin/BulkImportPage.jsx]
autonomous: true
requirements: [BULK-03, BULK-05]

must_haves:
  truths:
    - "UI shows per-page progress during AI parsing."
    - "Drafts are appended incrementally as pages are processed."
  artifacts:
    - path: "metaskills-frontend/src/pages/admin/BulkImportPage.jsx"
      provides: "Iterative import UI"
---

<objective>
Update the `BulkImportPage` to implement the iterative processing loop. Use the new PDF generator and backend sliding window support to process the document page-by-page, updating the UI in real-time.
</objective>

<execution_context>
@/home/jimfleax/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@metaskills-frontend/src/pages/admin/BulkImportPage.jsx
@metaskills-frontend/src/utils/pdfParser.js
@metaskills-frontend/src/utils/slateUtils.js
</context>

<tasks>

<task type="auto">
  <name>Implement Iterative Parsing Loop</name>
  <files>metaskills-frontend/src/pages/admin/BulkImportPage.jsx</files>
  <action>
    - Update `handleStartParsing`:
      - Remove reliance on `extractedText` (as extraction is now iterative).
      - Accept the `file` directly (or store it in state).
      - Use `for await (const chunk of parsePdf(file))` to iterate through pages.
      - Maintain `previousTail` state across iterations.
      - For each 'page' chunk:
        - Call `/api/genai/parse-questions` with `{ rawText: chunk.text, previousTail }`.
        - Update `previousTail` with the `residualText` from the backend response.
        - Append new drafts to the `drafts` state incrementally.
        - Update a new `parsingProgress` state `{ current: number, total: number }`.
  </action>
  <verify>Drafts appear one-by-one or page-by-page in the preview list.</verify>
  <done>Frontend processes PDF iteratively.</done>
</task>

<task type="auto">
  <name>Update Progress UI</name>
  <files>metaskills-frontend/src/pages/admin/BulkImportPage.jsx</files>
  <action>
    - Add a progress bar or text indicator in the `PHASES.PARSING` view.
    - Show "Analyzing Page X of Y..." using the `parsingProgress` state.
    - Ensure the UI remains responsive during the loop.
  </action>
  <verify>Progress indicator updates as each page is processed.</verify>
  <done>User can see real-time progress of the AI analysis.</done>
</task>

<task type="auto">
  <name>Refine Draft Initialization & Validation</name>
  <files>metaskills-frontend/src/pages/admin/BulkImportPage.jsx</files>
  <action>
    - Refactor the mapping from AI draft to Slate-based draft into a helper function.
    - Ensure `short_answer` and `fill_in_the_blank` types are initialized with correct Slate structures.
    - Verify that `fill_in_the_blank` questions correctly use `markdownToSlateWithBlanks` with pipe-delimited answers.
    - Ensure `validateDraft` correctly identifies errors in non-MCQ questions.
  </action>
  <verify>All question types (MCQ, SA, Fill-in-blanks) are editable and validatable.</verify>
  <done>Non-MCQ questions are correctly integrated into the curation flow.</done>
</task>

</tasks>

<success_criteria>
- Large PDFs do not time out because they are processed page-by-page.
- Progress UI gives clear feedback to the user.
- Questions split across pages are handled by the sliding window.
</success_criteria>

<output>
After completion, create `.planning/phases/05-iterative-import/05-03-SUMMARY.md`
</output>
