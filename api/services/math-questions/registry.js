/**
 * @file registry.js
 * @description Aggregates all math question definitions and provides lookup functions.
 * @architecture Acts as the single source of truth for all math questions used in the application.
 */
import arithmeticQuestions from "./arithmetic.js";
import algebraQuestions from "./algebra.js";
import fractionsQuestions from "./fractions.js";
import geometryQuestions from "./geometry.js";
import statisticsQuestions from "./statistics.js";
import logarithmsQuestions from "./logarithms.js";
import simultaneousQuestions from "./simultaneous.js";
import combinatoricsQuestions from "./combinatorics.js";
import seriesQuestions from "./series.js";
import trigonometryQuestions from "./trigonometry.js";

const allQuestions = [
  ...arithmeticQuestions,
  ...algebraQuestions,
  ...fractionsQuestions,
  ...geometryQuestions,
  ...statisticsQuestions,
  ...logarithmsQuestions,
  ...simultaneousQuestions,
  ...combinatoricsQuestions,
  ...seriesQuestions,
  ...trigonometryQuestions,
];

// Ensure all IDs are unique at startup
const idMap = new Map();
allQuestions.forEach((q) => {
  if (idMap.has(q.id)) {
    throw new Error(`Duplicate MathQuestion ID detected: ${q.id}`);
  }
  idMap.set(q.id, q);
});

export const getAllQuestions = () => {
  return allQuestions;
};

export const getQuestionById = (id) => {
  return idMap.get(id);
};
