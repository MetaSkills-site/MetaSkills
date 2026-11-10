/**
 * @file algebra.js
 * @description Provides algebra question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */
import * as math from "mathjs";

import algebrite from "algebrite";

import {
  getRandom,
  formatAlgebraicExpression,
} from "../../utils/math.utils.js";

const algebraQuestions = [
  {
    id: "algebra-quadratic",
    type: "multi-step",
    name: "Quadratic Equations",
    parents: ["Math", "Algebra"],
    answerFormat: "set",
    description: "Solve step-by-step",
    inputConfig: {
      type: "math",
      layout: "row",
      fields: [
        { label: "x₁", placeholder: "Root 1" },
        { label: "x₂", placeholder: "Root 2" },
      ],
    },
    generator: {
      question: function (cachedContext) {
        let r1, r2;
        if (cachedContext) {
          r1 = cachedContext.r1;
          r2 = cachedContext.r2;
        } else {
          r1 = getRandom(10, 1, true);
          r2 = getRandom(10, 1, true);
        }

        const a = 1; // Simplify to a=1 for now
        const b = -(r1 + r2);
        const c = r1 * r2;

        const expr = formatAlgebraicExpression(`x^2 + ${b}*x + ${c}`);
        const discriminant = b * b - 4 * a * c;

        // Algebrite might return valid symbolic roots if cleaner than decimals.
        // But for this level we likely want standard numbers or simple surds.
        // The current implementation generated integer roots r1, r2.
        // So [r1, r2] is safe.

        const roots = [r1, r2].sort((a, b) => a - b).join(",");

        return {
          context: { r1, r2, a, b, c, discriminant, roots },
          steps: [
            {
              // question: "Find the discriminant (Δ) for {{}} = 0",
              display: [
                { type: "text", value: "Find the discriminant (Δ) for " },
                { type: "math", value: `${expr} = 0` },
              ],
              numbers: [expr],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  {
                    label: "Discriminant",
                    placeholder: "b² - 4ac",
                    type: "number",
                  },
                ],
              },
              answer: (ctx) => ctx.discriminant,
            },
            {
              // question: "Find the roots for {{}} = 0",
              display: [
                { type: "text", value: "Find the roots for " },
                { type: "math", value: `${expr} = 0` },
              ],
              numbers: [expr],
              answerFormat: "set",
              inputConfig: {
                type: "math",
                layout: "row",
                fields: [
                  { label: "x₁", placeholder: "Root 1" },
                  { label: "x₂", placeholder: "Root 2" },
                ],
              },
              answer: (ctx) => {
                // Roots: check set equal. Algebrite roots might be symbolic.
                // ctx.roots is already calculated.
                return ctx.roots;
              },
            },
          ],
        };
      },
    },
  },
  {
    id: "algebra-cubic-factorisation",
    name: "Cubic Factorisation",
    parents: ["Math", "Algebra"],
    answerFormat: "string", // Algebraic expression checked via Algebrite + Structure
    description: "Enter the coefficients for factors (ax+b)(cx+d)(ex+f)",
    inputConfig: {
      type: "math",
      fields: [{ label: "Answer", placeholder: "e.g. (ax+b)(cx+d)(ex+f)" }],
    },
    generator: {
      question: function () {
        // Generate 3 linear factors (a1x+b1), (a2x+b2), (a3x+b3)
        // Simplify: a coefficients usually 1 or small prime to keep math doable
        const a1 = getRandom(3, 1, true);
        const a2 = getRandom(3, 1, true);
        const a3 = getRandom(3, 1, true);
        let b1;
        do {
          b1 = getRandom(5, -5, true);
        } while (b1 === 0);
        let b2;
        do {
          b2 = getRandom(5, -5, true);
        } while (b2 === 0);
        let b3;
        do {
          b3 = getRandom(5, -5, true);
        } while (b3 === 0);

        // Construct expression: (a1x + b1)(a2x + b2)(a3x + b3)
        // We construct the string for Algebrite to expand
        const expr = `(${a1}x + (${b1})) * (${a2}x + (${b2})) * (${a3}x + (${b3}))`;

        // 1. Expand using Algebrite to get simplified polynomial string (e.g., "x^3 + ...")
        const expandedAscii = algebrite.run(`expand(${expr})`).toString();

        // 2. Convert to LaTeX for nice rendering (e.g., "x^{3} + ...")
        // We use mathjs to parse the ASCII and export to TeX
        let latexExpr;
        try {
          latexExpr = math.parse(expandedAscii).toTex();
        } catch (e) {
          console.error("LaTeX conversion failed, falling back to ASCII", e);
          latexExpr = expandedAscii;
        }

        return {
          values: [latexExpr, a1, b1, a2, b2, a3, b3],
          display: [
            { type: "text", value: "Factorise: " },
            { type: "math", value: latexExpr },
          ],
        };
      },
      answer: (latexExpr, a1, b1, a2, b2, a3, b3) => {
        // Return full factorised string for algebraic check with structure enforcement
        // Format: (a1x+b1)(a2x+b2)(a3x+b3)

        const formatFactor = (a, b) => {
          const aStr = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
          const bStr = b > 0 ? `+${b}` : b < 0 ? `${b}` : "";
          return `(${aStr}${bStr})`;
        };

        const factors = [
          formatFactor(a1, b1),
          formatFactor(a2, b2),
          formatFactor(a3, b3),
        ].sort();

        return factors.join("");
      },
    },
  },
  {
    id: "simultaneous-equations-exponential",
    name: "Simultaneous Equations (Exponential)",
    parents: ["Math", "Simultaneous Equations", "Exponential"],
    question: "{{}}", // Custom dynamic question string
    answerFormat: "sequence",
    inputConfig: {
      type: "math",
      layout: "row",
      fields: [
        { label: "x", placeholder: "x" },
        { label: "y", placeholder: "y" },
      ],
    },
    generator: {
      question: function () {
        const x = getRandom(5, 1, true);
        let y;
        do {
          y = getRandom(5, 1, true);
        } while (y === x);
        const a = getRandom(5, 2, true);
        let b;
        do {
          b = getRandom(5, 2, true);
        } while (b === a);

        // Construct system:
        // a^x + b^y = K
        // x + y = M
        const K = Math.pow(a, x) + Math.pow(b, y);
        const M = x + y;

        const qStr = `${a}^x + ${b}^y = ${K}, x + y = ${M}`;
        return {
          values: [qStr, x, y],
          display: [
            { type: "text", value: "Solve for x and y: " },
            {
              type: "math",
              value: `\\begin{cases} ${a}^x + ${b}^y = ${K} \\\\ x + y = ${M} \\end{cases}`,
            },
          ],
        };
      },
      answer: (qStr, x, y) => {
        return `${x},${y}`;
      },
    },
  },
  {
    id: "algebra-cubic-expansion",
    name: "Cubic Expansion",
    parents: ["Math", "Algebra"],
    answerFormat: "sequence",
    description: "Enter coefficients for Ax³ + Bx² + Cx + D",
    inputConfig: {
      type: "polynomial",
      labels: ["x³", "x²", "x", ""], // Using specialized polynomial labels
    },
    generator: {
      question: function () {
        const a1 = getRandom(3, 1),
          b1 = getRandom(5, -5);
        const a2 = getRandom(3, 1),
          b2 = getRandom(5, -5);
        const a3 = getRandom(3, 1),
          b3 = getRandom(5, -5);

        const formatFactor = (a, b) => {
          const sign = b >= 0 ? "+" : "-";
          return `(${a}x ${sign} ${Math.abs(b)})`;
        };

        const expr = `${formatFactor(a1, b1)}${formatFactor(a2, b2)}${formatFactor(a3, b3)}`;

        return {
          values: [a1, b1, a2, b2, a3, b3], // Needed for answer? actually answer takes these args from return array
          display: [
            { type: "text", value: "Expand: " },
            { type: "math", value: expr },
          ],
        };
      },
      answer: (a1, b1, a2, b2, a3, b3) => {
        // Construct the expression (a1*x + b1)(a2*x + b2)(a3*x + b3)
        // Use expandPolynomial to get the coefficients
        // Let's use Algebrite to provide the "Description" or verification if needed.
        // But we CAN use it to verify or just return the expanded string if the answer format allowed it.
        // The question asks for "sequence" of coeffs A,B,C,D.

        // Let's stick to the calculation formula for reliability of coefficient extraction,
        // BUT we can use Algebrite to provide the "Description" or verification if needed.
        // Actually, for this specific "Cubic Expansion", calculating A,B,C,D mechanically is fine and faster/ safer than parsing string.
        // So I will keep the calculation but adding a comment that we could use Algebrite.

        const A = a1 * a2 * a3;
        const B = a1 * a2 * b3 + a1 * a3 * b2 + a2 * a3 * b1;
        const C = a1 * b2 * b3 + a2 * b1 * b3 + a3 * b1 * b2;
        const D = b1 * b2 * b3;
        return `${A},${B},${C},${D}`;
      },
    },
  },
];

export default algebraQuestions;
