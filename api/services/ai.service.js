/**
 * @file ai.service.js
 * @description Provides a unified interface and adapter pattern for generating content using various AI providers.
 * @architecture Acts as the central AI integration layer, providing fallback logic and standardizing inputs/outputs across models.
 */
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

/**
 * @desc    Interface/Adapter base for AI Providers
 * @class
 */
class AIProviderAdapter {
  constructor(modelName) {
    this.modelName = modelName;
  }
  // eslint-disable-next-line no-unused-vars
  async generate(prompt, systemInstruction) {
    throw new Error("Not implemented");
  }
  // eslint-disable-next-line no-unused-vars
  async *generateStream(prompt, systemInstruction, signal) {
    yield* [];
    throw new Error("Not implemented");
  }
}

class GoogleGenAIAdapter extends AIProviderAdapter {
  constructor(modelName) {
    super(modelName);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Server missing GEMINI_API_KEY configuration");
    this.client = new GoogleGenAI({ apiKey });
  }

  _buildCallConfig(prompt, systemInstruction) {
    const isGemma = this.modelName.toLowerCase().startsWith("gemma");
    let callConfig = { model: this.modelName };

    if (isGemma) {
      callConfig.contents = systemInstruction
        ? `${systemInstruction}\n\n${prompt}`
        : prompt;
      callConfig.config = { temperature: 0.1 }; // using a default, can be parameterized
    } else {
      callConfig.contents = prompt;
      callConfig.config = { temperature: 0.1 };
      if (systemInstruction) {
        callConfig.config.systemInstruction = systemInstruction;
      }
    }
    return callConfig;
  }

  async generate(prompt, systemInstruction) {
    const callConfig = this._buildCallConfig(prompt, systemInstruction);
    const response = await this.client.models.generateContent(callConfig);
    return response.text;
  }

  async *generateStream(prompt, systemInstruction, signal) {
    const callConfig = this._buildCallConfig(prompt, systemInstruction);
    const responseStream =
      await this.client.models.generateContentStream(callConfig);
    for await (const chunk of responseStream) {
      if (signal?.aborted) throw new Error("Request aborted");
      if (chunk.text) yield chunk.text;
    }
  }
}

class OpenAILikeAdapter extends AIProviderAdapter {
  constructor(modelName, baseURL, apiKey, timeout) {
    super(modelName);
    if (!apiKey) throw new Error(`Missing API key for ${baseURL}`);
    this.client = new OpenAI({ apiKey, baseURL, timeout, maxRetries: 0 });
  }

  async generate(prompt, systemInstruction) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: "system",
            content: systemInstruction || "You are a helpful assistant.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });
      return response.choices?.[0]?.message?.content || "";
    } catch (err) {
      const status = err.status || (err.code === "ETIMEDOUT" ? 504 : 502);
      throw Object.assign(new Error(`API error: ${err.message}`), { status });
    }
  }

  async *generateStream(prompt, systemInstruction, signal) {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: "system",
            content: systemInstruction || "You are a helpful assistant.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        stream: true,
      });

      for await (const chunk of stream) {
        if (signal?.aborted) throw new Error("Request aborted");
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) yield content;
      }
    } catch (err) {
      const status = err.status || (err.code === "ETIMEDOUT" ? 504 : 502);
      throw Object.assign(new Error(`API error: ${err.message}`), { status });
    }
  }
}

class NvidiaAdapter extends OpenAILikeAdapter {
  constructor(modelName) {
    super(
      modelName,
      "https://integrate.api.nvidia.com/v1",
      process.env.NVIDIA_API_KEY,
      parseInt(process.env.NVIDIA_API_TIMEOUT) || 180000,
    );
  }
}

class GroqAdapter extends OpenAILikeAdapter {
  constructor(modelName) {
    super(
      modelName,
      "https://api.groq.com/openai/v1",
      process.env.GROQ_API_KEY,
      120000,
    );
  }
}

/**
 * @desc    Service for interacting with AI models, managing adapters, and handling fallback logic.
 * @class
 */
class AIService {
  _resolveAdapter(modelName) {
    if (
      modelName.toLowerCase().includes("gemini") ||
      modelName.toLowerCase().startsWith("gemma")
    ) {
      return new GoogleGenAIAdapter(modelName);
    } else if (
      modelName.includes("gpt-oss") ||
      modelName.includes("llama-3.1-70b-instruct")
    ) {
      return new GroqAdapter(modelName);
    } else if (
      modelName.includes("mistral") ||
      modelName.includes("qwen") ||
      modelName.startsWith("meta/")
    ) {
      return new NvidiaAdapter(modelName);
    } else {
      return new GroqAdapter(modelName); // Default OpenAILike
    }
  }

  _getNvidiaClient() {
    return new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
      timeout: parseInt(process.env.NVIDIA_API_TIMEOUT) || 120000,
      maxRetries: 0,
    });
  }

  _getGroqClient() {
    return new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      timeout: 120000,
      maxRetries: 0,
    });
  }

  /**
   * @desc    Generates AI content attempting multiple models sequentially on failure/rate limit.
   * @param   {Array<string>} models - List of model names to attempt.
   * @param   {string} prompt - The user prompt.
   * @param   {string} systemInstruction - The system instructions.
   * @param   {Object} options - Additional options like onStatus callback and imageUrl.
   * @returns {Promise<Object>} An object containing the generated text and the used model name.
   */
  async generateWithFallback(models, prompt, systemInstruction, options = {}) {
    let lastErr = null;
    let allRateLimited = true; // Track if every failure was a rate limit
    const { onStatus } = options;

    for (const modelName of models) {
      // Per-model retry loop for rate limits (429)
      const MAX_MODEL_RETRIES = 2;
      let modelRetries = 0;

      while (modelRetries <= MAX_MODEL_RETRIES) {
        try {
          if (onStatus) onStatus(`Generating using ${modelName}...`);

          if (modelName === "__llama_deepseek_pipeline__") {
            return await this._runLlamaDeepseekPipeline(
              prompt,
              systemInstruction,
              options.imageUrl,
              onStatus,
              options,
            );
          }

          if (
            modelName === "mistralai/mistral-medium-3-instruct" &&
            options.imageUrl
          ) {
            const nvClient = this._getNvidiaClient();
            const response = await nvClient.chat.completions.create({
              model: modelName,
              messages: [
                {
                  role: "system",
                  content: systemInstruction || "You are a helpful assistant.",
                },
                {
                  role: "user",
                  content: [
                    { type: "image_url", image_url: { url: options.imageUrl } },
                    { type: "text", text: prompt },
                  ],
                },
              ],
              temperature: 0.3,
              max_tokens: 1024,
              stream: false,
            });
            const extractedText = response.choices?.[0]?.message?.content || "";
            return { text: extractedText, usedModel: modelName };
          }

          const adapter = this._resolveAdapter(modelName);
          const result = await adapter.generate(prompt, systemInstruction);
          if (result) return { text: result, usedModel: modelName };
          throw new Error("Empty response from model");
        } catch (err) {
          lastErr = err;
          const isRateLimit =
            err.status === 429 ||
            (err.message && err.message.includes("rate limit"));

          if (isRateLimit && modelRetries < MAX_MODEL_RETRIES) {
            // Rate limit — wait with exponential backoff before retrying same model
            modelRetries++;
            const waitMs = 5000 * Math.pow(2, modelRetries - 1); // 5s, 10s
            console.warn(
              `[AIService] Model ${modelName} rate-limited (429). Retry ${modelRetries}/${MAX_MODEL_RETRIES} in ${waitMs}ms...`,
            );
            if (onStatus)
              onStatus(
                `Rate limited on ${modelName}, retrying in ${Math.round(waitMs / 1000)}s...`,
              );
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue; // Retry the same model
          }

          // Not a rate limit, or retries exhausted — move to next model
          if (!isRateLimit) allRateLimited = false;
          console.warn(
            `[AIService] Model ${modelName} failed:`,
            err.message || err,
          );
          if (modelName !== models[models.length - 1] && onStatus) {
            onStatus(`Model ${modelName} failed, retrying with next model...`);
          }
          break; // Exit the per-model retry loop, move to next model
        }
      }
    }

    // If every single model was rate-limited, propagate 429 to the client
    // so the frontend retry logic (which checks for 429) can trigger
    if (allRateLimited && lastErr) {
      const rateLimitError = new Error(
        `All AI models are rate-limited. Please wait before retrying.`,
      );
      rateLimitError.status = 429;
      throw rateLimitError;
    }

    throw lastErr || new Error("All AI models failed");
  }

  async _runLlamaDeepseekPipeline(
    prompt,
    systemInstruction,
    imageUrl,
    onStatus,
    options = {},
  ) {
    if (onStatus) onStatus(`Analyzing image...`);
    const nvClient = this._getNvidiaClient();
    let step1Response;
    try {
      step1Response = await nvClient.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              {
                type: "text",
                text: options.visionAnalysisPrompt || "Extract text from image",
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 512,
      });
    } catch (scoutErr) {
      throw Object.assign(
        new Error(`[Pipeline] Llama-4-scout failed: ${scoutErr.message}`),
        { status: scoutErr.status || 502 },
      );
    }

    const imageAnalysis =
      step1Response.choices?.[0]?.message?.content?.trim() || "";
    if (!imageAnalysis)
      throw Object.assign(
        new Error("[Pipeline] Llama-4-scout returned empty."),
        { status: 502 },
      );

    if (onStatus) onStatus(`Writing explanation...`);
    const enhancedPrompt = `${prompt}\n\n---\n**Image Analysis (extracted from the diagram/figure):**\n${imageAnalysis}`;

    const groqClient = this._getGroqClient();
    try {
      const step2Response = await groqClient.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: systemInstruction || "You are a helpful assistant.",
          },
          { role: "user", content: enhancedPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      });
      const generatedText = step2Response.choices?.[0]?.message?.content || "";
      if (!generatedText) throw new Error("[Pipeline] gpt-oss-120b empty.");
      return { text: generatedText, usedModel: "__llama_deepseek_pipeline__" };
    } catch (dsErr) {
      throw Object.assign(
        new Error(`[Pipeline] gpt-oss-120b failed: ${dsErr.message}`),
        { status: dsErr.status || 502 },
      );
    }
  }

  /**
   * @desc    Streams AI content attempting multiple models sequentially on failure.
   * @param   {Array<string>} models - List of model names to attempt.
   * @param   {string} prompt - The user prompt.
   * @param   {string} systemInstruction - The system instructions.
   * @param   {Object} options - Additional options like signal, onStatus, and onChunk.
   * @returns {Promise<Object>} An object containing the full text and the used model name.
   */
  async streamWithFallback(models, prompt, systemInstruction, options = {}) {
    let lastErr = null;
    const { signal, onStatus, onChunk } = options;

    for (const modelName of models) {
      try {
        if (onStatus)
          onStatus({
            type: "status",
            message: `Analyzing using ${modelName}...`,
          });

        const adapter = this._resolveAdapter(modelName);
        const stream = adapter.generateStream(
          prompt,
          systemInstruction,
          signal,
        );

        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          if (onChunk) onChunk(fullText, chunk);
        }

        return { text: fullText, usedModel: modelName };
      } catch (err) {
        lastErr = err;
        console.warn(
          `[AIService] Model ${modelName} failed streaming:`,
          err.message || err,
        );
        if (signal?.aborted) throw err; // Don't fallback if aborted
        if (modelName !== models[models.length - 1] && onStatus) {
          onStatus({
            type: "status",
            message: `Model ${modelName} failed, retrying with next model...`,
          });
        }
      }
    }
    throw lastErr || new Error("All AI models failed streaming");
  }

  /**
   * @desc    Generates Text-to-Speech audio using the Groq API.
   * @param   {string} text - Text to convert to speech.
   * @param   {string} voice - Voice model to use.
   * @returns {Promise<string>} Base64 encoded WAV audio data.
   */
  async generateTTS(text, voice = "autumn") {
    const groq = this._getGroqClient();
    const response = await groq.audio.speech.create({
      model: "canopylabs/orpheus-v1-english",
      voice: voice,
      input: text,
      response_format: "wav",
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  }
}

export const aiService = new AIService();
