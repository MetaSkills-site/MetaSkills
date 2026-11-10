/**
 * @file trigonometry.js
 * @description Provides trigonometry question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */
import * as math from "mathjs";

import { getRandom } from "../../utils/math.utils.js";

const trigonometryQuestions = [
  {
    id: "trigonometry-approximations",
    name: "Trigonometric Approximations",
    parents: ["Math", "Trigonometry", "Approximations"],
    answerFormat: "number",
    description: "Round to 2 decimal places",
    inputConfig: {
      type: "math",
      fields: [{ label: "Value", placeholder: "Enter value", type: "number" }],
    },
    generator: {
      question: function () {
        const deg = getRandom(360, 0, true);
        return {
          values: [deg],
          display: [
            { type: "text", value: "Approximate " },
            { type: "math", value: `\\sin(${deg}^\\circ)` },
          ],
        };
      },
      answer: (deg) => math.round(math.sin(math.unit(deg, "deg")), 2),
    },
  },
  {
    id: "trigonometry-solutions-simple",
    name: "Trigonometric Solutions (Simple)",
    parents: ["Math", "Trigonometry", "Solutions"],
    answerFormat: "sequence", // Multiple solutions
    inputConfig: {
      type: "math",
      fields: [{ label: "Solutions", placeholder: "e.g. 30, 150" }],
    },
    generator: {
      question: function () {
        // Use standard angles to ensure nice decimal values
        const standardAngles = [
          0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315,
          330, 360,
        ];
        const angle =
          standardAngles[getRandom(standardAngles.length - 1, 0, true)];
        const val = math.sin(math.unit(angle, "deg"));

        return {
          values: [math.round(val, 3), angle],
          display: [
            { type: "text", value: "Find x in " },
            { type: "math", value: "[0, 360^\\circ]" },
            { type: "text", value: " where " },
            { type: "math", value: `\\sin(x) = ${math.round(val, 3)}` },
          ],
        };
      },
      answer: (val, angle) => {
        const sol1 = angle % 360;
        let sol2 = (180 - angle) % 360;
        if (sol2 < 0) sol2 += 360;

        const solutions = new Set([sol1, sol2]);
        return Array.from(solutions)
          .sort((a, b) => a - b)
          .join(",");
      },
    },
  },
  {
    id: "trigonometry-ratios",
    name: "Trigonometric Ratios",
    parents: ["Math", "Trigonometry", "Ratios"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [{ label: "Answer", placeholder: "Enter value", type: "number" }],
    },
    generator: {
      question: function () {
        const funcs = ["sin", "cos", "tan", "csc", "sec", "cot"];
        const degs = [0, 30, 45, 60, 90, 120, 135, 150, 180, 270, 360];
        let func, deg;
        do {
          func = math.pickRandom(funcs);
          deg = math.pickRandom(degs);
        } while (
          ((func === "tan" || func === "sec") && (deg === 90 || deg === 270)) ||
          ((func === "csc" || func === "cot") &&
            (deg === 0 || deg === 180 || deg === 360))
        );
        return {
          values: [func, deg],
          display: [
            { type: "text", value: "Evaluate " },
            { type: "math", value: `${func}(${deg}^\\circ)` },
          ],
        };
      },
      answer: (func, angle) => {
        try {
          const res = math.evaluate(`${func}(${angle} deg)`);
          if (!math.isFinite(res)) return "Undefined";
          return math.round(res, 4);
        } catch {
          return "Undefined";
        }
      },
    },
  },
];

export default trigonometryQuestions;
