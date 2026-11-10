/**
 * @file logarithms.js
 * @description Provides logarithms question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */
import * as math from "mathjs";

import {
  getRandom,
  toFractionString,
  getRandomPrime,
} from "../../utils/math.utils.js";

const logarithmsQuestions = [
  {
    id: "logarithms-level1",
    name: "Logarithms Level 1",
    parents: ["Math", "Logarithms", "Level 1"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [{ label: "Answer", placeholder: "Enter value", type: "number" }],
    },
    generator: {
      question: function () {
        const base = getRandom(10, 2, true);
        const ex = getRandom(5, 1, true); // Keep exponents positive for valid log arguments
        const num = Math.pow(base, ex);
        return {
          values: [base, num],
          display: [
            { type: "text", value: "Evaluate " },
            { type: "math", value: `\\log_{${base}}(${num})` },
          ],
        };
      },
      answer: (base, num) => {
        if (num <= 0) return 0;
        return math.round(math.log(num, base), 2);
      },
    },
  },
  {
    id: "logarithms-level2",
    name: "Logarithms Level 2",
    parents: ["Math", "Logarithms", "Level 2"],
    answerFormat: "string", // Supports fractional answers
    inputConfig: {
      type: "math",
      fields: [{ label: "Answer", placeholder: "e.g. 1/2 or 0.5" }],
    },
    generator: {
      question: function () {
        const base = getRandomPrime(10, 2);
        const a = getRandom(10, 1, true);
        const b = getRandom(5, 1, true);
        // Problem: log_{base^b} (base^a) = a/b
        const qbase = Math.pow(base, b);
        const num = Math.pow(base, a);
        return {
          values: [qbase, num, a, b],
          display: [
            { type: "text", value: "Evaluate " },
            { type: "math", value: `\\log_{${qbase}}(${num})` },
          ],
        };
      },
      answer: (qbase, num, a, b) => {
        return toFractionString(a, b);
      },
    },
  },
];

export default logarithmsQuestions;
