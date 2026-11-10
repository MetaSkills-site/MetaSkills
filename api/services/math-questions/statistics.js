/**
 * @file statistics.js
 * @description Provides statistics question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */
import * as math from "mathjs";

import { getRandom } from "../../utils/math.utils.js";

const statisticsQuestions = [
  {
    id: "statistics-binomial",
    type: "multi-step",
    name: "Binomial Distribution",
    parents: ["Math", "Statistics"],
    answerFormat: "number",
    description: "Solve step-by-step",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Probability", placeholder: "Enter value", type: "number" },
      ],
    },
    generator: {
      question: function (cachedContext) {
        let x, y, z;
        if (cachedContext) {
          ({ x, y, z } = cachedContext);
        } else {
          x = getRandom(10, 1, true); // Total tosses
          y = getRandom(89, 11, true); // Probability %
          z = getRandom(x, 0, true); // Target heads
        }

        const nCr = math.combinations(x, z);
        const p = y / 100;
        // Binomial Probability Formula: P(X=k) = nCk * p^k * (1-p)^(n-k)
        const prob = nCr * math.pow(p, z) * math.pow(1 - p, x - z);
        const finalProb = math.round(prob, 4);

        return {
          context: { x, y, z, nCr, finalProb },
          steps: [
            {
              // question: "Number of ways to choose {{}} heads from {{}} tosses (combinations)",
              display: [
                { type: "text", value: "Number of ways to choose " },
                { type: "math", value: String(z) },
                { type: "text", value: " heads from " },
                { type: "math", value: String(x) },
                { type: "text", value: " tosses (combinations)" },
              ],
              numbers: [z, x],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [{ label: "ways", placeholder: "nCr", type: "number" }],
              },
              answer: (ctx) => ctx.nCr,
            },
            {
              // question: "Calculate the probability",
              display: [{ type: "text", value: "Calculate the probability" }],
              numbers: [],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  {
                    label: "Probability",
                    placeholder: "Enter value",
                    type: "number",
                  },
                ],
              },
              answer: (ctx) => ctx.finalProb,
            },
          ],
        };
      },
    },
  },
];

export default statisticsQuestions;
