/**
 * @file combinatorics.js
 * @description Provides combinatorics question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */
import * as math from "mathjs";

import { getRandom } from "../../utils/math.utils.js";

const combinatoricsQuestions = [
  {
    id: "pnc-factorials",
    name: "Factorials",
    parents: ["Math", "Permutations & Combinations"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Factorial", placeholder: "Enter value", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const n = getRandom(10, 0, true);
        return {
          values: [n],
          display: [
            { type: "text", value: "Calculate " },
            { type: "math", value: `${n}!` },
          ],
        };
      },
      answer: (n) => math.factorial(n),
    },
  },
  {
    id: "pnc-permutations",
    name: "Permutations",
    parents: ["Math", "Permutations & Combinations"],
    question: "Calculate P({{}}, {{}})", // P(n, r)
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Permutations", placeholder: "Enter value", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const n = getRandom(10, 1, true);
        const r = getRandom(n, 0, true);
        return {
          values: [n, r],
          display: [
            { type: "text", value: "Calculate " },
            { type: "math", value: `P(${n}, ${r})` },
          ],
        };
      },
      answer: (n, r) => math.permutations(n, r),
    },
  },
  {
    id: "pnc-combinations",
    name: "Combinations",
    parents: ["Math", "Permutations & Combinations"],
    question: "Calculate C({{}}, {{}})", // C(n, r)
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Combinations", placeholder: "Enter value", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const n = getRandom(10, 1, true);
        const r = getRandom(n, 0, true);
        return {
          values: [n, r],
          display: [
            { type: "text", value: "Calculate " },
            { type: "math", value: `C(${n}, ${r})` },
          ],
        };
      },
      answer: (n, r) => math.combinations(n, r),
    },
  },
];

export default combinatoricsQuestions;
