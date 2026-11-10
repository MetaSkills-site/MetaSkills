/**
 * @file fractions.js
 * @description Provides fractions question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */

import algebrite from "algebrite";

import { getRandomPrime } from "../../utils/math.utils.js";

const fractionsQuestions = [
  {
    id: "fractions-addition",
    name: "Fractions Addition",
    parents: ["Math", "Fractions", "Addition"],
    answerFormat: "string", // Expect "n/d" or "n"
    inputConfig: {
      type: "math",
      fields: [{ label: "Result", placeholder: "e.g. 3/4" }],
    },
    generator: {
      question: function () {
        const w = getRandomPrime(20, 2);
        const x = getRandomPrime(20, 2);
        const y = getRandomPrime(10, 2);
        const z = getRandomPrime(10, 2);
        return {
          values: [x, y, w, z],
          display: [
            { type: "text", value: "Calculate " },
            { type: "math", value: `\\frac{${x}}{${y}}` },
            { type: "text", value: " + " },
            { type: "math", value: `\\frac{${w}}{${z}}` },
          ],
        };
      },
      answer: (x, y, w, z) => {
        // Use Algebrite for exact fractional arithmetic
        return algebrite.run(`${x}/${y} + ${w}/${z}`).toString();
      },
    },
  },
  {
    id: "fractions-subtraction",
    name: "Fractions Subtraction",
    parents: ["Math", "Fractions", "Subtraction"],
    answerFormat: "string",
    inputConfig: {
      type: "math",
      fields: [{ label: "Result", placeholder: "e.g. 3/4" }],
    },
    generator: {
      question: function () {
        const w = getRandomPrime(20, 2);
        const x = getRandomPrime(20, 2);
        const y = getRandomPrime(10, 2);
        const z = getRandomPrime(10, 2);
        return {
          values: [x, y, w, z],
          display: [
            { type: "text", value: "Calculate " },
            { type: "math", value: `\\frac{${x}}{${y}}` },
            { type: "text", value: " - " },
            { type: "math", value: `\\frac{${w}}{${z}}` },
          ],
        };
      },
      answer: (x, y, w, z) => {
        // Use Algebrite for exact fractional arithmetic
        return algebrite.run(`${x}/${y} - ${w}/${z}`).toString();
      },
    },
  },
  {
    id: "fractions-multiplication",
    name: "Fractions Multiplication",
    parents: ["Math", "Fractions", "Multiplication"],
    answerFormat: "string",
    inputConfig: {
      type: "math",
      fields: [{ label: "Result", placeholder: "e.g. 3/4" }],
    },
    generator: {
      question: function () {
        const x = getRandomPrime(50, 2);
        const y = getRandomPrime(20, 2);
        const z = getRandomPrime(100, 2);
        return {
          values: [x, y, z],
          display: [
            { type: "text", value: "Calculate " },
            { type: "math", value: `\\frac{${x}}{${y}}` },
            { type: "math", value: " \\times " },
            { type: "math", value: String(z) },
          ],
        };
      },
      answer: (x, y, z) => {
        // Use Algebrite for exact fractional arithmetic
        return algebrite.run(`${x}/${y} * ${z}`).toString();
      },
    },
  },
];

export default fractionsQuestions;
