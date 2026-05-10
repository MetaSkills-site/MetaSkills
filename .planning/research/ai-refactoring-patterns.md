# AI Service Refactoring Patterns

**Domain:** Express.js Backend Architecture
**Context:** Centralizing scattered AI handlers (Groq, Google GenAI, Nvidia) into a robust service.
**Overall Confidence:** HIGH

## Executive Summary

Integrating multiple LLM providers directly into Express controllers leads to code duplication, brittle error handling, and vendor lock-in. In 2024, the standard for Node.js backends is to decouple business logic from vendor SDKs using a **Provider Strategy (Adapter) Pattern**. This enables centralized configuration, robust streaming, unified error handling, and sophisticated model fallback capabilities.

---

## 1. Client Initialization (The Factory/Adapter Pattern)

Scattered initialization of SDKs across the application makes it hard to manage credentials, rotate keys, and apply global configurations (like timeouts or custom base URLs).

### Best Practices:
- **Singleton Provider Registry:** Instantiate all AI clients once at application startup.
- **Unified Interface:** Create an abstract class or interface (`LLMProvider`) that enforces a standard `generate()` and `stream()` method, regardless of the underlying SDK (Groq, Google, Nvidia).
- **OpenAI Compatibility Layer:** Leverage the fact that many modern providers (including Groq and Google GenAI) support the OpenAI SDK format. You can often use the `openai` npm package with a custom `baseURL` to unify initialization.

```typescript
// Example Adapter Pattern
interface LLMProvider {
  generateStream(messages: any[], options: any): AsyncIterable<any>;
}

class GroqAdapter implements LLMProvider {
  private client: OpenAI;
  constructor(apiKey: string) {
    // Groq supports OpenAI SDK compatibility
    this.client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
  }
  // ... implementation
}
```

---

## 2. Stream Management

AI models are slow. Waiting for a full response blocks the Express event loop and ruins UX. Centralizing stream management prevents inconsistent chunk handling across different controllers.

### Best Practices:
- **Server-Sent Events (SSE):** Standardize all AI Express routes to return `text/event-stream`. Set proper headers (`Cache-Control: no-cache`, `Connection: keep-alive`).
- **Unified Stream Parser:** Create a utility that normalizes the chunk format from different providers into a standard internal format before piping it to the Express `res` object.
- **AbortControllers:** Always attach an `AbortController` to AI streams. If the client disconnects (`req.on('close', ...)`), explicitly abort the downstream AI API request to prevent zombie processes and save costs.

```typescript
// Centralized Express Streaming Handler
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  
  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  try {
    const stream = await aiService.streamResponse(req.body.messages, { signal: abortController.signal });
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.end();
  } catch (err) {
    // Handle gracefully
  }
});
```

---

## 3. Error Handling & Resilience

AI APIs fail frequently due to rate limits (`429`), timeouts, or provider outages (`503`).

### Best Practices:
- **Centralized Catch Block:** The adapter pattern allows you to catch provider-specific errors and normalize them into standard application errors (e.g., mapping Google's `503` and Groq's `429` to a generic `AIProviderError`).
- **Exponential Backoff:** Implement retries (using a library like `p-retry`) exclusively for transient errors (e.g., `429`, `5xx`). Never retry `400` (Bad Request) errors.
- **Timeouts:** Enforce strict timeouts at the adapter level. If Groq hangs for 10 seconds, abort the request and throw a timeout error to trigger the fallback logic.
- **Cost & Token Monitoring:** Log token usage, latency, and "Finish Reason" centrally on successful generation to monitor anomalies.

---

## 4. Model Fallback Pattern

A single-provider dependency is a single point of failure. The fallback orchestrator is the most critical component of a robust AI service.

### Best Practices:
- **Prioritized Routing:** Define tiers of models.
  - *Tier 1 (Primary):* Fast/High-Quality (e.g., Groq Llama-3).
  - *Tier 2 (Fallback):* High-Quality/Slower (e.g., Google GenAI / Gemini).
  - *Tier 3 (Resilience):* Nvidia API models.
- **Failover Logic:** The centralized `AIService` iterates through the provider array. If `provider[i]` throws a network or timeout error, it logs the failure and automatically retries the exact same prompt with `provider[i+1]`.
- **Transparency:** When a fallback occurs, include a custom header (e.g., `X-AI-Model-Used: gemini-1.5`) in the response so the frontend knows which model actually fulfilled the request.

```typescript
// Fallback Orchestrator Example
class AIService {
  constructor(private providers: LLMProvider[]) {}

  async generateWithFallback(messages: any[], options: any) {
    let lastError;
    
    for (const provider of this.providers) {
      try {
        // Enforce strict timeout for failover
        return await provider.generate(messages, { ...options, timeout: 5000 });
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed. Failing over...`, { error });
        lastError = error;
      }
    }
    
    throw new Error(`All AI providers failed. Last error: ${lastError.message}`);
  }
}
```

---

## Recommended Migration Plan

1. **Phase 1: Abstract the Interface**
   Create the `LLMProvider` interface and implement adapters for Groq, Google GenAI, and Nvidia without changing the Express routes yet.
2. **Phase 2: Build the Orchestrator**
   Implement the `AIService` with the loop-based fallback logic and exponential backoff.
3. **Phase 3: Route Refactoring**
   Migrate Express controllers one by one to use `aiService.streamWithFallback()` instead of direct vendor SDK calls. Implement `AbortController` cleanup in each route.
4. **Phase 4: Observability**
   Add centralized Winston/Pino logging within the `AIService` to track fallback occurrences and token costs.