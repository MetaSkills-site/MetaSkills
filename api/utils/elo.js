/**
 * @file elo.js
 * @description Implements Elo rating system calculations and database updates for users, questions, vocab, and passages.
 * @architecture Acts as the core rating logic for the application's adaptive learning mechanisms.
 */
import User from "../models/user.model.js";
import Question from "../models/Questions.model.js";
import Vocabulary from "../models/Vocabulary.model.js";
import Passages from "../models/Passages.model.js";

/**
 * @desc    Calculates the expected score for entity A against entity B.
 * @param   {number} ratingA - Current rating of entity A
 * @param   {number} ratingB - Current rating of entity B
 * @returns {number} Expected score for entity A (between 0 and 1)
 */
export function calculateExpectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * @desc    Calculates the new rating for an entity.
 * @param   {number} currentRating - The entity's current rating
 * @param   {number} K - The volatility factor (K-factor)
 * @param   {number} actualScore - The actual score achieved (0 to 1)
 * @param   {number} expectedScore - The expected score (0 to 1)
 * @returns {number} The new rating
 */
export function calculateNewRating(
  currentRating,
  K,
  actualScore,
  expectedScore,
) {
  return currentRating + K * (actualScore - expectedScore);
}

/**
 * @desc    Converts a raw Elo rating to a human-friendly 0-100 difficulty score
 * using a sigmoid transformation centered around 1200.
 * @param   {number} eloRating - The raw Elo rating (e.g., 1200, 1600)
 * @returns {number} A score from 0 to 100
 */
export function getDisplayDifficulty(eloRating) {
  const x = (eloRating - 1200) / 400;
  const sigmoid = 1 / (1 + Math.exp(-x));
  return Math.round(sigmoid * 100);
}

/**
 * @desc    Main orchestrator: Computes new ratings and updates the database.
 * Designed to be fire-and-forget (does not block on DB errors).
 * @param   {string} userId - The ID of the user who answered
 * @param   {string} questionId - The ID of the question answered
 * @param   {number} actualScore - The user's score (1 for correct, 0 for incorrect, fractional for partial)
 * @returns {Promise<{ newUserRating: number, newQuestionRating: number, displayDifficulty: number } | null>}
 */
export async function updateEloRatings(userId, questionId, actualScore) {
  const K = 32;

  try {
    // Fetch both user and question (in parallel)
    const [user, question] = await Promise.all([
      User.findById(userId).select("rating"),
      Question.findById(questionId).select("rating"),
    ]);

    if (!user || !question) {
      console.warn(
        `[Elo] Could not find user (${userId}) or question (${questionId})`,
      );
      return null;
    }

    const userRating = user.rating ?? 1200;
    const questionRating = question.rating ?? 1200;

    const expectedUser = calculateExpectedScore(userRating, questionRating);
    const expectedQuestion = 1 - expectedUser;

    const actualQuestion = 1 - actualScore;

    const newUserRating = calculateNewRating(
      userRating,
      K,
      actualScore,
      expectedUser,
    );
    const newQuestionRating = calculateNewRating(
      questionRating,
      K,
      actualQuestion,
      expectedQuestion,
    );

    // Update DB in parallel
    await Promise.all([
      User.findByIdAndUpdate(userId, { rating: newUserRating }),
      Question.findByIdAndUpdate(questionId, { rating: newQuestionRating }),
    ]);

    return {
      newUserRating,
      newQuestionRating,
      displayDifficulty: getDisplayDifficulty(newQuestionRating),
    };
  } catch (error) {
    console.error("[Elo] Failed to update Elo ratings:", error);
    // Suppress error to avoid blocking the main quiz flow
    return null;
  }
}

/**
 * @desc    Computes new ratings and updates the database specifically for Vocabulary SRS.
 * Uses `vocabRating` on User instead of `rating`.
 * @param   {string} userId - The ID of the user who answered
 * @param   {string} wordId - The ID of the vocabulary word answered
 * @param   {number} actualScore - The user's score (1 for correct, 0 for incorrect)
 * @returns {Promise<{ newUserRating: number, newWordRating: number, displayDifficulty: number } | null>}
 */
export async function updateVocabEloRatings(userId, wordId, actualScore) {
  const K = 32;

  try {
    // Fetch both user and vocab word (in parallel)
    const [user, word] = await Promise.all([
      User.findById(userId).select("vocabRating"),
      Vocabulary.findById(wordId).select("rating"),
    ]);

    if (!user || !word) {
      console.warn(
        `[Elo] Could not find user (${userId}) or word (${wordId}) for vocab update`,
      );
      return null;
    }

    const userRating = user.vocabRating ?? 1200;
    const wordRating = word.rating ?? 1200;

    const expectedUser = calculateExpectedScore(userRating, wordRating);
    const expectedWord = 1 - expectedUser;

    const actualWord = 1 - actualScore;

    const newUserRating = calculateNewRating(
      userRating,
      K,
      actualScore,
      expectedUser,
    );
    const newWordRating = calculateNewRating(
      wordRating,
      K,
      actualWord,
      expectedWord,
    );

    // Update DB in parallel
    await Promise.all([
      User.findByIdAndUpdate(userId, { vocabRating: newUserRating }),
      Vocabulary.findByIdAndUpdate(wordId, { rating: newWordRating }),
    ]);

    return {
      newUserRating,
      newWordRating,
      displayDifficulty: getDisplayDifficulty(newWordRating),
    };
  } catch (error) {
    console.error("[Elo] Failed to update Vocab Elo ratings:", error);
    // Suppress error to avoid blocking the main quiz flow
    return null;
  }
}

/**
 * @desc    Computes new ratings and updates the database specifically for Passages/Sentences.
 * Uses standard `rating` on User and Passages.
 * @param   {string} userId - The ID of the user who answered
 * @param   {string} passageId - The ID of the passage answered
 * @param   {number} actualScore - The user's score (1 for correct, 0 for incorrect, fractional for partial)
 * @returns {Promise<{ newUserRating: number, newPassageRating: number, displayDifficulty: number } | null>}
 */
export async function updatePassageEloRatings(userId, passageId, actualScore) {
  const K = 32;

  try {
    // Fetch both user and passage (in parallel)
    const [user, passage] = await Promise.all([
      User.findById(userId).select("rating"),
      Passages.findById(passageId).select("rating"),
    ]);

    if (!user || !passage) {
      console.warn(
        `[Elo] Could not find user (${userId}) or passage (${passageId}) for update`,
      );
      return null;
    }

    const userRating = user.rating ?? 1200;
    const passageRating = passage.rating ?? 1200;

    const expectedUser = calculateExpectedScore(userRating, passageRating);
    const expectedPassage = 1 - expectedUser;

    const actualPassage = 1 - actualScore;

    const newUserRating = calculateNewRating(
      userRating,
      K,
      actualScore,
      expectedUser,
    );
    const newPassageRating = calculateNewRating(
      passageRating,
      K,
      actualPassage,
      expectedPassage,
    );

    // Update DB in parallel
    await Promise.all([
      User.findByIdAndUpdate(userId, { rating: newUserRating }),
      Passages.findByIdAndUpdate(passageId, { rating: newPassageRating }),
    ]);

    return {
      newUserRating,
      newPassageRating,
      displayDifficulty: getDisplayDifficulty(newPassageRating),
    };
  } catch (error) {
    console.error("[Elo] Failed to update Passage Elo ratings:", error);
    // Suppress error to avoid blocking the main quiz flow
    return null;
  }
}
