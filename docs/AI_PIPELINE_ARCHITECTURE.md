# AI Pipeline Architecture

This document outlines the architecture, configuration, and integration patterns of the AI pipeline used across the MetaSkills application. The backend integrates multiple AI models from different providers (Groq, Google, Nvidia) through a centralized, resilient orchestration service.

## 1. Architectural Overview

The AI pipeline is built upon the **Provider Strategy Pattern** and centralized via an `AIService` orchestrator. This architecture decouples the Express HTTP controllers from the underlying AI SDKs (OpenAI, Google GenAI), ensuring:
- **Vendor Agnosticism:** Easily swap or add new AI providers.
- **Resilience:** Built-in model fallback mechanisms to handle rate limits or provider downtime.
- **Centralized Configuration:** All prompts and model routing are isolated from implementation logic.
- **Consistent Error Handling & Streaming:** Unified streaming (SSE) with `AbortController` cancellation to prevent zombie requests and token drain.

---

## 2. Core Components

### A. The AI Service (`metaskills-backend/services/ai.service.js`)
The `AIService` is a singleton that orchestrates all AI generation requests. It abstracts the underlying SDKs and manages fallback logic.

**Key Features:**
- `generateWithFallback(models, prompt, systemInstruction, options)`: Tries a list of models sequentially until one succeeds.
- `streamWithFallback(models, prompt, systemInstruction, options)`: Streams responses back to the client using Server-Sent Events (SSE). It respects `AbortSignal`s to cancel requests if the client disconnects.
- `generateTTS(text, voice)`: Specialized handler for Text-to-Speech generation via Groq.

### B. Provider Adapters
All API calls are routed through uniform adapters extending `AIProviderAdapter`:
1. **`GoogleGenAIAdapter`**: Wraps the `@google/genai` SDK for `gemini-*` and `gemma-*` models.
2. **`GroqAdapter`**: Wraps the OpenAI SDK configured with Groq's `baseURL` for fast inference models (e.g., `gpt-oss-120b`, `llama-3.1-70b-instruct`).
3. **`NvidiaAdapter`**: Wraps the OpenAI SDK configured with Nvidia NIM's `baseURL` (e.g., for specialized or large open-source models).

### C. Configuration & Prompts (`metaskills-backend/config/aiPromptConfig.js`)
This file defines all system instructions, prompt builders, and the specific fallback arrays (`models`) for every AI-powered feature.

---

## 3. Features & Configurations (`apiModes`)

The application supports multiple distinct AI features. Each feature maps to an `apiMode` within `getPromptConfig`.

| Feature Mode | Purpose | Primary Model | Fallback Models |
| :--- | :--- | :--- | :--- |
| **`vocab`** | Generates vocabulary words at specific difficulty levels, preventing duplicates based on previous generations. | `openai/gpt-oss-120b` | `gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-3-flash-preview` |
| **`sentences`** | Generates standalone practice sentences at targeted reading levels. | `openai/gpt-oss-120b` | `gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-3-flash-preview` |
| **`passage`** | Drafts comprehensive reading comprehension passages based on topics and difficulty levels. | `openai/gpt-oss-120b` | `gemini-3-flash-preview`, `gemini-2.5-flash`, `gemini-2.5-flash-lite` |
| **`context_attachment`**| Drafts educational context documents or case studies for assessment references. | `openai/gpt-oss-120b` | `gemini-3-flash-preview`, `gemini-2.5-flash`, `gemini-2.5-flash-lite` |
| **`error_analysis`** | Internal developer tool to analyze application error stack traces and generate fix plans. | `openai/gpt-oss-120b` | `gemma-3-27b-it`, `gemma-3-12b-it`, `gemma-3-4b-it` |
| **`sentence_evaluator`**| Grades user-submitted sentences based on usage correctness, meaningfulness, and mechanics (Outputs strict JSON). | `openai/gpt-oss-120b` | `meta/llama3-70b-instruct`, `gemini-3-flash-preview` |
| **`explanation_generator`** | Generates step-by-step math/logic explanations for multiple-choice questions using LaTeX. | `openai/gpt-oss-120b` | `gemini-2.5-flash-lite`, `qwen/qwen2.5-coder-7b-instruct` |
| **`question_parser`** | Extracts structured JSON multiple-choice questions from raw text (used in Bulk Import). | `openai/gpt-oss-120b` | `meta/llama-3.1-70b-instruct`, `gemini-3-flash-preview`, `gemini-2.5-flash` |

---

## 4. Specialized Pipelines

### 2-Step Vision Pipeline (`__llama_deepseek_pipeline__`)
Used exclusively for `explanation_generator_vision` (when explaining a math/logic question that includes an image).

Because complex reasoning models may lack vision capabilities (or vice versa), the service orchestrates a multi-model pipeline:
1. **Step 1 (Vision Extraction):** Uses Nvidia's `meta-llama/llama-4-scout-17b-16e-instruct` to analyze the image and extract all visual text, geometric shapes, labels, and relevant structures as plain text.
2. **Step 2 (Reasoning):** Injects the extracted visual data into the primary prompt and uses Groq's `openai/gpt-oss-120b` to generate the step-by-step LaTeX explanation.

**Fallback:** If the pipeline fails, it falls back to single-pass multimodal models: `mistralai/mistral-medium-3-instruct` (via Nvidia) or `gemini-2.5-flash-lite`.

---

## 5. Integration Points (Controllers)

Express controllers consume the `aiService` rather than initializing SDKs directly.

- **`metaskills-backend/controllers/genai.controller.js`**:
  - `generateContentStream`: Uses `streamWithFallback` to provide real-time UI updates (e.g., "Drafting passage title..."). Attaches `req.on('close')` to the `AbortController`.
  - `evaluateSentence`: Uses `generateWithFallback` to get structured JSON evaluations, computes carrot rewards, and updates database progress.
  - `generateExplanation`: Determines whether to use text-only or vision-pipeline configurations based on the presence of an `imageUrl`.
  - `parseQuestionsText`: Uses `generateWithFallback` to extract JSON drafts for the bulk PDF import feature.
- **`metaskills-backend/controllers/email.controller.js`**:
  - `sendErrorReport`: Uses `generateWithFallback` to analyze crash reports before sending them to admins.