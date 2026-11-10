/**
 * @file math.utils.js
 * @description Pure utility functions for mathematical operations, random generation, and equality checks.
 * @architecture Provides core math utilities and validation logic for question generators and answer evaluation.
 *
 * DEPENDENCIES:
 * - mathjs: Core library for numeric and matrix calculations.
 * - algebrite: Computer Algebra System (CAS) for symbolic math (simplification, expansion, roots).
 *
 * EXPORTS:
 * - getRandom, getRandomPrime: Helpers for Question Generators.
 * - formatAlgebraicExpression: Formatter for displaying math in frontend.
 * - checkAlgebraicEqual: Critical validation logic for symbolic answers.
 * - checkSetEqual: Critical validation logic for unordered sets (e.g. roots).
 * - checkSequenceEqual: Critical validation logic for ordered sequences.
 */
import * as math from "mathjs";
import algebrite from "algebrite";

// --- Random Number Generators ---

/**
 * @desc    Generates a random number within a range.
 * @param   {number} max - The maximum value.
 * @param   {number} [min=0] - The minimum value.
 * @param   {boolean} [isInteger=true] - Whether to return an integer.
 * @param   {number} [precision=2] - The decimal precision if not an integer.
 * @returns {number} A random number.
 */
export const getRandom = (max, min = 0, isInteger = true, precision = 2) => {
  if (isInteger) {
    return math.pickRandom(math.range(min, max + 1).toArray());
  } else {
    let rand = Math.random() * (max - min) + min;
    return math.round(rand, precision);
  }
};

/**
 * @desc    Generates a random prime number within a range.
 * @param   {number} max - The maximum value.
 * @param   {number} [min=0] - The minimum value.
 * @returns {number} A random prime number.
 */
export const getRandomPrime = (max, min = 0) => {
  const validMin = Math.max(2, min);
  const validMax = Math.max(validMin, max);

  // Filter primes in range
  const primes = [];
  for (let i = validMin; i <= validMax; i++) {
    if (math.isPrime(i)) primes.push(i);
  }

  return primes.length > 0 ? math.pickRandom(primes) : 2;
};

// --- Math Helpers ---

/**
 * @desc    Converts a number to a string with superscript digits.
 * @param   {number|string} n - The number to convert.
 * @returns {string} The string representation with superscripts.
 */
export const expo = (n) => {
  const superscripts = {
    0: "⁰",
    1: "¹",
    2: "²",
    3: "³",
    4: "⁴",
    5: "⁵",
    6: "⁶",
    7: "⁷",
    8: "⁸",
    9: "⁹",
    "-": "⁻",
    ".": "⋅",
  };
  return String(n)
    .split("")
    .map((d) => superscripts[d] || d)
    .join("");
};

/**
 * @desc    Converts a numerator and denominator into a formatted fraction string.
 * @param   {number} n - The numerator.
 * @param   {number} d - The denominator.
 * @returns {string} The formatted fraction.
 */
export const toFractionString = (n, d) => {
  if (d === 0) return "Infinity";
  const frac = math.fraction(n, d);
  return frac.d === 1
    ? String(frac.n * frac.s)
    : `${frac.n * frac.s}/${frac.d}`;
};

/**
 * @desc    Checks if a number is prime.
 * @param   {number} n - The number to check.
 * @returns {boolean} True if prime, false otherwise.
 */
export const isPrime = (n) => math.isPrime(n);

/**
 * @desc    Calculates the factorial of a number.
 * @param   {number} n - The number.
 * @returns {number} The factorial of n.
 */
export const factorial = (n) => math.factorial(n);

/**
 * @desc    Gets all divisors of a number.
 * @param   {number} n - The number.
 * @returns {Array<number>} An array of divisors.
 */
export const getDivisors = (n) => {
  const divisors = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) divisors.push(i);
  }
  return divisors;
};

/**
 * @desc    Converts a number to a specific base string representation.
 * @param   {number} num - The number to convert.
 * @param   {number} base - The target base.
 * @returns {string} The base representation.
 */
export const toBase = (num, base) => {
  return num.toString(base).toUpperCase();
};

/**
 * Cleanly format an algebraic expression.
 * Prioritizes canonical polynomial order (descending degree) using rationalize.
 * Falls back to simplify for non-rational expressions.
 * Removes explicit multiplication signs (*) before variables for standard notation.
 */
export const formatAlgebraicExpression = (expr) => {
  try {
    // Try rationalize first for canonical ordering (e.g., x^2 - 5x + 6)
    return math
      .rationalize(expr)
      .toString()
      .replace(/\s/g, "")
      .replace(/\*([a-zA-Z(])/g, "$1");
  } catch {
    try {
      // Fallback to simplify (e.g. for sqrt, log)
      return math
        .simplify(expr)
        .toString()
        .replace(/\s/g, "")
        .replace(/\*([a-zA-Z(])/g, "$1");
    } catch {
      return expr;
    }
  }
};

/**
 * Format a line equation in y=mx+c form.
 * Handles cases like m=1 (y=x) or c=0 (y=mx) naturally.
 */
export const formatLineEquation = (m, c) => {
  try {
    // Use simplify to handle 1x -> x and +0 removal
    const expr = math.simplify(`${m}*x + ${c}`).toString();
    return `y=${expr.replace(/\s/g, "")}`;
  } catch {
    // Manual fallback
    const mPart = m === 1 ? "x" : m === -1 ? "-x" : `${m}x`;
    const cPart = c === 0 ? "" : c > 0 ? `+${c}` : `${c}`;
    return `y=${mPart}${cPart}`;
  }
};

// --- Input Sanitization ---

/**
 * @desc    Sanitizes user input by normalizing mathematical symbols and LaTeX notation.
 * @param   {string|any} val - The input to sanitize.
 * @returns {string|any} The sanitized string.
 */
export const sanitizeInput = (val) => {
  if (typeof val !== "string") return val;
  let s = val.trim();

  // Normalize common symbols
  s = s
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");

  // Convert LaTeX commands to standard math notation
  s = s
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/\\div/g, "/");

  // Remove LaTeX formatting hints
  s = s
    .replace(/\\left\(|\\right\)/g, "(")
    .replace(/\\left\[|\\right\]/g, "[")
    .replace(/\\left\{|\\right\}/g, "{")
    .replace(/\\text\{([^{}]+)\}/g, "$1");

  // Handle Superscripts: x^{2} -> x^(2)
  s = s.replace(/(\^)\{([^{}]+)\}/g, "$1($2)");

  // Cleanup lingering backslashes from common functions
  s = s
    .replace(/\\(sin|cos|tan|log|ln|sqrt|exp)/g, "$1")
    .replace(/\\/g, "")
    .replace(/\{/g, "(")
    .replace(/\}/g, ")");

  // Remove thousands separators from numbers only
  s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2");

  return s;
};

// --- Validation Functions ---

/**
 * Check if two algebraic expressions are symbolically equivalent.
 * Uses math.symbolicEqual for robust comparison (e.g. x(x+1) == x^2+x).
 */
/**
 * INTERCONNECT: Uses Algebrite (CAS) to symbolically verify if two expressions are equivalent.
 * Handles normalization of input (implicit multiplication) and tries multiple strategies:
 * 1. Direct simplification of (A - B) -> 0
 * 2. Expansion of (A - B) -> 0
 * 3. Ratio check for equations (LHS1-RHS1) / (LHS2-RHS2) == Constant
 * Fallback: String comparison if CAS fails.
 */
export const checkAlgebraicEqual = (val1, val2) => {
  try {
    const prepare = (val) => {
      let s = sanitizeInput(val);
      if (typeof s !== "string") return s;

      // Treat comma-separated lists as product of factors for comparison
      if (s.includes(",")) {
        return s
          .split(",")
          .map((part) => part.trim())
          .filter((part) => part !== "")
          .map((part) => `(${part})`)
          .join("*");
      }
      // Ensure explicit multiplication between groups like (a)(b) -> (a)*(b)
      s = s.replace(/\)\s*\(/g, ")*(");
      // Ensure x( -> x*(
      s = s.replace(/([a-zA-Z0-9])\s*\(/g, "$1*(");
      s = s.replace(/\*\s*-(\d+(\.\d+)?)/g, "*(-$1)");

      return s;
    };

    const v1 = prepare(val1);
    const v2 = prepare(val2);

    // Check if inputs are equations (contain '=')
    const isEq1 = v1.includes("=");
    const isEq2 = v2.includes("=");

    if (isEq1 !== isEq2) return false; // One is equation, other is expression

    if (isEq1) {
      // Equation comparison: Check if (LHS1 - RHS1) is a constant multiple of (LHS2 - RHS2)
      const [L1, R1] = v1.split("=").map((s) => s.trim() || "0");
      const [L2, R2] = v2.split("=").map((s) => s.trim() || "0");

      // Move everything to LHS: E = LHS - RHS
      const E1 = `(${L1}) - (${R1})`;
      const E2 = `(${L2}) - (${R2})`;

      // Logic: Ratio check `simplifed(E1 / E2)`
      const ratio = algebrite.run(`simplify((${E1}) / (${E2}))`).toString();
      // If ratio is a number (constant), they are equivalent equations
      // We check if ratio contains any variables (letters).
      const hasVars = /[a-df-hj-z]/.test(ratio);

      if (!hasVars) {
        return true;
      }

      // Fallback for complex constant expressions:
      // If `E1 - E2 == 0` (Direct match)
      if (algebrite.run(`simplify((${E1}) - (${E2}))`).toString() === "0")
        return true;
      // If `E1 + E2 == 0` (Negative match)
      if (algebrite.run(`simplify((${E1}) + (${E2}))`).toString() === "0")
        return true;

      return false;
    }

    // Algebrite logic: check if simplified difference is 0
    // We use run() to execute the subtraction.
    let diff = "0";
    try {
      diff = algebrite.run(`(${v1}) - (${v2})`).toString();
    } catch (err) {
      console.error("Algebrite run error:", err);
      return (
        String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase()
      );
    }

    // Algebrite returns "0" for equivalent expressions
    if (diff === "0") return true;

    // Try simplifying the difference
    try {
      const simplified = algebrite.run(`simplify(${diff})`).toString();
      if (simplified === "0") return true;

      // Try expanding the difference (handles cases like x(x+1) - (x^2+x))
      // Algebrite doesn't always distribute automatically in simplify
      const expanded = algebrite.run(`expand(${diff})`).toString();
      if (expanded === "0") return true;
    } catch (e) {
      console.warn("Algebrite simplify/expand failed:", e);
    }

    return false;
  } catch (e) {
    console.error(
      "Algebrite check failed, falling back to string comparison:",
      e,
    );
    return (
      String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase()
    );
  }
};

/**
 * @desc    Expand a polynomial expression using Algebrite.
 * @param   {string} expr - The polynomial expression.
 * @returns {string} The expanded expression.
 */
export const expandPolynomial = (expr) => {
  try {
    return algebrite.run(`expand(${expr})`).toString();
  } catch (e) {
    console.error("Algebrite expansion failed:", e);
    return expr;
  }
};

/**
 * @desc    Get roots of an equation using Algebrite.
 * @param   {string} expr - The equation string.
 * @returns {Array<string>} An array of root values.
 */
export const getRoots = (expr) => {
  try {
    const res = algebrite.run(`roots(${expr})`).toString();
    if (res.startsWith("[") && res.endsWith("]")) {
      // Basic parsing of Algebrite array output "[a,b,...]"
      return res
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim());
    }
    return [res];
  } catch {
    return [];
  }
};

/**
 * @desc    Validates if an AST node represents a "factor" (symbol, parenthesis, or nested product).
 * @param   {Object} node - The AST node to check.
 * @returns {boolean} True if it is a valid factor.
 */
export const isValidFactor = (node) => {
  if (
    node.type === "ParenthesisNode" ||
    node.type === "SymbolNode" ||
    node.type === "ConstantNode"
  )
    return true;
  if (node.type === "OperatorNode" && node.op === "*")
    return node.args.every(isValidFactor);
  // Handle negation of a factor (e.g. -(x+1))
  if (node.type === "OperatorNode" && node.op === "-" && node.args.length === 1)
    return isValidFactor(node.args[0]);
  // Handle power (e.g. (x+1)^2)
  if (node.type === "OperatorNode" && node.op === "^")
    return isValidFactor(node.args[0]);
  return false;
};

/**
 * @desc    Checks if the expression AST follows a factorised structure (product of factors).
 * @param   {Object} node - The AST node to check.
 * @returns {boolean} True if the structure is factorised.
 */
export const checkFactorisedStructure = (node) => {
  if (node.type === "OperatorNode" && node.op === "*") {
    return node.args.every(isValidFactor);
  }
  return isValidFactor(node); // Single factor count
};

/**
 * @desc    Checks if a string expression is in a factorised form.
 * @param   {string} expr - The expression string.
 * @returns {boolean} True if factorised.
 */
export const isFactorisedForm = (expr) => {
  try {
    let s = sanitizeInput(expr);
    // Pre-process implicit multiplication (same logic as checkAlgebraicEqual)
    s = s.replace(/\)\s*\(/g, ")*(");
    s = s.replace(/([a-zA-Z0-9])\s*\(/g, "$1*(");
    s = s.replace(/\*\s*-(\d+(\.\d+)?)/g, "*(-)");

    return checkFactorisedStructure(math.parse(s));
  } catch {
    return false;
  }
};

/**
 * @desc    Algebraic equality check that optionally enforces factorised structure.
 * @param   {string} val1 - First value.
 * @param   {string} val2 - Second value.
 * @param   {boolean} [requireFactorised=false] - Whether to require a factorised form.
 * @returns {boolean} True if equivalent.
 */
export const checkAlgebraicEqualWithStructure = (
  val1,
  val2,
  requireFactorised = false,
) => {
  if (requireFactorised && !isFactorisedForm(val2)) return false;
  return checkAlgebraicEqual(val1, val2);
};

/**
 * @desc    Solve for coefficients of a polynomial P(x) by evaluating at distinct points.
 * @param   {string} exprStr - The polynomial expression string.
 * @param   {string} [varName="x"] - The variable name.
 * @param   {number} [degree=3] - The maximum degree.
 * @returns {Object} The polynomial coefficients.
 */
export const getPolynomialCoeffs = (exprStr, varName = "x", degree = 3) => {
  try {
    const f = math.parse(sanitizeInput(exprStr)).compile();
    const points = [];

    // Generate y values for x = 0, 1, 2... up to degree
    for (let i = 0; i <= degree; i++) {
      points.push(f.evaluate({ [varName]: i }));
    }

    // P(0) is the constant term (let's call it d, or the last coeff)
    const d = points[0];
    const B = points.slice(1).map((y) => y - d); // Adjust for constant term

    // If degree is 0, return just d
    if (degree === 0) return { a: 0, b: 0, c: 0, d };

    // Build Matrix A (Vandermonde-like)
    // Rows i from 1 to degree (corresponding to x=1, x=2, etc.)
    // Columns j from 0 to degree-1 (powers: x^degree, x^(degree-1)... x^1)
    // Note: Our standard form might be ax^3 + bx^2 + cx + d.
    // So powers are descending.

    const A = [];
    for (let x = 1; x <= degree; x++) {
      const row = [];
      for (let p = degree; p >= 1; p--) {
        row.push(Math.pow(x, p));
      }
      A.push(row);
    }

    // Solve Ax = B
    const coeffs = math.lusolve(A, B).map((sol) => math.round(sol[0], 6));

    // Map back to named coefficients (a, b, c, d...)
    // This is a bit specific to the cubic expectation {a,b,c,d}, but we can return dynamic too.
    // For compatibility with existing usage (cubic), we return a,b,c,d.

    // If degree=3, coeffs has 3 elements [a, b, c]
    if (degree === 3) {
      const [a, b, c] = coeffs;
      return { a, b, c, d };
    }

    return { coeffs, constant: d };
  } catch {
    return { a: 0, b: 0, c: 0, d: 0 };
  }
};

/**
 * INTERCONNECT: Verifies answers where order MATTERS (e.g., next 3 terms of sequence).
 * Logic: Element-wise comparison without sorting.
 */
export const checkSequenceEqual = (val1, val2) => {
  const parseList = (s) =>
    String(s)
      .split(",")
      .map((n) => {
        try {
          return math.number(math.evaluate(sanitizeInput(n)));
        } catch {
          const res = parseFloat(n.trim().replace(/,/g, ""));
          return isNaN(res) ? n.trim().toLowerCase() : res;
        }
      });

  const s1 = parseList(val1);
  const s2 = parseList(val2);
  const length = Math.max(s1.length, s2.length);

  for (let i = 0; i < length; i++) {
    const v1 = s1[i] ?? 0; // Treat missing tail as 0
    const v2 = s2[i] ?? 0;

    if (typeof v1 === "number" && typeof v2 === "number") {
      if (!math.equal(math.round(v1, 6), math.round(v2, 6))) return false;
    } else if (String(v1).toLowerCase() !== String(v2).toLowerCase()) {
      return false;
    }
  }
  return true;
};

// Legacy: Deprecated in favor of checkAlgebraicEqualWithStructure
export const checkStringSetEqual = (val1, val2) => {
  /* Implementation omitted for brevity, discouraged for new use */
  return checkAlgebraicEqual(val1, val2);
};

/**
 * @desc    Decodes a string of superscript digits to an integer.
 * @param   {string} str - The superscript string.
 * @returns {number} The integer representation.
 */
export const decodeExpo = (str) => {
  const map = {
    "⁰": 0,
    "¹": 1,
    "²": 2,
    "³": 3,
    "⁴": 4,
    "⁵": 5,
    "⁶": 6,
    "⁷": 7,
    "⁸": 8,
    "⁹": 9,
  };
  return parseInt(
    str
      .split("")
      .map((c) => map[c])
      .join(""),
  );
};

/**
 * @desc    Checks if two values are numerically equal.
 * @param   {string|number} val1 - The first value.
 * @param   {string|number} val2 - The second value.
 * @returns {boolean} True if they are numerically equal.
 */
export const checkNumericallyEqual = (val1, val2) => {
  const safeNumber = (v) => {
    try {
      return math.number(math.evaluate(sanitizeInput(v)));
    } catch {
      const n = parseFloat(String(v).replace(/,/g, ""));
      return isNaN(n) ? null : n;
    }
  };

  const n1 = safeNumber(val1);
  const n2 = safeNumber(val2);

  if (n1 === null || n2 === null)
    return String(val1).trim() === String(val2).trim();
  return math.equal(math.round(n1, 6), math.round(n2, 6));
};

/**
 * INTERCONNECT: Verifies answers where order does NOT matter (e.g., roots of quadratic: 2,3 is same as 3,2).
 * Logic: Parses strings/numbers, sorts both arrays, and compares element-wise.
 */
export const checkSetEqual = (val1, val2) => {
  const parseSet = (s) =>
    String(s)
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n !== "") // Remove empty strings from trailing commas
      .map((n) => {
        // If internal structure (like "1:2"), keep as string
        if (n.includes(":")) return n;

        // Otherwise try parse as number
        try {
          // Use strict numeric check to avoid "1a" -> 1
          const evaled = math.evaluate(sanitizeInput(n));
          const num = math.number(evaled);
          return isNaN(num) ? n : num;
        } catch {
          // Fallback for simple numbers with commas removed
          const clean = n.replace(/,/g, "");
          if (!isNaN(clean) && !isNaN(parseFloat(clean))) {
            return parseFloat(clean);
          }
          return n;
        }
      })
      .sort((a, b) => {
        if (typeof a === "number" && typeof b === "number") return a - b;
        return String(a).localeCompare(String(b));
      });

  const s1 = parseSet(val1);
  const s2 = parseSet(val2);

  if (s1.length !== s2.length) return false;
  for (let i = 0; i < s1.length; i++) {
    if (typeof s1[i] === "number" && typeof s2[i] === "number") {
      if (!math.equal(math.round(s1[i], 6), math.round(s2[i], 6))) return false;
    } else if (s1[i] !== s2[i]) return false;
  }
  return true;
};
