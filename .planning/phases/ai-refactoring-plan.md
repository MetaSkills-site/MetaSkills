---
phase: ai-refactoring
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - metaskills-backend/services/ai.service.js
  - metaskills-backend/config/aiPromptConfig.js
  - metaskills-backend/controllers/genai.controller.js
  - metaskills-backend/controllers/email.controller.js
autonomous: true
requirements: [AI-REF-01]
must_haves:
  truths:
    - "AI clients are initialized once centrally"
    - "Fallback logic is managed by a single orchestrator service"
    - "Controllers handle HTTP concerns, not AI SDK logic"
    - "Streaming responses work consistently across models"
  artifacts:
    - path: "metaskills-backend/services/ai.service.js"
      provides: "AIService class and provider adapters"
      exports: ["aiService"]
    - path: "metaskills-backend/config/aiPromptConfig.js"
      provides: "Cleaned AI configurations"
  key_links:
    - from: "metaskills-backend/controllers/genai.controller.js"
      to: "metaskills-backend/services/ai.service.js"
      via: "aiService methods"
      pattern: "aiService\\."
---

<objective>
Refactor scattered AI API handlers into a centralized, robust AI Service using the Provider Strategy pattern.

Purpose: Eliminate code duplication, prevent vendor lock-in, ensure consistent error handling, and abstract fallback/retry logic away from Express controllers.
Output: A centralized `ai.service.js` module, simplified `aiPromptConfig.js`, and fully refactored AI-dependent controllers.
</objective>

<context>
@.planning/research/ai-refactoring-patterns.md
@metaskills-backend/controllers/genai.controller.js
@metaskills-backend/controllers/email.controller.js
@metaskills-backend/config/aiPromptConfig.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Centralized AIService with Adapters</name>
  <files>metaskills-backend/services/ai.service.js</files>
  <action>
    Create a new service module implementing the Provider Strategy Pattern as researched.
    - Define an adapter interface/structure with `generate` and `generateStream` methods.
    - Create adapters for Google GenAI (`@google/genai`), Groq (`openai` SDK), and Nvidia (`openai` SDK).
    - Implement the orchestrator class `AIService` which takes an array of model names, resolves the right adapter, and handles loop-based fallback logic.
    - Include the `__llama_deepseek_pipeline__` special logic inside `AIService` rather than the controller.
    - Normalize errors (e.g., throwing specific HTTP status codes like 503 for timeout/overload) inside the service.
    - Implement `AbortController` forwarding.
    - Export a singleton `aiService` instance.
  </action>
  <verify>
    <automated>node --check metaskills-backend/services/ai.service.js</automated>
  </verify>
  <done>ai.service.js correctly wraps multiple AI SDKs and exposes a unified fallback/streaming interface.</done>
</task>

<task type="auto">
  <name>Task 2: Refactor aiPromptConfig</name>
  <files>metaskills-backend/config/aiPromptConfig.js</files>
  <action>
    Clean up `aiPromptConfig.js` to ensure the generated configs map cleanly to the new `AIService`.
    - Ensure the `models` array correctly orders primary and fallback models according to the tiers described in research.
    - Remove redundant controller-specific mappings if any exist.
  </action>
  <verify>
    <automated>node --check metaskills-backend/config/aiPromptConfig.js</automated>
  </verify>
  <done>aiPromptConfig.js cleanly separates configuration from implementation details.</done>
</task>

<task type="auto">
  <name>Task 3: Refactor Controllers to Consume AIService</name>
  <files>metaskills-backend/controllers/genai.controller.js, metaskills-backend/controllers/email.controller.js</files>
  <action>
    Remove direct SDK instantiation (GoogleGenAI, OpenAI) and fallback loops from the controllers.
    - Import `aiService` into both controllers.
    - In `genai.controller.js`, rewrite `generateContentStream` to use `aiService.streamWithFallback`. Pass a callback for the `checkAndSendStatus` tracking to maintain SSE status updates. Attach an `AbortController` linked to `req.on('close')`.
    - Rewrite `evaluateSentence`, `generateExplanation`, and `parseQuestionsText` to use `aiService.generateWithFallback`.
    - In `generateTTS`, use an abstracted TTS method from `aiService`.
    - In `email.controller.js`, replace the custom AI loop in `sendErrorReport` with `aiService.generateWithFallback`.
  </action>
  <verify>
    <automated>node --check metaskills-backend/controllers/genai.controller.js && node --check metaskills-backend/controllers/email.controller.js</automated>
  </verify>
  <done>Both controllers solely rely on AIService for LLM communication, shedding redundant SDK loop logic.</done>
</task>

</tasks>

<verification>
- Start the backend and verify syntax using `node --check`.
- Verify that standard AI requests (e.g., TTS, evaluation) execute properly without hanging.
- Verify streaming works and triggers fallback on simulated provider failure.
- Verify client disconnects correctly trigger AbortController cleanup to save tokens.
</verification>

<success_criteria>
- No direct `new GoogleGenAI` or `new OpenAI` calls in controllers.
- Unified error catch blocks that don't need custom checks per-provider in the controller layer.
- `req.on('close')` correctly aborts streams to save tokens.
</success_criteria>

<output>
After completion, create `.planning/phases/ai-refactoring-plan-SUMMARY.md`
</output>
