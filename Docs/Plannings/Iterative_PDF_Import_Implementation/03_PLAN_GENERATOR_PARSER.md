---
phase: 05-iterative-import
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [metaskills-frontend/src/utils/pdfParser.js]
autonomous: true
requirements: [BULK-01]

must_haves:
  truths:
    - "pdfParser.js exports a generator function that yields text page-by-page."
    - "PDF extraction handles both text layer and OCR iteratively."
  artifacts:
    - path: "metaskills-frontend/src/utils/pdfParser.js"
      provides: "Generator-based PDF parsing"
---

<objective>
Refactor `pdfParser.js` into an asynchronous generator that yields text page-by-page. This enables the frontend to process large PDFs incrementally, providing immediate feedback and staying within AI token limits by using a sliding window strategy.
</objective>

<execution_context>
@/home/jimfleax/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@metaskills-frontend/src/utils/pdfParser.js
</context>

<tasks>

<task type="auto">
  <name>Refactor extraction functions to generators</name>
  <files>metaskills-frontend/src/utils/pdfParser.js</files>
  <action>
    - Refactor `extractTextViaPdfjs(pdfDoc, onProgress)` to `async function* extractTextViaPdfjs(pdfDoc)`.
    - It should yield `{ text, pageNumber }` for each page.
    - Refactor `extractTextViaTesseract(pdfDoc, onProgress)` to `async function* extractTextViaTesseract(pdfDoc)`.
    - It should yield `{ text, pageNumber }` for each page.
    - Remove the `onProgress` callbacks from these internal functions as yielding provides the progress signal to the caller.
  </action>
  <verify>Functions are now `async function*` and yield objects.</verify>
  <done>Core extraction logic is generator-based.</done>
</task>

<task type="auto">
  <name>Convert main parsePdf to generator</name>
  <files>metaskills-frontend/src/utils/pdfParser.js</files>
  <action>
    - Change `export default async function parsePdf(file, options)` to `export default async function* parsePdf(file)`.
    - The generator should yield:
      1. `{ type: 'info', pageCount: number }` (once at start).
      2. `{ type: 'page', text: string, pageNumber: number, method: 'pdfjs' | 'tesseract' }` (for each page).
    - Maintain the dual strategy:
      - First, run a quick check on Page 1 or Sample to decide strategy? 
      - Better: Run `extractTextViaPdfjs` for Page 1. If it meets `MIN_CHARS_PER_PAGE`, continue with `pdfjs` for remaining pages.
      - If Page 1 fails, switch to `tesseract` for ALL pages (including yielding Page 1 text via OCR).
  </action>
  <verify>
    `parsePdf` is a generator.
    Manual test script calling `for await (const chunk of parsePdf(file))` prints page-by-page output.
  </verify>
  <done>Main parser yields incremental results.</done>
</task>

</tasks>

<success_criteria>
- `pdfParser.js` exports a generator.
- Each page of a PDF is yielded as it is processed.
- Memory usage is reduced as the full text is no longer held in a single variable before returning.
</success_criteria>

<output>
After completion, create `.planning/phases/05-iterative-import/05-01-SUMMARY.md`
</output>
