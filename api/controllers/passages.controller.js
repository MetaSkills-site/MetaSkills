/**
 * @file passages.controller.js
 * @description Controller for managing passages and grammar questions.
 * @architecture Handles creation, retrieval, and dynamic quiz generation for passage/grammar types.
 */
import Passages from "../models/Passages.model.js";
import expressAsyncHandler from "express-async-handler";
import nlp from "compromise";
import Vocabulary from "../models/Vocabulary.model.js";

import generateToken from "../utils/genToken.js";
import crypto from "crypto";
import { encryptData } from "../utils/encryption.js";
import { getDisplayDifficulty } from "../utils/elo.js";

/**
 * @desc    Create a new passage
 * @route   POST /api/passages
 * @access  Private (Admin)
 */
const createPassage = expressAsyncHandler(async (req, res) => {
  const { title, text } = req.body;

  // For full passages, title is usually good to have, but for flexibility let's allow optional.
  if (!text) {
    res.status(400);
    throw new Error("Text content is required");
  }

  const passage = await Passages.create({
    title: title || "Untitled Passage",
    text,
    type: "passage",
  });

  res.status(201).json({
    success: true,
    data: passage,
  });
});

// ... existing code ...

/**
 * @desc    Bulk create sentences from raw text
 * @route   POST /api/passages/bulk-sentences
 * @access  Private (Admin)
 */
const createBulkSentences = expressAsyncHandler(async (req, res) => {
  const { text } = req.body; // Expecting raw text block

  if (!text) {
    res.status(400);
    throw new Error("Text content is required");
  }

  // Split by newline and filter empty
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    res.status(400);
    throw new Error("No valid sentences found");
  }

  const sentencesToInsert = lines.map((line) => ({
    text: line, // Simple string text for sentences
    type: "sentence",
    title: "Sentence",
  }));

  const inserted = await Passages.insertMany(sentencesToInsert);

  res.status(201).json({
    success: true,
    count: inserted.length,
    message: `Successfully added ${inserted.length} sentences`,
    data: inserted,
  });
});

/**
 * @desc    Get all passages (with pagination and filters)
 * @route   GET /api/passages
 * @access  Private
 */
const getAllPassages = expressAsyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20, type } = req.query;
  let query = {};

  if (search) {
    query.$or = [{ title: { $regex: search, $options: "i" } }];
  }

  if (type) {
    // If requesting 'passage', we might want everything that IS NOT sentence, or explicitly 'passage'.
    // Frontend uses: type !== 'sentence' for passages tab.
    // Let's support explicit 'sentence' or 'passage'
    query.type = type;
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const passages = await Passages.find(query).sort({ createdAt: -1 }).lean(); // Add .lean() to allow adding fields

  // Map display difficulty to each passage item
  let filteredPassages = passages.map((passage) => {
    return {
      ...passage,
      displayDifficulty: getDisplayDifficulty(passage.rating ?? 1200),
    };
  });

  const { difficulty } = req.query;

  // Apply Difficulty Filtering if provided
  if (difficulty) {
    const diffFilters = difficulty.split(",");

    filteredPassages = filteredPassages.filter((passage) => {
      let band = "Medium";
      const d = passage.displayDifficulty;

      if (d <= 35) band = "Easy";
      else if (d > 35 && d <= 60) band = "Medium";
      else if (d > 60 && d <= 80) band = "Hard";
      else band = "Very Hard";

      return diffFilters.includes(band);
    });
  }

  const total = filteredPassages.length;

  // Apply Pagination after filtering
  const paginatedPassages = filteredPassages.slice(skip, skip + limitNum);

  res.status(200).json({
    success: true,
    data: paginatedPassages,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  });
});

/**
 * @desc    Get a single passage by ID
 * @route   GET /api/passages/:id
 * @access  Private
 */
const getPassageById = expressAsyncHandler(async (req, res) => {
  const passage = await Passages.findById(req.params.id);

  if (!passage) {
    res.status(404);
    throw new Error("Passage not found");
  }

  res.status(200).json({
    success: true,
    data: passage,
  });
});

/**
 * @desc    Update an existing passage
 * @route   PUT /api/passages/:id
 * @access  Private (Admin)
 */
const updatePassage = expressAsyncHandler(async (req, res) => {
  const passage = await Passages.findById(req.params.id);

  if (!passage) {
    res.status(404);
    throw new Error("Passage not found");
  }

  const updatedPassage = await Passages.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true },
  );

  res.status(200).json({
    success: true,
    data: updatedPassage,
  });
});

/**
 * @desc    Delete a passage
 * @route   DELETE /api/passages/:id
 * @access  Private (Admin)
 */
const deletePassage = expressAsyncHandler(async (req, res) => {
  const passage = await Passages.findById(req.params.id);

  if (!passage) {
    res.status(404);
    throw new Error("Passage not found");
  }

  await passage.deleteOne();

  res.status(200).json({
    success: true,
    message: "Passage removed",
  });
});

/**
 * @desc    Generate a fill-in-the-blanks quiz from a passage
 * @route   GET /api/passages/quiz/passage
 * @access  Private
 */
const generatePassageQuiz = expressAsyncHandler(async (req, res) => {
  // History/Passage Marathon: Focus on Fill-in-the-blanks from Passages

  // 1. Get a random passage (excluding sentences)
  const passage = await Passages.aggregate([
    { $match: { type: { $ne: "sentence" } } },
    { $sample: { size: 1 } },
  ]);

  if (!passage || passage.length === 0) {
    res.status(404);
    throw new Error("No passages found");
  }

  const selectedPassage = passage[0];

  // 2. Extract text
  const plainText = String(selectedPassage.text || "");

  // 3. Generate Blanks
  const result = generateBlanksQuestion(plainText);
  const answerHashes = result.answers.map((ans) =>
    crypto.createHash("sha256").update(ans.trim().toLowerCase()).digest("hex"),
  );

  // Payload: Hash for verification, Encrypted for result display using the new util
  const encryptedAnswers = encryptData(result.answers);

  const tokenPayload = {
    type: "passage",
    passageId: selectedPassage._id,
    answerHashes: answerHashes,
    encryptedAnswers: encryptedAnswers,
  };

  const token = generateToken(tokenPayload);

  // Shuffle answers for Word Bank
  const wordBank = [...result.answers].sort(() => 0.5 - Math.random());

  res.status(200).json({
    success: true,
    data: {
      text: result.text,
      // answers: result.answers, // REMOVE raw answers
      wordBank: wordBank, // Send shuffled bank
      token: token, // Send verification token
      type: "passage",
      bookId: selectedPassage._id,
      title: selectedPassage.title || "Reading Passage",
    },
  });
});

/**
 * @desc    Generate a grammar or MCQ quiz from a sentence
 * @route   GET /api/passages/quiz/grammar
 * @access  Private
 */
const generateGrammarQuiz = expressAsyncHandler(async (req, res) => {
  // Grammar Marathon: Focus on Grammar, Tense, MCQ (Sentences or Passages)

  // 1. Randomly decide specific grammar task
  const rand = Math.random();
  let questionType;
  // Types: 'grammar' (POS Selection), 'mcq' (Error Spotting/Replacement)

  if (rand < 0.5) questionType = "grammar";
  else questionType = "mcq";

  // 2. Fetch Content
  const passage = await Passages.aggregate([
    { $match: { type: "sentence" } },
    { $sample: { size: 1 } },
  ]);

  if (!passage || passage.length === 0) {
    res.status(404);
    throw new Error("No content found");
  }

  const selectedPassage = passage[0];

  // Extract text
  const plainText = String(selectedPassage.text || "");

  let result;

  if (questionType === "grammar") {
    result = generateGrammarQuestion(plainText);
  } else {
    // MCQ subtypes
    const subRand = Math.random();
    if (subRand < 0.25) result = generateNegativeQuestion(plainText);
    else if (subRand < 0.5) result = generateTenseQuestion(plainText);
    else if (subRand < 0.75) result = generateGerundQuestion(plainText);
    else result = generatePluralQuestion(plainText);
  }

  // Hash Correct Answers
  const answerHashes = result.answers.map((ans) =>
    crypto.createHash("sha256").update(ans.trim().toLowerCase()).digest("hex"),
  );

  // Payload: Hash for verification, Encrypted for result display using the new util
  const encryptedAnswers = encryptData(result.answers);

  const tokenPayload = {
    type: questionType, // grammar, mcq
    passageId: selectedPassage._id,
    answerHashes: answerHashes,
    encryptedAnswers: encryptedAnswers,
  };

  const token = generateToken(tokenPayload);

  // Remove raw answers from response data
  const safeData = { ...result };
  delete safeData.answers;

  res.status(200).json({
    success: true,
    data: {
      ...safeData,
      token: token,
      type: result.options ? questionType : "grammar",
      bookId: selectedPassage._id,
      title: selectedPassage.title || "Grammar Exercise",
    },
  });
});

const generateBlanksQuestion = (text) => {
  console.log("=== generateBlanksQuestion START ===");
  console.log("Input text length:", text.length);
  console.log("Input text preview:", text.substring(0, 100));

  const doc = nlp(text);
  const answers = [];
  let reconstructedText = "";

  // Identify all terms and their indices
  const allTerms = doc.termList();
  console.log("Total terms found:", allTerms.length);
  console.log(
    "First 10 terms:",
    allTerms.slice(0, 10).map((t) => ({ id: t.id, text: t.text })),
  );

  const termMap = new Map(); // id -> term
  allTerms.forEach((t) => termMap.set(t.id, t));

  // Identify candidates: Adjectives, Nouns, Verbs, Prepositions, Values
  // Exclude the first few words of sentences to preserve context/capitalization flow usually
  const candidates = [];
  const unblankableIndices = new Set();

  doc.sentences().forEach((sentence) => {
    const sentTerms = sentence.termList();
    // Mark first 2 words as unblankable for context
    for (let i = 0; i < Math.min(2, sentTerms.length); i++) {
      unblankableIndices.add(sentTerms[i].id);
    }
  });
  console.log("Unblankable indices count:", unblankableIndices.size);

  // Test each tag individually to see which ones work
  console.log("Testing individual POS tags:");
  const adjMatches = doc.match("#Adjective");
  const nounMatches = doc.match("#Noun");
  const verbMatches = doc.match("#Verb");
  const prepMatches = doc.match("#Preposition");
  const valueMatches = doc.match("#Value");

  console.log(
    "Adjectives:",
    adjMatches.length,
    adjMatches.text().substring(0, 50),
  );
  console.log(
    "Nouns:",
    nounMatches.length,
    nounMatches.text().substring(0, 50),
  );
  console.log(
    "Verbs:",
    verbMatches.length,
    verbMatches.text().substring(0, 50),
  );
  console.log(
    "Prepositions:",
    prepMatches.length,
    prepMatches.text().substring(0, 50),
  );
  console.log(
    "Values:",
    valueMatches.length,
    valueMatches.text().substring(0, 50),
  );

  // Combine matches manually
  const allMatchGroups = [
    adjMatches,
    nounMatches,
    verbMatches,
    prepMatches,
    valueMatches,
  ];

  allMatchGroups.forEach((matchGroup) => {
    matchGroup.forEach((match) => {
      match.termList().forEach((term) => {
        // Filter out very short words or punctuation
        if (!unblankableIndices.has(term.id) && term.text.length > 2) {
          // Avoid duplicates in candidates list
          if (!candidates.some((c) => c.id === term.id)) {
            candidates.push(term);
          }
        }
      });
    });
  });
  console.log("Candidates count:", candidates.length);
  console.log(
    "First 10 candidates:",
    candidates.slice(0, 10).map((c) => ({ id: c.id, text: c.text })),
  );

  const termsToBlank = new Set();

  // --- DYNAMIC BLANK DENSITY LOGIC ---
  const totalWords = allTerms.length;
  let wordToBlankRatio;

  // Adapt density based on passage size:
  // Smaller passages need higher density to be effective.
  // Larger passages need lower density to avoid user fatigue.
  // Slightly reduced density for difficult texts.
  if (totalWords < 50) {
    wordToBlankRatio = 15; // High density (1:15) for short texts
  } else if (totalWords < 150) {
    wordToBlankRatio = 20; // Medium density (1:20)
  } else if (totalWords < 300) {
    wordToBlankRatio = 30; // Lower density (1:30) for longer texts
  } else {
    wordToBlankRatio = 40; // Lowest density (1:40) for very large texts
  }

  const maxBlanksAllowed = Math.floor(totalWords / wordToBlankRatio);
  // Cap at an absolute max (best practice is ~30 tops for difficult texts)
  const absoluteMaxBlanks = 30;
  const clampedMaxBlanksAllowed = Math.min(maxBlanksAllowed, absoluteMaxBlanks);

  console.log(`Total words: ${totalWords}, Ratio: 1:${wordToBlankRatio}`);
  console.log(
    `Calculated max blanks: ${maxBlanksAllowed}, Clamped max: ${clampedMaxBlanksAllowed}`,
  );

  // Base target selection
  // Aim for roughly 20% of valid candidates, but at least 3
  let targetCount = Math.max(3, Math.floor(candidates.length * 0.2));

  // Protect against overwhelming the user with limits
  targetCount = Math.min(targetCount, clampedMaxBlanksAllowed);

  // Clamp target to max available valid candidates
  targetCount = Math.min(targetCount, candidates.length);
  console.log("Final target blanks count:", targetCount);

  // Shuffle candidates
  const shuffled = candidates.sort(() => 0.5 - Math.random());

  // Select winners
  for (let i = 0; i < targetCount; i++) {
    termsToBlank.add(shuffled[i].id);
  }
  console.log("Terms to blank IDs:", Array.from(termsToBlank));

  // Reconstruct
  allTerms.forEach((term) => {
    reconstructedText += term.pre || "";
    if (termsToBlank.has(term.id)) {
      reconstructedText += "[_]";
      answers.push(term.text.trim());
    } else {
      reconstructedText += term.text;
    }
    reconstructedText += term.post || "";
  });

  return {
    text: reconstructedText.trim(),
    answers: answers,
  };
};

const generateGrammarQuestion = (text) => {
  const sentenceText = text;
  const sentenceDoc = nlp(sentenceText);
  const posTypes = ["Verb", "Adjective", "Noun", "Adverb"];
  const availablePos = [];

  posTypes.forEach((pos) => {
    let match;
    if (pos === "Noun") {
      match = sentenceDoc.match("#Noun").not("#Pronoun");
    } else if (pos === "Verb") {
      match = sentenceDoc.match("#Verb").not("#Particle");
    } else {
      match = sentenceDoc.match(`#${pos}`);
    }

    if (match.found) {
      availablePos.push(pos);
    }
  });

  const targetPos =
    availablePos.length > 0
      ? availablePos[Math.floor(Math.random() * availablePos.length)]
      : "Noun";

  let correctTerms;
  if (targetPos === "Noun") {
    correctTerms = sentenceDoc.match("#Noun").not("#Pronoun").termList();
  } else if (targetPos === "Verb") {
    correctTerms = sentenceDoc.match("#Verb").not("#Particle").termList();
  } else {
    correctTerms = sentenceDoc.match(`#${targetPos}`).termList();
  }

  // Clean punctuation from answers so they match frontend expectations
  // e.g. "cat." -> "cat"
  const uniqueAnswers = new Set(
    correctTerms
      .map((t) => t.text.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim())
      .filter((t) => t.length > 0),
  );
  const answers = Array.from(uniqueAnswers);

  return {
    text: sentenceText,
    instruction: `Select ALL the ${targetPos.toLowerCase()}s from this sentence:\n`,
    targetPos: targetPos,
    answers: answers,
  };
};

const generateTenseQuestion = (text) => {
  const sentenceText = text;
  const sDoc = nlp(sentenceText);
  const verbs = sDoc.verbs();
  if (verbs.length === 0) return generateGrammarQuestion(text);

  // Pick a target verb
  const targetVerb = verbs.eq(Math.floor(Math.random() * verbs.length));
  const originalText = targetVerb.text();
  const conjugateArr = targetVerb.conjugate(); // Returns [{ PastTense, PresentTense, ... }]
  const conjugate =
    conjugateArr && conjugateArr.length > 0 ? conjugateArr[0] : {};

  // ONLY collect closely related tense forms, explicitly omitting Gerund/Infinitive
  // which often break the syntactic structure of complex sentences when swapped blindly.
  const validForms = new Set();
  if (conjugate.PastTense) validForms.add(conjugate.PastTense);
  if (conjugate.PresentTense) validForms.add(conjugate.PresentTense);
  if (conjugate.FutureTense) validForms.add(conjugate.FutureTense);
  validForms.add(originalText);

  // Ensure we have enough variants to create distractors
  const variants = Array.from(validForms).filter(
    (v) => v && v !== originalText,
  );

  // If we can't generate enough distractors, fallback
  if (variants.length === 0) return generateGrammarQuestion(text);

  // Decision: Introduce Error or Not?
  const shouldIntroduceError = Math.random() < 0.5;
  let modifiedSentence;
  let correctAnswer;

  let visibleWord;

  if (shouldIntroduceError) {
    // ERROR CASE: Replace correct verb with a wrong form
    let wrongVariant = variants[Math.floor(Math.random() * variants.length)];

    targetVerb.replaceWith(`{{${wrongVariant}}}`);
    modifiedSentence = sDoc.text();

    // The correct answer is the ORIGINAL text (because we broke it)
    correctAnswer = originalText;
    visibleWord = wrongVariant;
  } else {
    // NO ERROR CASE: Keep original
    targetVerb.replaceWith(`{{${originalText}}}`);
    modifiedSentence = sDoc.text();

    // The correct answer is "No error"
    correctAnswer = "No error";
    visibleWord = originalText;
  }

  // Generate Options dynamically
  const options = new Set();
  options.add("No error");

  if (shouldIntroduceError) {
    // If error, the correct fix (original text) MUST be an option
    options.add(originalText);
  }

  // Distractors pool: all valid forms that are NOT the correct answer AND NOT the visible word
  const pool = Array.from(validForms).filter(
    (v) => v !== correctAnswer && v !== visibleWord,
  );

  // Shuffle pool
  const shuffledPool = pool.sort(() => 0.5 - Math.random());

  for (const v of shuffledPool) {
    if (options.size < 4) options.add(v);
  }

  if (options.size < 4) return generateGrammarQuestion(text);

  const optionList = Array.from(options).sort(() => 0.5 - Math.random());

  return {
    text: modifiedSentence,
    instruction:
      "Identify the grammatical error in the highlighted word. Select the correct form to replace it, or 'No error'.",
    options: optionList,
    answers: [correctAnswer],
  };
};

const generateNegativeQuestion = (text) => {
  const originalText = text;
  const phrase = nlp(originalText).clone();
  phrase.sentences().toNegative();
  const negativeText = phrase.text();

  if (negativeText === originalText) return generateGrammarQuestion(text);

  const distractors = new Set();

  // Distractor 1: Original (Positive)
  distractors.add(originalText);

  // Distractor 2: Past Tense Positive
  const pastPhrase = nlp(originalText).clone();
  pastPhrase.sentences().toPastTense();
  if (pastPhrase.text() !== negativeText) distractors.add(pastPhrase.text());

  // Distractor 3: Future Tense Positive
  const futurePhrase = nlp(originalText).clone();
  futurePhrase.sentences().toFutureTense();
  if (futurePhrase.text() !== negativeText)
    distractors.add(futurePhrase.text());

  // --- DYNAMIC OPTIONS REFACTOR ---
  const options = new Set();
  options.add(negativeText); // Correct

  for (const d of distractors) {
    // Only add if it's a valid and unique sentence structure.
    if (options.size < 4) options.add(d);
  }

  if (options.size < 4) return generateGrammarQuestion(text);

  // Array size will be exactly 4 validly constructed sentences.
  const optionList = Array.from(options).sort(() => 0.5 - Math.random());

  return {
    text: "",
    instruction: `Select the correct negative form of the following sentence:\n"${originalText}"`,
    options: optionList,
    answers: [negativeText],
  };
};

const generateGerundQuestion = (text) => {
  const sentenceText = text;
  const sDoc = nlp(sentenceText);

  const verbs = sDoc.verbs();
  if (verbs.length === 0) return generateGrammarQuestion(text);

  const targetVerb = verbs.eq(Math.floor(Math.random() * verbs.length));
  const originalText = targetVerb.text();

  // Determine forms safely without mutating the main document
  const root = nlp(originalText).verbs().toInfinitive().text();
  const gerund = nlp(originalText).verbs().toGerund().text();
  const past = nlp(originalText).verbs().toPastTense().text();
  const present = nlp(originalText).verbs().toPresentTense().text();

  if (!gerund || gerund === root) return generateGrammarQuestion(text);

  const shouldIntroduceError = Math.random() < 0.5;
  let modifiedSentence;
  let correctAnswer;

  const variants = new Set([root, gerund, past, present]);
  // Filter out empty or same
  const validVariants = Array.from(variants).filter(
    (v) => v && v !== originalText,
  );

  if (validVariants.length === 0) return generateGrammarQuestion(text); // Can't make error

  let visibleWord;

  if (shouldIntroduceError) {
    // ERROR: Swap with wrong form
    const wrongForm =
      validVariants[Math.floor(Math.random() * validVariants.length)];
    targetVerb.replaceWith(`{{${wrongForm}}}`);
    modifiedSentence = sDoc.text();
    correctAnswer = originalText;
    visibleWord = wrongForm;
  } else {
    // No Error
    targetVerb.replaceWith(`{{${originalText}}}`);
    modifiedSentence = sDoc.text();
    correctAnswer = "No error";
    visibleWord = originalText;
  }

  const options = new Set();
  options.add("No error");
  if (shouldIntroduceError) options.add(originalText);

  // Add remaining cleanly generated variants, excluding the correct answer AND the visible word
  const shuffledVariants = Array.from(variants).sort(() => 0.5 - Math.random());
  for (const v of shuffledVariants) {
    if (options.size < 4 && v !== correctAnswer && v !== visibleWord)
      options.add(v);
  }

  if (options.size < 4) return generateGrammarQuestion(text);

  const optionList = Array.from(options).sort(() => 0.5 - Math.random());

  return {
    text: modifiedSentence,
    instruction:
      "Identify the grammatical error in the highlighted word. Select the correct form to replace it, or 'No error'.",
    options: optionList,
    answers: [correctAnswer],
  };
};

const generatePluralQuestion = (text) => {
  const sentenceText = text;
  const sDoc = nlp(sentenceText);

  // Pick noun
  const nouns = sDoc.nouns();
  if (nouns.length === 0) return generateGrammarQuestion(text);

  const targetNoun = nouns.eq(Math.floor(Math.random() * nouns.length));
  const originalText = targetNoun.text();

  // Determine forms safely without mutating the main document
  const singular =
    nlp(originalText).nouns().toSingular().text() || originalText;
  const plural = nlp(originalText).nouns().toPlural().text() || originalText;

  if (!singular || !plural || singular === plural)
    return generateGrammarQuestion(text);

  // Is current original singular or plural?
  const isPlural = originalText === plural;

  // We need to create an error scenario or keep it correct.
  const shouldIntroduceError = Math.random() < 0.5;
  let modifiedSentence;
  let correctAnswer;

  let visibleWord;

  if (shouldIntroduceError) {
    // ERROR: Flip the form
    const wrongForm = isPlural ? singular : plural;
    targetNoun.replaceWith(`{{${wrongForm}}}`);
    modifiedSentence = sDoc.text();
    correctAnswer = originalText; // The original correct form
    visibleWord = wrongForm;
  } else {
    // NO ERROR
    targetNoun.replaceWith(`{{${originalText}}}`);
    modifiedSentence = sDoc.text();
    correctAnswer = "No error";
    visibleWord = originalText;
  }

  const options = new Set();
  options.add("No error");
  if (shouldIntroduceError) options.add(originalText);

  // Distractors
  const otherForm = isPlural ? singular : plural;
  if (otherForm !== correctAnswer && otherForm !== visibleWord)
    options.add(otherForm);

  if (options.size < 4) return generateGrammarQuestion(text);

  const optionList = Array.from(options).sort(() => 0.5 - Math.random());

  return {
    text: modifiedSentence,
    instruction:
      "Identify the grammatical error in the highlighted word. Select the correct form to replace it, or 'No error'.",
    options: optionList,
    answers: [correctAnswer],
  };
};

const generateVocabularyQuiz = expressAsyncHandler(async (req, res) => {
  // 1. Fetch 4 random words from local DB
  const words = await Vocabulary.aggregate([{ $sample: { size: 4 } }]);

  if (!words || words.length < 4) {
    res.status(404);
    throw new Error(
      "Not enough words in Vocabulary collection (need at least 4)",
    );
  }

  // 2. Select Target
  const targetIndex = Math.floor(Math.random() * 4);
  const targetItem = words[targetIndex];

  // 3. Prepare Options (Definitions)
  // The user wants: "generate distractors for options by getting difinitions of other random words"
  // So options are definitions.
  const options = words
    .map((item) => item.definition)
    .sort(() => 0.5 - Math.random());

  // For vocabulary, we send the ID directly (no token needed for this specific verification flow)
  // The security model here trusts the client to return the ID, but the verification logic checks against the DB

  // const token = generateToken(tokenPayload); // REMOVED

  res.status(200).json({
    success: true,
    data: {
      text: "",
      instruction: `Select the definition for the word:\n"${targetItem.word}"`,
      // answers: [targetItem.definition], // REMOVE
      // token: token, // REMOVED, sending ID directly
      vocabId: targetItem._id, // DIRECT ID
      options: options,
      type: "mcq", // Vocabulary uses MCQ renderer usually
      title: "Vocabulary Exercise",
    },
  });
});

export default {
  createPassage,
  createBulkSentences,
  getAllPassages,
  getPassageById,
  updatePassage,
  deletePassage,
  generatePassageQuiz,

  generateGrammarQuiz,
  generateVocabularyQuiz,
};

export {
  generateBlanksQuestion,
  generateGrammarQuestion,
  generateTenseQuestion,
  generateNegativeQuestion,
  generateGerundQuestion,
  generatePluralQuestion,
};
