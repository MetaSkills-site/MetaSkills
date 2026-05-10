---
phase: 05-iterative-import
plan: 02
type: execute
wave: 2
depends_on: [05-01]
files_modified: [metaskills-backend/config/aiPromptConfig.js, metaskills-backend/controllers/genai.controller.js]
autonomous: true
requirements: [BULK-02]

must_haves:
  truths:
    - "AI prompt handles 'previousTail' context for question continuation."
    - "Backend returns 'residualText' for context carry-over."
  artifacts:
    - path: "metaskills-backend/config/aiPromptConfig.js"
      provides: "Updated prompt for sliding window"
    - path: "metaskills-backend/controllers/genai.controller.js"
      provides: "Sliding window controller logic"
---

<objective>
Update the backend AI service and prompt configuration to support the 'Sliding Window' strategy. This allows the AI to handle questions split across PDF pages by carrying over text from the end of the previous page.
</objective>

<execution_context>
@/home/jimfleax/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@metaskills-backend/config/aiPromptConfig.js
@metaskills-backend/controllers/genai.controller.js
</context>

<tasks>

<task type="auto">
  <name>Update AI Prompt for Sliding Window</name>
  <files>metaskills-backend/config/aiPromptConfig.js</files>
  <action>
    - Update `QUESTION_PARSER_SYSTEM_INSTRUCTION`:
      - Add a section for "CONTINUATION HANDLING".
      - Instruct the AI to use `previousTail` (if provided) as context for the beginning of the current text.
      - Instruct the AI to identify if the current text ends mid-question and return that partial text in a new `residualText` field in the JSON response.
    - Update `QUESTION_PARSER_PROMPT_BUILDER` to accept and include `previousTail` in the prompt string.
  </action>
  <verify>Prompt instruction includes 'previousTail' and 'residualText' requirements.</verify>
  <done>Prompt is updated for sliding window support.</done>
</task>

<task type="auto">
  <name>Update Controller for Sliding Window</name>
  <files>metaskills-backend/controllers/genai.controller.js</files>
  <action>
    - Modify `parseQuestionsText`:
      - Accept `previousTail` from `req.body`.
      - Pass `previousTail` to `getPromptConfig`.
      - Update the response to include `residualText` returned by the AI.
      - If AI doesn't return `residualText` but text is very long, optionally implement a fallback logic to extract the last few hundred chars of `rawText`.
    - Fix non-MCQ validation in `validateDrafts`:
      - Ensure `short_answer` and `fill_in_the_blank` types preserve their `correctAnswer` values.
      - Ensure `options` is always `[]` for non-MCQ.
  </action>
  <verify>
    `POST /api/genai/parse-questions` handles `previousTail` and returns `residualText`.
    Non-MCQ questions are correctly parsed and validated.
  </verify>
  <done>Backend logic supports iterative parsing with context.</done>
</task>

</tasks>

<success_criteria>
- AI can merge questions split across pages using `previousTail`.
- Backend provides `residualText` for the next page's context.
- Non-MCQ questions (SA, Fill-in-blanks) are robustly handled.
</success_criteria>

<output>
After completion, create `.planning/phases/05-iterative-import/05-02-SUMMARY.md`
</output>
