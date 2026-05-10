# Execution Trace of a Non-MCQ Question in Bulk Import Workflow

This document traces the path of a non-MCQ question (e.g., "Explain the theory of relativity.") as it is processed by the Bulk Import PDF parser workflow.

## 1. `QUESTION_PARSER_SYSTEM_INSTRUCTION` Processing

When the raw text containing a non-MCQ question is sent to the Groq/OpenAI model, the `QUESTION_PARSER_SYSTEM_INSTRUCTION` (located in `metaskills-backend/config/aiPromptConfig.js`) provides explicit instructions on how to handle it:

*   **Extraction:** It tells the AI to extract **ALL** questions, explicitly listing "SHORT/LONG ANSWER" and "FILL-IN-THE-BLANK" as supported types alongside "MCQ".
*   **Property Mapping:** For a question like "Explain the theory of relativity." (a short/long answer), the instructions mandate:
    *   `questionType` must be set to `"short_answer"`.
    *   `options` must be set to an empty array `[]`.
    *   `correctOptionIndex` must be set to `-1`.
    *   `explanation` must still be provided or left empty (`""`).

If the AI strictly follows the system instructions, it will return a valid JSON object representing the non-MCQ question, like:
```json
{
  "questionText": "Explain the theory of relativity.",
  "questionType": "short_answer",
  "options": [],
  "correctOptionIndex": -1,
  "explanation": ""
}
```

## 2. `validateDrafts` in `genai.controller.js` Reaction

Once the AI returns the JSON array of drafts, the backend controller (`metaskills-backend/controllers/genai.controller.js`) parses the JSON and passes it through the `validateDrafts` function.

```javascript
const validateDrafts = (parsed) => {
  if (!Array.isArray(parsed)) throw new Error("AI response is not a JSON array.");
  return parsed.filter((item, index) => {
    if (!item.questionText || typeof item.questionText !== "string") return false;
    if (!Array.isArray(item.options) || item.options.length < 2) return false;
    if (typeof item.correctOptionIndex !== "number" || item.correctOptionIndex < 0 || item.correctOptionIndex >= item.options.length) {
      item.correctOptionIndex = 0;
    }
    if (typeof item.explanation !== "string") item.explanation = "";
    return true;
  });
};
```

**What happens:**
*   `validateDrafts` checks if `item.options` is an array and if it has a length of **at least 2** (`item.options.length < 2`).
*   Since the system instruction specifically told the AI to return `options: []` for non-MCQ questions, the length is 0.
*   **Result:** `validateDrafts` returns `false` for this item. The non-MCQ question is **silently filtered out** and completely removed from the drafts array before being sent back to the frontend.

## 3. Frontend `BulkImportPage.jsx` Handling

If a non-MCQ question *somehow* manages to bypass the backend validation (for instance, if the AI hallucinates two empty string options `options: ["", ""]`), it arrives at the frontend (`metaskills-frontend/src/pages/admin/BulkImportPage.jsx`).

**What happens on the frontend:**
*   **The AI's `questionType` is ignored:** The frontend code completely ignores the `questionType` field that the AI returned. It assumes everything is an MCQ.
*   **Empty Slate Options:** The `handleStartParsing` success block will try to map the first 4 items of the options array to A, B, C, and D. If the options are missing or empty strings, it generates blank Slate nodes for each option:
    ```javascript
    const optionsSlate = {
      A: { slate: markdownToSlate(draft.options[0] || "") }, // Returns empty slate node
      // ... B, C, D
    };
    ```
*   **Hardcoded to MCQ during Import:** If the user attempts to import this question, the `handleImport` function forcefully hardcodes the question and options type to "MCQ":
    ```javascript
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

**Conclusion for Frontend:** The frontend is structurally incapable of handling non-MCQ questions in the Bulk Import flow. If a non-MCQ question makes it to the UI, it will be forcefully transformed into a broken, empty 4-option MCQ question. However, due to `validateDrafts` in the backend, it normally never reaches the UI in the first place.