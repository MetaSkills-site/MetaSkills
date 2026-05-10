# Codebase Concerns

**Analysis Date:** 2024-05-30

## Tech Debt

**Severe Code Duplication (AI Clients):**
- Issue: The client initialization functions `getNvidiaClient()` and `getGroqClient()` are completely duplicated in both `metaskills-backend/controllers/genai.controller.js` and `metaskills-backend/controllers/email.controller.js`.
- Files: `metaskills-backend/controllers/genai.controller.js`, `metaskills-backend/controllers/email.controller.js`
- Impact: Modifying timeout settings, API keys, or adding new providers requires updating multiple files. Increased risk of inconsistencies.
- Fix approach: Extract these functions into a shared utility file (e.g., `metaskills-backend/utils/aiClients.js`) and import them where needed.

**Severe Code Duplication (Model Execution Loop):**
- Issue: The logic to iterate over `modelsToTry`, determine the model provider via string matching (`modelName.includes("gemini")`), format the payload (handling Gemma's lack of `systemInstruction` support), and execute the call is duplicated across five different controller methods (`generateContentStream`, `evaluateSentence`, `generateExplanation`, `parseQuestionsText`, and `sendErrorReport`).
- Files: `metaskills-backend/controllers/genai.controller.js`, `metaskills-backend/controllers/email.controller.js`
- Impact: Fixing a bug in model payload construction or adding support for a new provider (e.g., Anthropic) requires massive refactoring across multiple massive functions. The codebase violates DRY principles.
- Fix approach: Abstract the AI execution loop into a unified service class or helper function `executeAiWithFallback(promptConfig, options)` that handles the provider routing, payload construction, and streaming/non-streaming execution transparently.

## Fragile Areas

**Provider Detection via String Matching:**
- Files: `metaskills-backend/controllers/genai.controller.js`, `metaskills-backend/controllers/email.controller.js`
- Why fragile: The code assumes any model not containing "gemini" and not starting with "gemma" is an OpenAI-compatible model (Groq/NVIDIA). It then guesses the client using `modelName.includes("gpt-oss") ? getGroqClient() : getNvidiaClient()`. If new models are added to `aiPromptConfig.js` without "gpt-oss" or "gemini" in their names, the routing will silently fail or route to the wrong client.
- Safe modification: Define model providers explicitly in `aiPromptConfig.js` (e.g., `{ name: 'gpt-oss-120b', provider: 'groq' }`) instead of relying on string parsing in the controller.

**JSON Parsing Loop in Sentence Evaluator:**
- Files: `metaskills-backend/controllers/genai.controller.js`
- Why fragile: The `evaluateSentence` function implements an inner `while(attempts < 5)` loop just to handle JSON parsing failures. It uses string matching to abort retries on API-level errors (`err.message.includes("fetch failed")`). This is highly susceptible to breaking if SDK error messages change or network errors occur in different formats.
- Safe modification: Improve error type checking and utilize SDK-specific error classes instead of raw string matching on `err.message`.

## Performance Bottlenecks

**Sequential Fallback Delays:**
- Problem: The fallback mechanism (`for (const modelName of modelsToTry)`) operates purely sequentially. If the first model times out after 120 seconds, the user waits 2 minutes before the second model even begins.
- Files: `metaskills-backend/controllers/genai.controller.js`
- Cause: Synchronous `await` inside the `for...of` loop with high timeout ceilings (120,000ms).
- Improvement path: Implement a shorter initial timeout for high-priority fast models, or implement a "race" pattern where a fallback model is preemptively triggered if the primary model doesn't stream the first token within X seconds.

**Hardcoded Client Retries and Timeouts:**
- Problem: `getGroqClient` and `getNvidiaClient` have hardcoded `maxRetries: 0` and long timeouts (`120000ms`). 
- Files: `metaskills-backend/controllers/genai.controller.js`, `metaskills-backend/controllers/email.controller.js`
- Cause: This forces the application to handle all retries through the model fallback loop.
- Improvement path: Leverage the SDK's built-in exponential backoff for minor transient network issues instead of failing the model entirely, which causes a shift to a lower-tier fallback model.

---

*Concerns audit: 2024-05-30*