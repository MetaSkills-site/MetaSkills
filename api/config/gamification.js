/**
 * @file gamification.js
 * @description Defines point values for gamification awards.
 * @architecture Provides a centralized configuration for gamification rewards used throughout the application.
 */

/**
 * @constant {Object} GAMIFICATION
 * @description Maps gamification actions to their respective point awards.
 */
export const GAMIFICATION = {
  STD_QUESTION_AWARD: 5,
  MODULE_COMPLETION_AWARD: 50,
  MARATHON_AWARD: 1, // default fallback
  SUM_CORRECT: 2, // Math sum
  GRAMMAR_MARATHON_AWARD: 5,
  VOCABULARY_MARATHON_AWARD: 2,
  HISTORY_MARATHON_AWARD: 50,
};
