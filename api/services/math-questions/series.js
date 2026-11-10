/**
 * @file series.js
 * @description Provides series question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */
import * as math from "mathjs";

import { getRandom } from "../../utils/math.utils.js";

const seriesQuestions = [
  {
    id: "series-arithmetic-progression",
    name: "Arithmetic Progression",
    parents: ["Math", "Series"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [{ label: "Term", placeholder: "Enter value", type: "number" }],
    },
    generator: {
      question: function () {
        const start = getRandom(20, -10, true);
        const diff = getRandom(10, -10, true);
        const n = getRandom(20, 5, true); // n-th term to find

        // Generate sequence string "a, a+d, a+2d..."
        const terms = [];
        for (let i = 0; i < 4; i++) terms.push(start + i * diff);
        const apStr = terms.join(", ") + ", ...";

        return {
          values: [n, apStr, start, diff],
          display: [
            { type: "text", value: "Find the " },
            { type: "math", value: String(n) },
            { type: "text", value: "-th term of the AP: " },
            { type: "math", value: apStr },
          ],
        };
      },
      answer: (n, apStr, start, diff) => {
        // Formula: T_n = a + (n-1)d
        return start + (n - 1) * diff;
      },
    },
  },
  {
    id: "series-geometric-progression",
    name: "Geometric Progression",
    parents: ["Math", "Series"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [{ label: "Sum", placeholder: "Enter value", type: "number" }],
    },
    generator: {
      question: function () {
        const start = getRandom(10, 1, true);
        const ratio = getRandom(4, 2, true);
        const n = getRandom(6, 3, true);

        const terms = [];
        for (let i = 0; i < 3; i++) terms.push(start * Math.pow(ratio, i));
        const gpStr = terms.join(", ") + ", ...";

        return {
          values: [n, gpStr, start, ratio],
          display: [
            { type: "text", value: "Find the sum of the first " },
            { type: "math", value: String(n) },
            { type: "text", value: " terms of GP: " },
            { type: "math", value: gpStr },
          ],
        };
      },
      answer: (n, gpStr, start, ratio) => {
        if (ratio === 1) return start * n;
        // Sum Formula: S_n = a(r^n - 1) / (r - 1)
        return math.round((start * (math.pow(ratio, n) - 1)) / (ratio - 1));
      },
    },
  },
];

export default seriesQuestions;
