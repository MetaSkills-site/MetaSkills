/**
 * @file arithmetic.js
 * @description Provides arithmetic question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */
import * as math from "mathjs";

import { getRandom, getDivisors, toBase } from "../../utils/math.utils.js";

const arithmeticQuestions = [
  {
    id: "arithmetic-addition-easy",
    name: "Addition (Easy)",
    parents: ["Math", "Arithmetic", "Addition"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    explanation:
      "To solve this, simply add the two numbers together. For example, if the question is 2 + 3, start at 2 and count up 3 times: 3, 4, 5. The answer is 5.",
    generator: {
      question: function () {
        const a = getRandom(100, 0, true);
        const b = getRandom(100, 0, true);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(a + "+" + b) },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => a + b,
    },
  },
  {
    id: "arithmetic-addition-difficult",
    name: "Addition (Difficult)",
    parents: ["Math", "Arithmetic", "Addition"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(100000, 0, false, 2);
        const b = getRandom(100000, 0, false, 2);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(a + "+" + b) },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => math.round(a + b, 2),
    },
  },
  {
    id: "arithmetic-subtraction-easy",
    name: "Subtraction (Easy)",
    parents: ["Math", "Arithmetic", "Subtraction"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(100, 0, true);
        const b = getRandom(100, 0, true);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(a + "-" + b) },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => a - b,
    },
  },
  {
    id: "arithmetic-subtraction-difficult",
    name: "Subtraction (Difficult)",
    parents: ["Math", "Arithmetic", "Subtraction"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(10000, 0, true);
        const b = getRandom(10000, 0, true);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(a + "-" + b) },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => a - b,
    },
  },
  {
    id: "arithmetic-multiplication-easy",
    name: "Multiplication (Easy)",
    parents: ["Math", "Arithmetic", "Multiplication"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(10, 0, true);
        const b = getRandom(10, 0, true);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(a + "\\times" + b) },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => a * b,
    },
  },
  {
    id: "arithmetic-multiplication-medium",
    name: "Multiplication (Medium)",
    parents: ["Math", "Arithmetic", "Multiplication"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(100, 0, true);
        const b = getRandom(100, 0, true);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(a + "\\times" + b) },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => a * b,
    },
  },
  {
    id: "arithmetic-multiplication-difficult",
    name: "Multiplication (Difficult)",
    parents: ["Math", "Arithmetic", "Multiplication"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(100, 0, false, 2);
        const b = getRandom(100, 0, false, 2);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(a + "\\times" + b) },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => math.round(a * b, 2),
    },
  },
  {
    id: "arithmetic-division",
    name: "Division",
    parents: ["Math", "Arithmetic"],
    answerFormat: "set",
    inputConfig: {
      type: "math",
      layout: "row",
      fields: [
        { label: "Quotient", placeholder: "Q", type: "text", layout: "inline" },
        {
          label: "Remainder",
          placeholder: "R",
          type: "text",
          layout: "inline",
        }, // Text allows generic inputs
      ],
    },
    generator: {
      question: function () {
        const x = getRandom(100, 0, true);
        const y = Math.min(
          Math.max(getRandom(10, 0, true), 1),
          Math.max(1, getRandom(x, 0, true)),
        );
        return {
          values: [x, y],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(x + "\\div" + y) },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (x, y) => {
        // y is guaranteed >= 1 by question generator
        return [math.floor(math.divide(x, y)), math.mod(x, y)];
      },
    },
  },
  {
    id: "arithmetic-indices-easy",
    name: "Indices (Easy)",
    parents: ["Math", "Arithmetic", "Indices"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(20, 0, true);
        const b = getRandom(2, 0, true); // Exponent: 0, 1, 2
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: `${a}^{${b}}` },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => math.pow(a, b),
    },
  },
  {
    id: "arithmetic-indices-medium",
    name: "Indices (Medium)",
    parents: ["Math", "Arithmetic", "Indices"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(50, 0, true);
        const b = getRandom(5, 0, true);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: `${a}^{${b}}` },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, b) => math.pow(a, b),
    },
  },
  {
    id: "arithmetic-squareroot-easy",
    name: "Square Root (Easy)",
    parents: ["Math", "Arithmetic", "Square Root"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(10, 0, true);
        return {
          values: [a],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: `\\sqrt{${a}}` },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a) => math.round(math.sqrt(a), 1),
    },
  },
  {
    id: "arithmetic-squareroot-medium",
    name: "Square Root (Medium)",
    parents: ["Math", "Arithmetic", "Square Root"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(100, 0, true);
        return {
          values: [a],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: `\\sqrt{${a}}` },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a) => math.round(math.sqrt(a), 1),
    },
  },
  {
    id: "arithmetic-squareroot-difficult",
    name: "Square Root (Difficult)",
    parents: ["Math", "Arithmetic", "Square Root"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(1000, 0, true);
        return {
          values: [a],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: `\\sqrt{${a}}` },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a) => math.round(math.sqrt(a), 1),
    },
  },
  {
    id: "arithmetic-percentages-type1",
    name: "Percentages (Type 1)",
    parents: ["Math", "Arithmetic", "Percentages"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Answer", placeholder: "Enter number", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const b = getRandom(100, 0, true);
        const a = getRandom(10000, 0, true);
        const type = getRandom(1, 0, true) === 1 ? "increased" : "decreased";
        return {
          values: [a, type, b],
          display: [
            { type: "text", value: "What is " },
            { type: "math", value: String(a) },
            { type: "text", value: ` ${type} by ` },
            { type: "math", value: `${b}\\%` },
            { type: "text", value: "?" },
          ],
        };
      },
      answer: (a, type, b) => {
        const factor = b / 100;
        const result =
          type === "increased" ? a * (1 + factor) : a * (1 - factor);
        return math.round(result, 2);
      },
    },
  },
  {
    id: "arithmetic-percentages-type2",
    name: "Percentages (Type 2)",
    parents: ["Math", "Arithmetic", "Percentages"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Change", placeholder: "Enter percentage", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const a = getRandom(1000, 1, true); // Ensure start value > 0
        const b = getRandom(1000, 1, true);
        return {
          values: [a, b],
          display: [
            { type: "text", value: "Find the percentage change from " },
            { type: "math", value: String(a) },
            { type: "text", value: " to " },
            { type: "math", value: String(b) },
            { type: "text", value: "." },
          ],
        };
      },
      answer: (a, b) => math.round(((b - a) / a) * 100),
    },
  },
  {
    id: "arithmetic-factors-multistep",
    type: "multi-step",
    name: "Factors (Step-by-Step)",
    parents: ["Math", "Arithmetic", "Factors"],
    // Placeholder for initial display in lists, actual question comes from generator step 0
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [{ label: "Count", placeholder: "Enter number", type: "number" }],
    },
    generator: {
      question: function (cachedContext) {
        let num, divisors;

        if (cachedContext) {
          num = cachedContext.num;
          divisors = cachedContext.divisors;
        } else {
          num = getRandom(50, 4, true); // Slightly smaller range to keep list manageable
          divisors = getDivisors(num);
        }

        return {
          context: { num, divisors }, // Shared state across steps
          steps: [
            {
              description: "Hint: Count the total number of divisors.",
              // question: "List the divisors of {{}} (hint: count total)",
              display: [
                { type: "text", value: "List the divisors of " },
                { type: "math", value: String(num) },
              ],
              numbers: [num],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  {
                    label: "Count",
                    placeholder: "Enter number",
                    type: "number",
                  },
                ],
              },
              answer: (ctx) => ctx.divisors.length,
            },
            {
              // question: "List them all",
              display: [{ type: "text", value: "List them all" }],
              numbers: [],
              answerFormat: "set", // Order doesn't matter, but all must be present
              // Dynamic inputConfig: Create one input per divisor
              inputConfig: {
                type: "math",
                layout: "grid",
                fields: Array.from({ length: divisors.length }, () => ({
                  label: "",
                  placeholder: "#",
                  type: "number",
                })),
              },
              answer: (ctx) => ctx.divisors.join(","), // "set" format expects comma-separated string or array
            },
          ],
        };
      },
    },
  },
  {
    id: "arithmetic-factors",
    name: "Factors",
    parents: ["Math", "Arithmetic"],
    answerFormat: "sequence", // Enforces ordered list
    description: "Enter as a comma-separated list (e.g. 1, 2, 4)",
    inputConfig: {
      type: "math",
      fields: [{ label: "Divisors", placeholder: "e.g. 1, 2, 4" }],
    },
    generator: {
      question: function () {
        const num = getRandom(100, 1, true);
        return {
          values: [num],
          display: [
            { type: "text", value: "List the divisors of " },
            { type: "math", value: String(num) },
          ],
        };
      },
      answer: (num) => {
        return getDivisors(num).join(",");
      },
    },
  },
  {
    id: "arithmetic-number-system",
    name: "Number System Conversion",
    parents: ["Math", "Arithmetic"],
    answerFormat: "string",
    inputConfig: {
      type: "math",
      fields: [{ label: "Result", placeholder: "Enter value" }],
    },
    generator: {
      question: function () {
        const num = getRandom(100, 5, true);
        const base = getRandom(9, 2, true); // Bases 2-9
        return {
          values: [num, base],
          display: [
            { type: "text", value: "Convert " },
            { type: "math", value: String(num) },
            { type: "text", value: " to base " },
            { type: "math", value: String(base) },
          ],
        };
      },
      answer: (num, base) => {
        return toBase(num, base);
      },
    },
  },
];

export default arithmeticQuestions;
