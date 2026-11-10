import { getAllQuestions } from "./math-questions/registry.js";

/**
 * @file MathQuestions.js
 * @description Proxy module that exports the unified list of questions from the new registry.
 * This file remains to provide backward compatibility for math.service.js.
 */
export default getAllQuestions();
