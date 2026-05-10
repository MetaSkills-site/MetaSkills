# Codebase Concerns

**Analysis Date:** 2024-05-10

## Known Bugs

**Bulk Import Draft Edit Crash:**
- Symptoms: The application crashes with the error "Cannot read properties of undefined (reading 'options')" when clicking the 'Edit' button on a question draft in the Bulk Import flow.
- Files: 
  - `src/pages/admin/BulkImportPage.jsx`
  - `src/components/QuestionEditor.jsx`
- Trigger: Clicking the "Edit" icon on a parsed draft during "Phase 2: Review and Edit" of the Bulk Import process.
- Cause: `BulkImportPage.jsx` renders `<QuestionEditor />` (the default export) without passing the required `questionData` prop. `QuestionEditor` attempts to read `questionData.options` during its initialization, throwing the error because `questionData` is undefined.
- Fix approach: `QuestionEditor.jsx` has an internal component `EditQuestionContent` that actually renders the editor UI inside an `EditorProvider`. `BulkImportPage` is already manually setting up an `EditorProvider` with `initialValues` pre-formatted from drafts. To fix the issue, `BulkImportPage` should either import and use `EditQuestionContent` instead of the default `QuestionEditor` export, or `QuestionEditor` should be refactored to allow skipping the `questionData` prop mapping if `EditorContext` is already populated. Alternatively, `BulkImportPage` could construct a mock `questionData` object mimicking a backend response and pass it directly to `<QuestionEditor questionData={mockData} />`, abandoning its custom `EditorProvider` wrapper.

## Tech Debt

**Inconsistent Question Data Structures:**
- Issue: The structure of a "question" object differs depending on whether it comes from the backend API, the Slate editor context, or the new Bulk Import drafts. This leads to complex transformation and validation logic scattered across multiple components.
- Files: 
  - `src/components/QuestionEditor.jsx`
  - `src/pages/admin/BulkImportPage.jsx`
  - `src/components/admin/QuestionDisplayTabs.jsx`
  - `src/components/QuestionPreview.jsx`
- Impact: It is very easy to introduce bugs (like the Bulk Import crash) because components have conflicting expectations. For example:
  - `QuestionEditor` expects backend format: `options.mcq` is an Array of objects (`[{ slate, html, _id }]`).
  - `EditorContext` expects flat format: `options.mcq` is an Object (`{ A, B, C, D, correct, extras }`).
  - `QuestionDisplayTabs` accepts a hybrid format where it handles both arrays and nested `{ type: 'MCQ', mcq: [...] }` formats conditionally.
- Fix approach: Define a single, standardized frontend Question entity format. Centralize data transformation functions in a utility file (e.g., `src/utils/questionTransforms.js`) that handle mapping between the "Backend Format" and the "Editor Format" instead of embedding mapping logic directly in component render functions. 

## Fragile Areas

**Question Preview Rendering:**
- Files: 
  - `src/components/admin/QuestionDisplayTabs.jsx`
  - `src/components/QuestionPreview.jsx`
- Why fragile: The display components rely on deep optional chaining and fallback properties to account for historical data variations or draft states (e.g., `question.answerType || question.options?.type || question.type`). Mock data generators like `buildMockQuestionForView` in `BulkImportPage` have to carefully recreate fake `_id` strings and array structures to trick `QuestionDisplayTabs` into rendering properly without errors.
- Safe modification: Any new question types or changes to the backend schema will require updating the messy conditional logic in `renderAnswer` inside `QuestionDisplayTabs`. Ensure robust unit tests for different question data variations are created before refactoring these components.
- Test coverage: Gaps in testing for draft vs. live data representations of questions.

---

*Concerns audit: 2024-05-10*