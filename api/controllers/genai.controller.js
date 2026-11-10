/**
 * @file genai.controller.js
 * @description Handles requests to AI models for content generation, text processing, and evaluations.
 * @architecture Controller layer integrating the aiService and prompt configurations to produce dynamic content streams.
 */
import asyncHandler from "express-async-handler";
import { getPromptConfig } from "../config/aiPromptConfig.js";
import { aiService } from "../services/ai.service.js";
import * as genaiService from "../services/genai.service.js";
import { chunkText } from "../utils/textChunker.js";
import User from "../models/user.model.js";
import Vocabulary from "../models/Vocabulary.model.js";
import VocabProgress from "../models/VocabProgress.model.js";

const defaultModel = "gemini-3-flash-preview";

/**
 * @desc    Generate a content stream
 * @route   POST /api/genai/stream
 * @access  Public (or protected depending on context)
 */
export const generateContentStream = asyncHandler(async (req, res) => {
  const { apiMode, params } = req.body;

  if (!apiMode || !params) {
    res.status(400);
    throw new Error("apiMode and params are required");
  }

  try {
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const controller = new AbortController();
    req.on("close", () => {
      controller.abort();
    });

    const { text: fullText } = await genaiService.streamContent(
      apiMode,
      params,
      {
        vocabRepo: Vocabulary,
        aiService: aiService,
        abortSignal: controller.signal,
        onStatus: (statusMessage) => {
          if (typeof statusMessage === "object") {
            res.write(JSON.stringify(statusMessage) + "\n");
          } else {
            res.write(
              JSON.stringify({ type: "status", message: statusMessage }) + "\n",
            );
          }
        },
        onChunk: undefined, // Not needed here directly since streamContent handles internal chunk parsing for status, but we could add it if we streamed raw text back. Wait, original didn't stream text back, it only sent 'status' and 'complete' at the end.
      },
    );

    res.write(JSON.stringify({ type: "complete", response: fullText }) + "\n");
    res.end();
  } catch (err) {
    if (err.message === "Request aborted") return; // Client disconnected cleanly
    console.error("Stream Generation Error:", err);

    let userFriendlyMessage =
      "Failed to generate content stream. Please try again later.";
    if (err.status) {
      switch (err.status) {
        case 400:
          userFriendlyMessage =
            "Invalid AI prompt. Please check your instructions and try again.";
          break;
        case 401:
        case 403:
          userFriendlyMessage =
            "AI service authentication/permission failed. Contact an administrator.";
          break;
        case 429:
          userFriendlyMessage =
            "AI rate limit exceeded. Please wait a moment and try again.";
          break;
        case 503:
          userFriendlyMessage =
            "AI models are currently overloaded by high demand. Please try again in a few minutes.";
          break;
        case 504:
          userFriendlyMessage =
            "AI generation timed out. The prompt may be too complex.";
          break;
        default:
          userFriendlyMessage = `AI Service Error (${err.status}): ${err.message}`;
      }
    }

    if (!res.headersSent) {
      res.status(err.status || 500).json({ message: userFriendlyMessage });
    } else {
      res.write(
        JSON.stringify({ type: "error", message: userFriendlyMessage }) + "\n",
      );
      res.end();
    }
  }
});

/**
 * @desc    Evaluate a user-submitted sentence containing a vocabulary word and award carrots on success
 * @route   POST /api/genai/sentence-eval
 * @access  Private
 */
export const evaluateSentence = asyncHandler(async (req, res) => {
  const { word, sentence } = req.body;
  const userId = req.user._id || req.user.id;

  if (!word || !sentence) {
    res.status(400);
    throw new Error("Target word and sentence are required.");
  }

  if (!userId) {
    res.status(401);
    throw new Error("Unauthorized.");
  }

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const result = await genaiService.evaluateSentence(userId, word, sentence, {
      vocabRepo: Vocabulary,
      vocabProgressRepo: VocabProgress,
      aiService,
      onStatus: (msg) =>
        res.write(JSON.stringify({ type: "status", message: msg }) + "\n"),
    });

    let updatedCarrots = null;

    // Process events (side-effects)
    for (const event of result.events) {
      if (event.type === "UPDATE_CARROTS") {
        const { carrotsAwarded } = event.payload;
        try {
          const user = await User.adjustCarrots(userId, carrotsAwarded);
          if (user) updatedCarrots = user.carrots;
        } catch (dbErr) {
          console.error("Sentence Evaluate DB Update Error:", dbErr);
          res.write(
            JSON.stringify({
              type: "error",
              message: "Failed to record evaluation progress.",
            }) + "\n",
          );
          res.end();
          return;
        }
      } else if (event.type === "RECORD_SENTENCE_ATTEMPT") {
        const { vocabItemId } = event.payload;
        try {
          await VocabProgress.findOneAndUpdate(
            { user: userId, word: vocabItemId },
            { lastSentenceTestedAt: new Date() },
          );
        } catch (dbErr) {
          console.error("Sentence Evaluate DB Update Error:", dbErr);
          res.write(
            JSON.stringify({
              type: "error",
              message: "Failed to record evaluation progress.",
            }) + "\n",
          );
          res.end();
          return;
        }
      }
    }

    const enhancedResult = {
      ...result.data,
      carrots: updatedCarrots,
    };

    res.write(
      JSON.stringify({ type: "complete", response: enhancedResult }) + "\n",
    );
    res.end();
  } catch (err) {
    console.error("Sentence Evaluate Error:", err);
    let userFriendlyMessage =
      "Failed to evaluate sentence. Please try again later.";

    // ... [Status mapping logic]
    if (err.status) {
      if (err.expose) {
        userFriendlyMessage = err.message;
      } else {
        switch (err.status) {
          case 400:
            userFriendlyMessage =
              "Invalid AI prompt. Please check your instructions and try again.";
            break;
          case 401:
          case 403:
            userFriendlyMessage =
              "AI service authentication/permission failed. Contact an administrator.";
            break;
          case 404:
            userFriendlyMessage = "Resource not found.";
            break;
          case 429:
            userFriendlyMessage =
              "AI rate limit exceeded. Please wait a moment and try again.";
            break;
          case 503:
            userFriendlyMessage =
              "AI models are currently overloaded by high demand. Please try again in a few minutes.";
            break;
          case 504:
            userFriendlyMessage =
              "AI generation timed out. The prompt may be too complex.";
            break;
          default:
            userFriendlyMessage =
              "An unexpected error occurred. Please try again later.";
        }
      }
    }

    if (!res.headersSent) {
      const statusCode =
        err.status || (res.statusCode === 200 ? 500 : res.statusCode);
      res.status(statusCode).json({ message: userFriendlyMessage });
    } else {
      res.write(
        JSON.stringify({ type: "error", message: userFriendlyMessage }) + "\n",
      );
      res.end();
    }
  }
});

/**
 * @desc    Generate an explanation for a given question, optionally incorporating vision analysis
 * @route   POST /api/genai/explanation
 * @access  Private
 */
export const generateExplanation = asyncHandler(async (req, res) => {
  const { questionText, answerText, imageUrl, customPrompt } = req.body;

  if (!questionText || !answerText) {
    res.status(400);
    throw new Error("questionText and answerText are required.");
  }

  const hasImage =
    !!imageUrl && typeof imageUrl === "string" && imageUrl.trim().length > 0;
  const apiMode = hasImage
    ? "explanation_generator_vision"
    : "explanation_generator";

  let configStrings;
  try {
    configStrings = getPromptConfig(apiMode, {
      questionText,
      answerText,
      customPrompt: customPrompt || "",
    });
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }

  const {
    prompt,
    systemInstruction,
    visionAnalysisPrompt,
    models: modelsToTry = [defaultModel],
  } = configStrings;

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { text: generatedText } = await aiService.generateWithFallback(
      modelsToTry,
      prompt,
      systemInstruction,
      {
        imageUrl: hasImage ? imageUrl : undefined,
        visionAnalysisPrompt: hasImage ? visionAnalysisPrompt : undefined,
        onStatus: (msg) =>
          res.write(JSON.stringify({ type: "status", message: msg }) + "\n"),
      },
    );

    res.write(
      JSON.stringify({
        type: "complete",
        response: {
          success: true,
          explanation: generatedText.trim(),
        },
      }) + "\n",
    );
    res.end();
  } catch (err) {
    console.error("Explanation Generate Error:", err);
    let userFriendlyMessage =
      "Failed to generate explanation. Please try again later.";
    if (err.status) {
      switch (err.status) {
        case 400:
          userFriendlyMessage =
            "Invalid AI prompt. Please check your instructions and try again.";
          break;
        case 401:
        case 403:
          userFriendlyMessage =
            "AI service authentication/permission failed. Contact an administrator.";
          break;
        case 429:
          userFriendlyMessage =
            "AI rate limit exceeded. Please wait a moment and try again.";
          break;
        case 503:
          userFriendlyMessage =
            "AI models are currently overloaded. Please try again in a few minutes.";
          break;
        case 504:
          userFriendlyMessage =
            "AI generation timed out. The prompt may be too complex.";
          break;
        default:
          userFriendlyMessage = `AI Service Error (${err.status}): ${err.message}`;
      }
    }

    res.write(
      JSON.stringify({ type: "error", message: userFriendlyMessage }) + "\n",
    );
    res.end();
  }
});

/**
 * @desc    Generate text-to-speech audio from a provided text snippet
 * @route   POST /api/genai/tts
 * @access  Private
 */
export const generateTTS = asyncHandler(async (req, res) => {
  const { voice = "autumn" } = req.body;
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

  if (text.length === 0) {
    res.status(400);
    throw new Error("Text is required for TTS generation.");
  }

  if (text.length > 200) {
    res.status(400);
    throw new Error("Text exceeds the 200-character limit for TTS.");
  }

  try {
    const base64Audio = await aiService.generateTTS(text, voice);
    res.json({ success: true, audioBase64: base64Audio });
  } catch (err) {
    console.error("[TTS] API Error:", err.message);
    let statusCode = err.status || 500;
    let userMessage = "TTS generation failed. Please try again.";

    if (err.status === 429)
      userMessage = "TTS rate limit exceeded. Please wait and retry.";
    else if (err.status === 401 || err.status === 403)
      userMessage = "TTS authentication failed. Contact an administrator.";

    res.status(statusCode);
    throw new Error(userMessage);
  }
});

/**
 * @desc    Parse raw text into structured MCQ or short-answer questions using AI
 * @route   POST /api/genai/parse-questions
 * @access  Private
 */
export const parseQuestionsText = asyncHandler(async (req, res) => {
  const { rawText, previousTail } = req.body;

  if (!rawText || typeof rawText !== "string" || rawText.trim().length < 20) {
    res.status(400);
    throw new Error(
      "rawText is required and must contain at least 20 characters of extracted text.",
    );
  }

  const truncatedText =
    rawText.length > 60000 ? rawText.substring(0, 60000) : rawText;

  // ── Shared utilities ────────────────────────────────────────────────────────

  const sanitizeJsonResponse = (text) => {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
    return cleaned.trim();
  };

  const VALID_QUESTION_TYPES = ["mcq", "short_answer", "fill_in_the_blank"];

  const validateDrafts = (parsed) => {
    if (!Array.isArray(parsed))
      throw new Error("AI response is not a JSON array.");
    return parsed.filter((item) => {
      // 1. Every question must have text
      if (!item.questionText || typeof item.questionText !== "string")
        return false;

      // 2. Normalize questionType — default to "mcq" for backward compatibility
      if (
        !item.questionType ||
        !VALID_QUESTION_TYPES.includes(item.questionType)
      ) {
        if (Array.isArray(item.options) && item.options.length >= 2) {
          item.questionType = "mcq";
        } else {
          return false; // Cannot determine type and no options — reject
        }
      }

      // 3. Type-specific validation
      if (item.questionType === "mcq") {
        if (!Array.isArray(item.options) || item.options.length < 2)
          return false;
        if (
          typeof item.correctOptionIndex !== "number" ||
          item.correctOptionIndex < 0 ||
          item.correctOptionIndex >= item.options.length
        ) {
          console.warn(
            `[validateDrafts] Rejecting MCQ "${item.questionText.substring(0, 60)}..." — invalid correctOptionIndex: ${item.correctOptionIndex} (options length: ${item.options.length})`,
          );
          return false; // Reject instead of silently defaulting to 0
        }
      } else {
        // short_answer or fill_in_the_blank: options must be empty array
        item.options = [];
        item.correctOptionIndex = -1;
        // Normalize correctAnswer field for non-MCQ
        if (typeof item.correctAnswer !== "string") item.correctAnswer = "";
      }

      // 4. Explanation fallback (same rule for all types)
      if (typeof item.explanation !== "string") item.explanation = "";

      return true;
    });
  };

  /** Estimate word count from a string */
  const wordCount = (str) =>
    (str || "").trim().split(/\s+/).filter(Boolean).length;

  /** Parse AI response into { questionsArray, residualText } */
  const parseAIResponse = (rawResponse) => {
    const sanitized = sanitizeJsonResponse(rawResponse);
    const parsed = JSON.parse(sanitized);

    let questionsArray;
    let residualText = "";

    if (Array.isArray(parsed)) {
      questionsArray = parsed;
    } else if (parsed && Array.isArray(parsed.questions)) {
      questionsArray = parsed.questions;
      residualText =
        typeof parsed.residualText === "string" ? parsed.residualText : "";
    } else {
      throw new Error(
        "AI response is neither a JSON array nor a {questions, residualText} object.",
      );
    }

    return { questionsArray, residualText };
  };

  // ── Chunk the text into token-safe batches ──────────────────────────────────

  const chunks = chunkText(truncatedText);
  const totalChunks = chunks.length;

  console.log(
    `\n[Question Parser] Received ${truncatedText.length} chars → split into ${totalChunks} chunk(s)`,
  );

  // ── Process chunks sequentially ─────────────────────────────────────────────

  const BATCH_DELAY_MS = 2500; // Rate-limit courtesy delay between AI calls (2.5s for Groq TPM limits)
  const allDrafts = [];
  let internalTail = previousTail || "";
  let lastUsedModel = "";

  try {
    for (const chunk of chunks) {
      const chunkIndex = chunk.index;
      const batchMeta = { chunkIndex, totalChunks };

      // Build prompt config for this chunk
      const configStrings = getPromptConfig("question_parser", {
        rawText: chunk.text,
        previousTail: internalTail,
        batchMeta,
      });
      const { prompt, systemInstruction, models } = configStrings;

      const promptChars = prompt.length;
      const sysChars = systemInstruction.length;

      console.log(
        `\n[Question Parser - Chunk ${chunkIndex + 1}/${totalChunks}]`,
      );
      console.log(` - Target Models: ${models.join(", ")}`);
      console.log(
        ` - Chunk Text: ${chunk.text.length} chars, ~${wordCount(chunk.text)} words`,
      );
      console.log(
        ` - Prompt Size: ${promptChars} chars | System: ${sysChars} chars`,
      );
      console.log(` - Total Input: ${sysChars + promptChars} chars`);
      console.log(
        ` - Previous Tail: ${internalTail ? internalTail.length + " chars" : "(none)"}`,
      );
      console.log(` - Timestamp: ${new Date().toISOString()}`);

      const startTime = Date.now();
      const { text: rawResponse, usedModel } =
        await aiService.generateWithFallback(models, prompt, systemInstruction);
      const durationMs = Date.now() - startTime;
      lastUsedModel = usedModel;

      console.log(`[Question Parser - Chunk ${chunkIndex + 1} Response]`);
      console.log(` - Model Used: ${usedModel}`);
      console.log(
        ` - Duration: ${durationMs}ms (${(durationMs / 1000).toFixed(2)}s)`,
      );
      console.log(
        ` - Response: ${rawResponse.length} chars, ~${wordCount(rawResponse)} words`,
      );

      // Parse AI response
      const { questionsArray, residualText } = parseAIResponse(rawResponse);
      const validDrafts = validateDrafts(questionsArray);
      allDrafts.push(...validDrafts);

      console.log(
        ` - Questions Found: ${validDrafts.length} | Residual: ${residualText ? residualText.length + " chars" : "(none)"}`,
      );

      // Thread residual text to next chunk
      internalTail = residualText || "";

      // Rate-limit courtesy delay (skip after last chunk)
      if (chunkIndex < totalChunks - 1) {
        console.log(` - Waiting ${BATCH_DELAY_MS}ms before next chunk...`);
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Heuristic fallback: if the last chunk didn't produce residualText but the
    // client sent previousTail, extract trailing text for cross-page continuity
    if (!internalTail && previousTail) {
      internalTail =
        truncatedText.length > 500 ? truncatedText.slice(-500) : "";
      if (internalTail) {
        console.warn(
          "[Question Parser] AI did not return residualText — using heuristic fallback.",
        );
      }
    }

    console.log(`\n[Question Parser - Summary]`);
    console.log(` - Total Chunks Processed: ${totalChunks}`);
    console.log(` - Total Questions Extracted: ${allDrafts.length}`);
    console.log(
      ` - Final Residual: ${internalTail ? internalTail.length + " chars" : "(none)"}\n`,
    );

    res.json({
      success: true,
      drafts: allDrafts,
      residualText: internalTail,
      model: lastUsedModel,
      count: allDrafts.length,
    });
  } catch (err) {
    console.error("[Question Parser] Failed:", err);

    // Propagate 429 rate-limit status so frontend retry logic can trigger
    const isRateLimit =
      err.status === 429 || (err.message && err.message.includes("rate limit"));

    if (isRateLimit) {
      // If we have partial results from earlier chunks, return them with a flag
      if (allDrafts.length > 0) {
        return res.status(200).json({
          success: true,
          partial: true,
          drafts: allDrafts,
          residualText: internalTail,
          model: lastUsedModel,
          count: allDrafts.length,
          warning:
            "Rate limit reached mid-processing. Partial results returned. Remaining text will be parsed on the next page request.",
        });
      }
      res.status(429);
      throw new Error(
        "All AI models are currently rate-limited. Please wait a moment and try again.",
      );
    }

    res.status(502);
    throw new Error(
      "Failed to parse questions from the provided text. The AI service returned invalid results. Please try again or adjust the input text.",
    );
  }
});
