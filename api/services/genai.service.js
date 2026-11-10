/**
 * @file genai.service.js
 * @description Provides generative AI services for vocabulary and reading passage generation.
 * @architecture Uses ai.service.js as a unified AI provider and applies domain-specific logic.
 */
import { getPromptConfig } from "../config/aiPromptConfig.js";

const defaultModel = "gemini-3-flash-preview";

// Helper to prevent Regex injection attacks
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @desc    Streams generated content for a specific AI mode and handles domain tracking.
 * @param   {string} apiMode - The mode of generation (e.g., 'vocab', 'sentences', 'passage').
 * @param   {Object} params - Parameters for the prompt configuration.
 * @param   {Object} deps - Dependencies and callbacks (vocabRepo, aiService, onStatus, onChunk, abortSignal).
 * @returns {Promise<Object>} An object containing the generated full text.
 */
export const streamContent = async (
  apiMode,
  params,
  { vocabRepo, aiService, onStatus, onChunk, abortSignal },
) => {
  if (apiMode === "vocab") {
    try {
      const recentWords = await vocabRepo
        .find()
        .sort({ createdAt: -1 })
        .limit(500)
        .select("word");
      params.generated = recentWords.map((v) => v.word).join(", ");
    } catch (dbErr) {
      console.error(
        "Error fetching recent vocabulary for prompt exclusion:",
        dbErr,
      );
      params.generated = "";
    }
  }

  const configStrings = getPromptConfig(apiMode, params);
  const prompt = configStrings.prompt;
  const systemInstruction = configStrings.systemInstruction;
  const modelsToTry = configStrings.models || [
    configStrings.model || defaultModel,
  ];

  let trackingState = {
    vocabCount: 0,
    sentenceCount: 0,
    passagePhase: 0,
  };

  const handleChunk = (currentText) => {
    if (onChunk) onChunk(currentText);

    if (apiMode === "vocab") {
      const matches = currentText.match(/-\s*definition/gi);
      if (matches && matches.length > trackingState.vocabCount) {
        trackingState.vocabCount++;
        onStatus(
          `Drafting definitions for Word ${trackingState.vocabCount}...`,
        );
      }
    } else if (apiMode === "sentences") {
      const matches = currentText.match(/\bSentence\s*\d+/gi);
      if (matches && matches.length > trackingState.sentenceCount) {
        trackingState.sentenceCount++;
        onStatus(`Crafting Sentence ${trackingState.sentenceCount}...`);
      }
    } else if (apiMode === "passage" || apiMode === "context_attachment") {
      const len = currentText.length;
      if (trackingState.passagePhase === 0 && currentText.includes("TITLE:")) {
        trackingState.passagePhase = 1;
        onStatus("Drafting passage title...");
      } else if (
        trackingState.passagePhase === 1 &&
        (currentText.includes("BODY:") || len > 100)
      ) {
        trackingState.passagePhase = 2;
        onStatus("Writing passage content...");
      } else if (trackingState.passagePhase === 2 && len > 500) {
        trackingState.passagePhase = 3;
        onStatus("Developing main ideas...");
      } else if (trackingState.passagePhase === 3 && len > 1200) {
        trackingState.passagePhase = 4;
        onStatus("Expanding passage details...");
      } else if (trackingState.passagePhase === 4 && len > 2200) {
        trackingState.passagePhase = 5;
        onStatus("Crafting conclusion...");
      }
    }
  };

  const { text: fullText } = await aiService.streamWithFallback(
    modelsToTry,
    prompt,
    systemInstruction,
    {
      signal: abortSignal,
      onStatus: (msg) => onStatus(msg),
      onChunk: handleChunk,
    },
  );

  return { text: fullText };
};

/**
 * @desc    Evaluates a user-provided sentence for vocabulary usage and awards carrots based on accuracy.
 * @param   {string} userId - The ID of the user.
 * @param   {string} word - The vocabulary word being evaluated.
 * @param   {string} sentence - The sentence provided by the user.
 * @param   {Object} deps - Dependencies and callbacks.
 * @returns {Promise<Object>} The evaluation result including accuracy, errors, and awarded carrots.
 */
export const evaluateSentence = async (
  userId,
  word,
  sentence,
  { vocabRepo, vocabProgressRepo, aiService, onStatus },
) => {
  let definition = "";
  let vocabItem;
  try {
    const escapedWord = escapeRegExp(word);
    vocabItem = await vocabRepo.findOne({
      word: { $regex: new RegExp(`^${escapedWord}$`, "i") },
    });
    if (vocabItem) {
      definition = vocabItem.definition;
    }
  } catch (error) {
    console.error("[Sentence Eval] Failed to fetch definition:", error);
    throw error;
  }

  if (!vocabItem) {
    const err = new Error("Vocabulary reference not found.");
    err.status = 404;
    err.expose = true;
    throw err;
  }

  const progressRecord = await vocabProgressRepo.findOne({
    user: userId,
    word: vocabItem._id,
  });

  if (
    !progressRecord ||
    typeof progressRecord.box !== "number" ||
    progressRecord.box < 2
  ) {
    const err = new Error(
      "Word is not eligible for sentence practice yet. Keep reviewing it in MCQ mode!",
    );
    err.status = 403;
    err.expose = true;
    throw err;
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  if (progressRecord.lastSentenceTestedAt) {
    if (
      progressRecord.box === 2 &&
      progressRecord.lastSentenceTestedAt > threeDaysAgo
    ) {
      const err = new Error(
        "Word is cooling down. Please wait 3 days between sentence practices for Box 2 words.",
      );
      err.status = 403;
      err.expose = true;
      throw err;
    }
    if (
      progressRecord.box >= 3 &&
      progressRecord.lastSentenceTestedAt > fiveDaysAgo
    ) {
      const err = new Error(
        "Word is cooling down. Please wait 5 days between sentence practices for Box 3+ words.",
      );
      err.status = 403;
      err.expose = true;
      throw err;
    }
  }

  const promptStrings = getPromptConfig("sentence_evaluator");
  const promptTemplate = promptStrings.prompt;
  const systemInstruction = promptStrings.systemInstruction;
  let prompt = promptTemplate.replace("{{TARGET_WORD}}", word);
  prompt = prompt.replace(
    "{{TARGET_DEFINITION}}",
    definition || "No definition provided.",
  );
  prompt = prompt.replace("{{USER_SENTENCE}}", sentence);

  const modelsToTry = promptStrings.models || [defaultModel];

  const parseGeminiJSON = (text) => {
    let rawResponse = text.trim();
    if (rawResponse.startsWith("```json"))
      rawResponse = rawResponse.substring(7);
    else if (rawResponse.startsWith("```"))
      rawResponse = rawResponse.substring(3);
    if (rawResponse.endsWith("```")) rawResponse = rawResponse.slice(0, -3);
    return JSON.parse(rawResponse.trim());
  };

  const { text: textResponse } = await aiService.generateWithFallback(
    modelsToTry,
    prompt,
    systemInstruction,
    {
      onStatus: onStatus ? (msg) => onStatus(msg) : undefined,
    },
  );

  let resultJson;
  try {
    resultJson = parseGeminiJSON(textResponse);
  } catch {
    const err = new Error("Failed to parse JSON response from AI.");
    err.status = 502;
    err.expose = false;
    throw err;
  }

  if (typeof resultJson.accuracy === "string") {
    resultJson.accuracy =
      Number(resultJson.accuracy.replace(/[^0-9.]/g, "")) || 0;
  }

  if (
    typeof resultJson.accuracy !== "number" ||
    !Array.isArray(resultJson.errors)
  ) {
    const err = new Error("JSON missing required fields (accuracy or errors)");
    err.status = 502;
    err.expose = false;
    throw err;
  }

  let carrotsAwarded = 0;
  const events = [];

  events.push({
    type: "RECORD_SENTENCE_ATTEMPT",
    payload: { vocabItemId: vocabItem._id },
  });

  if (resultJson && resultJson.accuracy > 60 && userId) {
    carrotsAwarded = Math.min(
      10,
      Math.ceil(((resultJson.accuracy - 60) / 40) * 10),
    );
    carrotsAwarded = Math.max(1, carrotsAwarded);

    events.push({
      type: "UPDATE_CARROTS",
      payload: { userId, carrotsAwarded, vocabItemId: vocabItem._id },
    });
  }

  return {
    success: true,
    data: { ...resultJson, carrotsAwarded },
    events,
  };
};
