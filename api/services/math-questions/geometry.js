/**
 * @file geometry.js
 * @description Provides geometry question generators for the math questions registry.
 * @architecture Exported as an array of question definitions to be registered in the central math registry.
 */
import * as math from "mathjs";

import {
  getRandom,
  toFractionString,
  getRandomPrime,
  formatLineEquation,
} from "../../utils/math.utils.js";

const geometryQuestions = [
  {
    id: "circle-degrees-to-radians",
    name: "Degrees to Radians",
    parents: ["Math", "Circle Theorems", "Radiometry"],
    answerFormat: "string",
    description: "Enter the fraction coefficient of π (e.g. 1/2 for π/2)",
    inputConfig: {
      type: "math",
      fields: [{ label: "Coefficient of π", placeholder: "e.g. 1/2" }],
    },
    generator: {
      question: function () {
        const deg = getRandomPrime(360, 0);
        return {
          values: [deg],
          display: [
            { type: "text", value: "Convert " },
            { type: "math", value: `${deg}^\\circ` },
            { type: "text", value: " to radians (in terms of " },
            { type: "math", value: "\\pi" },
            { type: "text", value: ")." },
          ],
        };
      },
      answer: (deg) => {
        // Return fraction string "deg/180" simplified
        return toFractionString(deg, 180);
      },
    },
  },
  {
    id: "circle-radians-to-degrees",
    name: "Radians to Degrees",
    parents: ["Math", "Circle Theorems", "Radiometry"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [
        { label: "Degrees", placeholder: "Enter degrees", type: "number" },
      ],
    },
    generator: {
      question: function () {
        const deg = getRandomPrime(360, 0);
        // Return fraction string "n/d" as one argument
        return {
          values: [toFractionString(deg, 180)],
          display: [
            { type: "text", value: "Convert " },
            { type: "math", value: `${toFractionString(deg, 180)}\\pi` },
            { type: "text", value: " radians to degrees." },
          ],
        };
      },
      answer: (fracStr) => {
        // Reverse calculation: val * 180 = deg
        if (fracStr.includes("/")) {
          const [n, d] = fracStr.split("/");
          return (parseInt(n) / parseInt(d)) * 180;
        } else {
          return parseInt(fracStr) * 180;
        }
      },
    },
  },
  {
    id: "circle-sectors",
    name: "Sectors",
    parents: ["Math", "Circle Theorems"],
    question: "{{}}", // Dynamic question text populated by generator
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [{ label: "Answer", placeholder: "Enter value", type: "number" }],
    },
    generator: {
      question: function () {
        const radius = getRandom(20, 1, true);
        const rawAngle = getRandom(360, 1, true) * (Math.PI / 180);
        const arc = parseFloat((radius * rawAngle).toFixed(1));
        const angle = arc / radius;
        const type = getRandom(3, 0, true);

        // Determine question variant (qText returned to frontend)
        let qText;
        if (type == 0) {
          qText = `Find the arc length of a circle with radius ${radius} and angle ${angle} radians`;
        } else if (type == 1) {
          qText = `Find the radius of a circle with arc length ${arc} and angle ${angle} radians`;
        } else if (type == 2) {
          qText = `Find the angle (in radians) of a circle with radius ${radius} and arc length ${arc}`;
        } else {
          qText = `Find the area of a sector with radius ${radius} and angle ${angle} radians`;
        }

        return {
          values: [qText, type, angle, radius, arc],
          display: [{ type: "text", value: qText }],
        };
      },
      answer: (qText, type, angle, radius, arc) => {
        // Logic based on variant type
        if (type == 0) return arc;
        if (type == 1) return radius;
        if (type == 2) return angle;
        // Area of sector = (1/2) * r^2 * theta
        return math.round((math.pow(radius, 2) * angle) / 2, 2);
      },
    },
  },
  {
    id: "coordinate-geometry-polygon-area-level1",
    type: "multi-step",
    name: "Polygon Area (Level 1)",
    parents: ["Math", "Coordinate Geometry", "Polygon Area"],
    answerFormat: "number",
    description: "Solve step-by-step",
    inputConfig: {
      type: "math",
      fields: [{ label: "Area", placeholder: "Enter area", type: "number" }],
    },
    generator: {
      question: function (cachedContext) {
        let n, points, pointsStr;

        if (cachedContext) {
          ({ n, points, pointsStr } = cachedContext);
        } else {
          n = getRandom(5, 3, true); // Number of vertices
          points = [];
          for (let i = 0; i < n; i++) {
            let newPoint;
            let isDuplicate;
            do {
              newPoint = [getRandom(20, -10, true), getRandom(20, -10, true)];
              isDuplicate = points.some(
                (p) => p[0] === newPoint[0] && p[1] === newPoint[1],
              );
            } while (isDuplicate);
            points.push(newPoint);
          }

          const cx = points.reduce((sum, p) => sum + p[0], 0) / n;
          const cy = points.reduce((sum, p) => sum + p[1], 0) / n;
          points.sort(
            (a, b) =>
              Math.atan2(a[1] - cy, a[0] - cx) -
              Math.atan2(b[1] - cy, b[0] - cx),
          );

          pointsStr = points.map((p) => `(${p[0]},${p[1]})`).join(", ");
        }

        // Use Shoelace Formula for polygon area
        let forwardSum = 0;
        let backwardSum = 0;
        const len = points.length;
        for (let i = 0; i < len; i++) {
          forwardSum += points[i][0] * points[(i + 1) % len][1];
          backwardSum += points[(i + 1) % len][0] * points[i][1];
        }
        const area = math.abs(forwardSum - backwardSum) / 2;
        const diagonalDiff = math.abs(forwardSum - backwardSum);

        // Round area to 2 decimal places if needed (though integers usually yield .0 or .5)
        const finalArea = math.round(area, 2);

        return {
          context: {
            n,
            points,
            pointsStr,
            forwardSum,
            backwardSum,
            diagonalDiff,
            finalArea,
          },
          steps: [
            {
              // question: "Calculate the absolute difference of the cross products: |Σ(xᵢyᵢ₊₁) - Σ(yᵢxᵢ₊₁)|",
              display: [
                {
                  type: "text",
                  value:
                    "Calculate the absolute difference of the cross products: ",
                },
                {
                  type: "math",
                  value: "|\\sum(x_iy_{i+1}) - \\sum(y_ix_{i+1})|",
                },
                { type: "text", value: ` for points ${pointsStr}` },
              ],
              numbers: [pointsStr, points],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  {
                    label: "Difference",
                    placeholder: "|Sum1 - Sum2|",
                    type: "number",
                  },
                ],
              },
              answer: (ctx) => ctx.diagonalDiff,
            },
            {
              // question: "Calculate the final area",
              display: [{ type: "text", value: "Calculate the final area" }],
              numbers: [],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  { label: "Area", placeholder: "Enter area", type: "number" },
                ],
              },
              answer: (ctx) => ctx.finalArea,
            },
          ],
        };
      },
    },
  },
  {
    id: "coordinate-geometry-polygon-area-level2",
    name: "Polygon Area (Level 2)",
    parents: ["Math", "Coordinate Geometry", "Polygon Area"],
    answerFormat: "number",
    inputConfig: {
      type: "math",
      fields: [{ label: "Area", placeholder: "Enter area", type: "number" }],
    },
    generator: {
      question: function () {
        // More vertices for higher level
        const n = getRandom(9, 3, true);
        const points = [];
        for (let i = 0; i < n; i++) {
          points.push([getRandom(20, -10, true), getRandom(20, -10, true)]);
        }
        const pointsStr = points.map((p) => `(${p[0]},${p[1]})`).join(", ");
        return {
          values: [pointsStr, points],
          display: [
            {
              type: "text",
              value: "Find the area of the polygon with vertices: ",
            },
            { type: "math", value: pointsStr },
          ],
        };
      },
      answer: (pointsStr, points) => {
        // Use Shoelace Formula
        let forwardSum = 0;
        let backwardSum = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
          forwardSum += points[i][0] * points[(i + 1) % n][1];
          backwardSum += points[(i + 1) % n][0] * points[i][1];
        }
        return math.abs(forwardSum - backwardSum) / 2;
      },
    },
  },
  {
    id: "coordinate-geometry-equation-of-line",
    type: "multi-step",
    name: "Equation of Line",
    parents: ["Math", "Coordinate Geometry"],
    answerFormat: "string", // "y=mx+c"
    description: "Solve step-by-step",
    inputConfig: {
      type: "math",
      fields: [{ label: "Equation", placeholder: "y = mx + c" }],
    },
    generator: {
      question: function (cachedContext) {
        let a, b, c, d;
        if (cachedContext) {
          ({ a, b, c, d } = cachedContext);
        } else {
          a = getRandom(10, -10, true); // x1
          b = getRandom(10, -10, true); // y1
          c = getRandom(10, -10, true); // x2
          d = getRandom(10, -10, true); // y2
          // Ensure slope exists (x1 != x2)
          if (a === c) c = c + 1;
        }

        const dy = d - b;
        const dx = c - a;
        const m = dy / dx;
        const intercept = b - m * a; // y = mx + c => c = y - mx

        const mVal = math.round(m, 2);
        const cVal = math.round(intercept, 2);
        const finalEq = formatLineEquation(mVal, cVal);

        return {
          context: { a, b, c, d, m: mVal, intercept: cVal, finalEq },
          steps: [
            {
              // question: "Find the gradient (m) of the line passing through ({{}},{{}}) and ({{}},{{}})",
              display: [
                {
                  type: "text",
                  value: "Find the gradient (m) of the line passing through ",
                },
                { type: "math", value: `(${a},${b})` },
                { type: "text", value: " and " },
                { type: "math", value: `(${c},${d})` },
              ],
              numbers: [a, b, c, d],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  {
                    label: "m",
                    placeholder: "Enter slope",
                    type: "number",
                    layout: "inline",
                  },
                ],
              },
              answer: (ctx) => ctx.m,
            },
            {
              // question: "Find the y-intercept (c)",
              display: [{ type: "text", value: "Find the y-intercept (c)" }],
              numbers: [],
              answerFormat: "number",
              inputConfig: {
                type: "math",
                fields: [
                  {
                    label: "c",
                    placeholder: "Enter intercept",
                    type: "number",
                    layout: "inline",
                  },
                ],
              },
              answer: (ctx) => ctx.intercept,
            },
            {
              // question: "Write the final equation",
              display: [{ type: "text", value: "Write the final equation" }],
              numbers: [],
              answerFormat: "string",
              inputConfig: {
                type: "math",
                fields: [
                  {
                    label: "Equation",
                    placeholder: "y = mx + c",
                    layout: "inline",
                  },
                ],
              },
              answer: (ctx) => ctx.finalEq,
            },
          ],
        };
      },
    },
  },
];

export default geometryQuestions;
