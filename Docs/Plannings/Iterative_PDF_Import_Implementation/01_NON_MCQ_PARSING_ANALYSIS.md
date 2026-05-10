# Technical Analysis: Non-MCQ Support in Bulk Import Workflow

**Date:** Sunday, May 10, 2026
**Status:** Issue Confirmed
**Scope:** PDF Parsing & Bulk Import Workflow (AI-driven)

---

## 1. Executive Summary
The current system is architecturally designed to support Multiple Choice Questions (MCQ) only. Although the AI prompt instructions are configured to identify and categorize "Short Answer" and "Fill-in-the-Blank" questions, the application code in both the backend and frontend actively suppresses or misconfigures these types.

**Result:** Non-MCQ questions extracted from PDFs are either silently deleted by the backend validator or corrupted into empty MCQ entries by the frontend importer.

---

## 2. Backend Analysis

### 2.1 AI Prompt Configuration
**File:** `metaskills-backend/config/aiPromptConfig.js`

The `QUESTION_PARSER_SYSTEM_INSTRUCTION` correctly defines three supported types:
1. `mcq`
2. `short_answer`
3. `fill_in_the_blank`

It explicitly instructs the AI to set `options: []` and `correctOptionIndex: -1` for non-MCQ types. 

### 2.2 Validation Failure (The "Silent Filter")
**File:** `metaskills-backend/controllers/genai.controller.js`

The `validateDrafts` function contains a hardcoded constraint that requires at least two options for every question. Since non-MCQ questions are correctly generated with zero options by the AI, they are filtered out here.

```javascript
// Reference: metaskills-backend/controllers/genai.controller.js
const validateDrafts = (parsed) => {
  if (!Array.isArray(parsed)) throw new Error("AI response is not a JSON array.");
  return parsed.filter((item, index) => {
    if (!item.questionText || typeof item.questionText !== "string") return false;
    
    // CRITICAL FAILURE POINT:
    if (!Array.isArray(item.options) || item.options.length < 2) return false; 
    
    if (typeof item.correctOptionIndex !== "number" || item.correctOptionIndex < 0 || item.correctOptionIndex >= item.options.length) {
      item.correctOptionIndex = 0;
    }
    // ...
    return true;
  });
};
```

---

## 3. Frontend Analysis

### 3.1 Preview Logic
**File:** `metaskills-frontend/src/pages/admin/BulkImportPage.jsx`

The `handleStartParsing` function initializes the UI state by assuming a 4-option MCQ structure. If a non-MCQ question were to bypass the backend, it would be forced into this template:

```javascript
// Reference: metaskills-frontend/src/pages/admin/BulkImportPage.jsx (Line 206)
const optionsSlate = {
  A: { slate: markdownToSlate(draft.options[0] || "") },
  B: { slate: markdownToSlate(draft.options[1] || "") },
  C: { slate: markdownToSlate(draft.options[2] || "") },
  D: { slate: markdownToSlate(draft.options[3] || "") },
  // ...
};
```

### 3.2 Import Logic (Final Submission)
**File:** `metaskills-frontend/src/pages/admin/BulkImportPage.jsx`

During the final `handleImport` call, the `answerType` and `options.type` are hardcoded to `"MCQ"`, regardless of the AI's actual classification.

```javascript
// Reference: metaskills-frontend/src/pages/admin/BulkImportPage.jsx (Line 315)
return {
  _id: questionId,
  question: { slate: draft.questionSlate },
  answerType: "MCQ", // HARDCODED
  options: {
    type: "MCQ",   // HARDCODED
    mcq: optionObjects,
  },
  // ...
};
```

---

## 4. Impact Assessment
*   **Data Loss:** Educators uploading past papers with varied question formats lose all non-MCQ content without any warning message.
*   **Workflow Friction:** Users are forced to manually add non-MCQ questions one-by-one via the `QuestionEntryPage` rather than using the Bulk Import tool.
*   **AI Inefficiency:** The AI is performing the work to categorize these questions, but the application is throwing that intelligence away.

---

## 5. Proposed Fix Plan

### Phase 1: Backend Refactor
*   Modify `validateDrafts` to accept 0 options if the `questionType` is `short_answer` or `fill_in_the_blank`.
*   Ensure the `questionType` is preserved in the response sent to the frontend.

### Phase 2: Frontend Preview Update
*   Update `BulkImportPage.jsx` to check `draft.questionType`.
*   Hide the "A, B, C, D" option previews for non-MCQ types.
*   Show a "Short Answer" or "Fill-in-the-Blank" badge in the list.

### Phase 3: Importer Logic Update
*   Map `short_answer` to the database type `SA`.
*   Map `fill_in_the_blank` to the database type `fillInTheBlanks`.
*   Adjust the `options` object structure sent to `/api/quiz/bulk-import` to match the non-MCQ schemas (e.g., using `options.sa` instead of `options.mcq`).
