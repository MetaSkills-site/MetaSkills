# Blueprint: Refactor Explanation Generation 2-Step Vision Pipeline

## 1. Plan Outline
The current explanation generation 2-step vision pipeline has a mismatch between `config/aiPromptConfig.js` (which specifies `__llama_deepseek_pipeline__`) and `controllers/genai.controller.js` (which checks for `__phi_deepseek_pipeline__`). This mismatch prevents the application from utilizing the intended 2-step vision pipeline and forces it to use fallback models instead. The goal is to unify the naming conventions around `llama` across the codebase, configure the system to use `meta-llama/llama-4-scout-17b-16e-instruct` via the NVIDIA NIM API for the image-to-text extraction step, and ensure robust error handling and fallbacks are maintained.

## 2. Requirements Plan
**Files to Modify:**
*   `controllers/genai.controller.js`
*   `config/aiPromptConfig.js`

**Variables/Logic to Update:**
*   **Conditionals:** Change `modelName === '__phi_deepseek_pipeline__'` to `modelName === '__llama_deepseek_pipeline__'`.
*   **Variable Renaming:** Remove any remaining "phi" terminology in comments or variable names, replacing them with "llama" or "scout" conventions.
*   **Model Configuration:** Ensure the `nvClient` payload specifically requests the model `meta-llama/llama-4-scout-17b-16e-instruct`.
*   **Fallback Handling:** Confirm that errors thrown during the `llama-4-scout` (Step 1) or `gpt-oss-120b` (Step 2) API calls are correctly bubbled up so the existing `modelsToTry` loop gracefully falls back to `mistralai/mistral-medium-3-instruct` and `gemini-2.5-flash-lite`.

## 3. Workflow Plan
1.  **Analyze Current State:** Review `aiPromptConfig.js` and `genai.controller.js` to identify all references to the legacy "phi" pipeline.
2.  **Update Controller Logic (`genai.controller.js`):**
    *   Find the `generateExplanation` function.
    *   Update the main conditional block for the 2-step pipeline.
    *   Verify the Step 1 API call uses the correct Llama model and system/user prompts.
    *   Ensure error variables (like `scoutErr` or `dsErr`) are correctly named and throw standard errors with `.status` properties.
3.  **Update Configurations (`aiPromptConfig.js`):**
    *   Verify `explanation_generator_vision` uses `__llama_deepseek_pipeline__` as the primary model.
    *   Update any documentation comments that may still refer to Phi-3-vision or older models.
4.  **Verify Fallback Resilience:** Trace the error handling in the `generateExplanation` loop to guarantee that an error in Step 1 or Step 2 correctly proceeds to the next model in the array without crashing the response stream.

## 4. Detailed Implementation Spec
### `controllers/genai.controller.js`
*   **Locate:** `export const generateExplanation = asyncHandler(async (req, res) => { ... })`
*   **Change:**
    ```javascript
    // FROM:
    if (modelName === '__phi_deepseek_pipeline__') {
    
    // TO:
    if (modelName === '__llama_deepseek_pipeline__') {
    ```
*   **Verify Step 1 API Call:**
    ```javascript
    step1Response = await nvClient.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: visionAnalysisPrompt }
        ]
      }],
      temperature: 0.1,
      max_tokens: 512,
      stream: false,
    });
    ```
*   **Error Handling Verification:**
    Check the catch block for `scoutErr`. It already appears correctly configured to map network timeout/errors to `504` or `502` and assigns it to a new `Error` object. Ensure this logic is preserved so `lastErr` is caught by the outer loop:
    ```javascript
    } catch (scoutErr) {
      const status = scoutErr.status || (scoutErr.code === 'ETIMEDOUT' ? 504 : 502);
      throw Object.assign(
        new Error(`[Pipeline] Llama-4-scout failed: ${scoutErr.message}`),
        { status }
      );
    }
    ```

### `config/aiPromptConfig.js`
*   **Locate:** `getPromptConfig` -> `case 'explanation_generator_vision'`
*   **Verify Models Array:**
    ```javascript
    models: ['__llama_deepseek_pipeline__', 'mistralai/mistral-medium-3-instruct', 'gemini-2.5-flash-lite']
    ```
*   **Update Comments:** Ensure comments clearly reflect "Llama-4-scout → gpt-oss-120b 2-step vision pipeline".

## 5. Risk Assessment
*   **Breaking Changes:** Risk is very low. Currently, due to the naming mismatch, the pipeline is likely failing silently and relying entirely on fallbacks. Implementing this change will restore the intended primary behavior.
*   **Logical Gaps:**
    *   **NVIDIA API Latency:** The 2-step pipeline involves two sequential API calls (Llama-4-scout, then gpt-oss-120b). If the first step has high latency, the overall TTFB (Time To First Byte) for the user might increase. The fallback loop correctly handles complete timeouts.
    *   **Llama Vision Parsing:** If Llama-4-scout hallucinates or fails to parse the image correctly, the deepseek model will generate an incorrect explanation. This is mitigated by setting a low temperature (`0.1`) on the Llama model to keep extraction factual.
