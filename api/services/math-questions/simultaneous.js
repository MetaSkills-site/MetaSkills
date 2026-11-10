/**
 * @file simultaneous.js
 * @description Provides simultaneous equations question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */

import { getRandom } from "../../utils/math.utils.js";

const simultaneousQuestions = [
  {
    id: "simultaneous-equations-linear",
    type: "multi-step",
    name: "Simultaneous Equations (Linear)",
    parents: ["Math", "Simultaneous Equations"],
    answerFormat: "sequence",
    description: "Solve the system of equations step-by-step",
    inputConfig: {
      type: "math",
      layout: "row",
      fields: [
        { label: "x", placeholder: "Value x" },
        { label: "y", placeholder: "Value y" },
      ],
    },
    generator: {
      question: function (cachedContext) {
        let x, y, a, b, c, d, eq1, eq2;

        if (cachedContext) {
          ({ x, y, a, b, c, d, eq1, eq2 } = cachedContext);
        } else {
          x = getRandom(10, 0, true);
          y = getRandom(10, 0, true);
          a = getRandom(10, 1, true);
          b = getRandom(10, 1, true);
          c = getRandom(10, 1, true);
          d = getRandom(10, 1, true);

          // Construct system based on random solution (x, y)
          eq1 = a * x + b * y;
          eq2 = c * x - d * y;
        }

        // Step 1: Express x from eq2: cx - dy = eq2 => cx = dy + eq2 => x = (d/c)y + (eq2/c)
        // To keep it simple for checking, let's ask for y first by elimination or substitution generally.
        // Plan said: 1. Express x, 2. Find y, 3. Find x.
        // Let's make Step 1: "Find y".
        // Step 2: "Find x".
        // 2 steps is cleaner and less ambiguous than checking algebraic expression for "x = ...".

        return {
          context: { x, y, a, b, c, d, eq1, eq2 },
          steps: [
            {
              // question: "Find y for the system:\n{{}}x + {{}}y = {{}}\n{{}}x - {{}}y = {{}}",
              display: [
                { type: "text", value: "Find y for the system:" },
                {
                  type: "math",
                  value: `\\begin{cases} ${a}x + ${b}y = ${eq1} \\\\ ${c}x - ${d}y = ${eq2} \\end{cases}`,
                },
              ],
              numbers: [a, b, eq1, c, d, eq2],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  { label: "y", placeholder: "Enter y", type: "number" },
                ],
              },
              answer: (ctx) => ctx.y,
            },
            {
              // question: "Now, find x",
              display: [{ type: "text", value: "Now, find x" }],
              numbers: [],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  { label: "x", placeholder: "Enter x", type: "number" },
                ],
              },
              answer: (ctx) => ctx.x,
            },
          ],
        };
      },
    },
  },
];

export default simultaneousQuestions;
