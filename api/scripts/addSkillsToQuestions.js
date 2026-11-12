/**
 * @file addSkillsToQuestions.js
 * @description Analyzes question text across Slate representations and assigns granular pedagogical skills from an authoritative taxonomy.
 * @architecture Part of the database maintenance and content tagging pipeline bridging raw question representations to curriculum analytics.
 * @agent_note Defaults to dry-run mode unless --apply is passed, and respects existing skills unless overridden with --force.
 */

/**
 * addSkillsToQuestions.js
 *
 * Fetches every question from the database, displays its text content and
 * current skills, then assigns the single most appropriate skill from a
 * curated taxonomy.
 *
 * Rules:
 *  - Skills are SPECIFIC competencies, not general tags (e.g. "Subject-Verb Agreement"
 *    rather than "grammar" or "english").
 *  - Always prefer an existing skill from the pool that has already been used on
 *    other questions.   Only introduce a brand-new skill when none of the existing
 *    ones is a good fit.
 *  - Questions that already have ≥ 1 skill are skipped (pass --force to overwrite).
 *
 * Usage:
 *   node scripts/addSkillsToQuestions.js           # dry-run (prints plan, no DB writes)
 *   node scripts/addSkillsToQuestions.js --apply   # write to DB
 *   node scripts/addSkillsToQuestions.js --force   # also overwrite questions that already have skills
 */

import "../config/env.js";
import connectDB from "../config/database.js";
import Question from "../models/Questions.model.js";

// ─── SKILL TAXONOMY ────────────────────────────────────────────────────────────
//
// Keep this list authoritative.  When a new skill IS needed, add it here so
// future runs of the script can reuse it.
//
// The taxonomy is intentionally granular so each skill is meaningful in an
// analytics context (e.g. "Identifying Main Idea" vs a vague "reading").
//
const SKILL_TAXONOMY = [
  // ── Reading Comprehension ──────────────────────────────────────
  "Identifying Main Idea",
  "Identifying Supporting Details",
  "Drawing Inferences",
  "Author's Purpose and Tone",
  "Comparing and Contrasting Texts",
  "Summarising a Passage",
  "Vocabulary in Context",
  "Text Structure Analysis",
  "Making Predictions",
  "Evaluating Evidence",

  // ── Grammar & Language ─────────────────────────────────────────
  "Subject-Verb Agreement",
  "Verb Tense Consistency",
  "Pronoun-Antecedent Agreement",
  "Punctuation Usage",
  "Sentence Structure",
  "Active vs Passive Voice",
  "Parallel Structure",
  "Modifier Placement",
  "Parts of Speech",
  "Spelling and Word Choice",

  // ── Writing ────────────────────────────────────────────────────
  "Thesis Development",
  "Paragraph Organisation",
  "Transitions and Cohesion",
  "Argumentative Writing",
  "Descriptive Writing",
  "Narrative Writing",
  "Editing and Revision",

  // ── Mathematics – Number & Operations ─────────────────────────
  "Integer Operations",
  "Fraction Operations",
  "Decimal Operations",
  "Ratio and Proportion",
  "Percentage Calculations",
  "Exponents and Roots",
  "Order of Operations",
  "Prime Factorisation",
  "Number Sense",

  // ── Mathematics – Algebra ──────────────────────────────────────
  "Solving Linear Equations",
  "Solving Linear Inequalities",
  "Systems of Equations",
  "Quadratic Equations",
  "Polynomial Operations",
  "Factoring Expressions",
  "Function Notation",
  "Evaluating Expressions",
  "Algebraic Word Problems",

  // ── Mathematics – Geometry ─────────────────────────────────────
  "Area and Perimeter",
  "Volume and Surface Area",
  "Properties of Triangles",
  "Pythagorean Theorem",
  "Coordinate Geometry",
  "Angles and Lines",
  "Similarity and Congruence",
  "Circle Theorems",
  "Geometric Proof",

  // ── Mathematics – Statistics & Probability ────────────────────
  "Mean, Median and Mode",
  "Data Interpretation",
  "Probability Basics",
  "Probability of Compound Events",
  "Reading Graphs and Charts",
  "Standard Deviation",

  // ── Critical Thinking / Logic ──────────────────────────────────
  "Logical Reasoning",
  "Pattern Recognition",
  "Cause and Effect",
  "Sequencing and Order",
  "Analogical Reasoning",
  "Deductive Reasoning",
  "Inductive Reasoning",
];

// ─── TEXT EXTRACTION ───────────────────────────────────────────────────────────

/**
 * Recursively extract plain text from a Slate.js node tree.
 * Handles nested children arrays as Slate always uses.
 *
 * @desc Recursively extracts plain text from a Slate.js node tree or array of nodes.
 * @param {Object|Array} node - Slate node or node array containing rich text children.
 * @returns {string} Concatenated plain text representation.
 */
function extractText(node) {
  if (!node) return "";

  // Leaf node with direct text
  if (typeof node.text === "string") return node.text;

  // Internal node with children
  if (Array.isArray(node.children)) {
    return node.children.map(extractText).join(" ");
  }

  // Top-level array (the document root)
  if (Array.isArray(node)) {
    return node.map(extractText).join(" ");
  }

  return "";
}

/**
 * Get all readable text from a question document.
 * Combines the question body, MCQ options, short-answer value, and explanation.
 *
 * @desc Extracts and normalizes readable plain text from question bodies, options, short answers, and explanations.
 * @param {Object} q - Question document or object with Slate structures.
 * @returns {string} Normalized lowercase text for skill matching.
 */
function getQuestionText(q) {
  const parts = [];

  // Question body
  if (q.question?.slate) parts.push(extractText(q.question.slate));

  // MCQ options
  if (Array.isArray(q.options?.mcq)) {
    for (const opt of q.options.mcq) {
      if (opt?.slate) parts.push(extractText(opt.slate));
    }
  }

  // Short answer
  if (q.options?.sa) parts.push(String(q.options.sa));

  // Fill-in-the-blanks answers
  if (Array.isArray(q.options?.fillInTheBlanks)) {
    parts.push(q.options.fillInTheBlanks.join(" "));
  }

  // Explanation
  if (q.explanation?.slate) parts.push(extractText(q.explanation.slate));

  return parts.join(" ").toLowerCase();
}

// ─── SKILL ASSIGNMENT ──────────────────────────────────────────────────────────
//
// Each entry is { patterns: [...], skill: "..." }.
// Patterns are arrays of keywords/phrases.  The FIRST matching rule wins, so
// order from most-specific to most-general.
//
// The skill values MUST exactly match strings in SKILL_TAXONOMY above.
//
const SKILL_RULES = [
  // ── Grammar signals  (most specific first) ────────────────────
  {
    patterns: [
      "subject-verb",
      "they is",
      "he are",
      "she are",
      "singular noun",
      "plural noun",
    ],
    skill: "Subject-Verb Agreement",
  },
  {
    patterns: [
      "verb tense",
      "past tense",
      "present tense",
      "future tense",
      "had been",
      "will have",
    ],
    skill: "Verb Tense Consistency",
  },
  {
    patterns: ["pronoun", "antecedent", "himself", "herself", "itself refers"],
    skill: "Pronoun-Antecedent Agreement",
  },
  {
    patterns: [
      "comma",
      "semicolon",
      "apostrophe",
      "punctuation",
      "quotation mark",
    ],
    skill: "Punctuation Usage",
  },
  {
    patterns: [
      "run-on sentence",
      "sentence fragment",
      "complex sentence",
      "compound sentence",
      "main clause",
      "subordinate clause",
    ],
    skill: "Sentence Structure",
  },
  {
    patterns: ["passive voice", "active voice", "was written", "is being"],
    skill: "Active vs Passive Voice",
  },
  {
    patterns: ["parallel structure", "parallelism", "parallel form"],
    skill: "Parallel Structure",
  },
  {
    patterns: ["dangling modifier", "misplaced modifier"],
    skill: "Modifier Placement",
  },
  {
    patterns: [
      "noun",
      "adjective",
      "adverb",
      "preposition",
      "conjunction",
      "parts of speech",
      "interjection",
    ],
    skill: "Parts of Speech",
  },
  {
    patterns: [
      "spelling",
      "misspell",
      "correct spelling",
      "word choice",
      "diction",
    ],
    skill: "Spelling and Word Choice",
  },

  // ── Reading / comprehension signals ───────────────────────────
  {
    patterns: [
      "main idea",
      "central idea",
      "primarily about",
      "mainly about",
      "best title",
    ],
    skill: "Identifying Main Idea",
  },
  {
    patterns: [
      "tone of the passage",
      "author's attitude",
      "mood of the passage",
      "speaker's tone",
      "how does the author feel",
    ],
    skill: "Author's Purpose and Tone",
  },
  {
    patterns: [
      "author's purpose",
      "why did the author",
      "reason the author wrote",
    ],
    skill: "Author's Purpose and Tone",
  },
  {
    patterns: [
      "infer",
      "inference",
      "implied by the passage",
      "can be concluded from",
    ],
    skill: "Drawing Inferences",
  },
  {
    patterns: [
      "supporting detail",
      "evidence in the passage",
      "according to the passage",
      "the passage states",
    ],
    skill: "Identifying Supporting Details",
  },
  {
    patterns: [
      "both passages",
      "passage one and",
      "contrast the two",
      "compare the authors",
    ],
    skill: "Comparing and Contrasting Texts",
  },
  {
    patterns: [
      "summarise",
      "summarize",
      "summary of the passage",
      "paraphrase",
    ],
    skill: "Summarising a Passage",
  },
  {
    patterns: [
      "meaning of the word",
      "context clue",
      "as used in line",
      "definition of the term",
    ],
    skill: "Vocabulary in Context",
  },
  {
    patterns: [
      "text structure",
      "chronological order",
      "problem and solution structure",
      "cause and effect structure",
    ],
    skill: "Text Structure Analysis",
  },
  {
    patterns: [
      "what will happen next",
      "most likely happen next",
      "what will the character do next",
    ],
    skill: "Making Predictions",
  },
  {
    patterns: [
      "which evidence best supports",
      "weakens the argument",
      "strengthens the claim",
      "the author's claim",
    ],
    skill: "Evaluating Evidence",
  },

  // ── Writing signals ────────────────────────────────────────────
  {
    patterns: [
      "thesis statement",
      "central claim",
      "argument of the essay",
      "thesis of the passage",
    ],
    skill: "Thesis Development",
  },
  {
    patterns: [
      "topic sentence",
      "body paragraph",
      "introductory paragraph",
      "concluding paragraph",
    ],
    skill: "Paragraph Organisation",
  },
  {
    patterns: [
      "transition word",
      "coherence of the paragraph",
      "furthermore",
      "in addition to",
      "on the other hand",
    ],
    skill: "Transitions and Cohesion",
  },
  {
    patterns: [
      "revise the sentence",
      "improve the sentence",
      "which revision",
      "which version is best",
      "best replaces the underlined",
    ],
    skill: "Editing and Revision",
  },

  // ── Maths: Number (most specific first) ───────────────────────
  // Percentage before Decimal so "50%"/"percentage" matches here, not Decimal
  {
    patterns: [
      "percent",
      "percentage",
      "%",
      "discount",
      "interest rate",
      "sales tax",
      "percent of",
    ],
    skill: "Percentage Calculations",
  },
  // LCM / HCF / divisibility / remainder before generic Integer catch-all
  {
    patterns: [
      "lcm",
      "hcf",
      "highest common factor",
      "lowest common multiple",
      "least common multiple",
      "divisible by",
      "remainder when",
      "leaves a remainder",
      "divisibility",
    ],
    skill: "Integer Operations",
  },
  {
    patterns: ["prime factori", "prime number", "factor tree"],
    skill: "Prime Factorisation",
  },
  {
    patterns: [
      "fraction",
      "numerator",
      "denominator",
      "mixed number",
      "improper fraction",
    ],
    skill: "Fraction Operations",
  },
  {
    patterns: ["decimal", "tenth", "hundredth", "place value"],
    skill: "Decimal Operations",
  },
  {
    patterns: [
      "ratio",
      "in the ratio",
      "proportion",
      "equivalent ratio",
      "scale factor of",
    ],
    skill: "Ratio and Proportion",
  },
  {
    patterns: [
      "exponent",
      "power of",
      "square root",
      "cube root",
      "√",
      "raised to",
    ],
    skill: "Exponents and Roots",
  },
  {
    patterns: ["order of operations", "pemdas", "bodmas", "evaluate: ("],
    skill: "Order of Operations",
  },
  {
    patterns: ["integer", "negative number", "absolute value", "whole number"],
    skill: "Integer Operations",
  },

  // ── Maths: Algebra ─────────────────────────────────────────────
  {
    patterns: [
      "quadratic",
      "x²",
      "x^2",
      "parabola",
      "discriminant",
      "quadratic formula",
    ],
    skill: "Quadratic Equations",
  },
  {
    patterns: ["system of equation", "simultaneous", "two equations"],
    skill: "Systems of Equations",
  },
  {
    patterns: ["linear equation", "solve for x", "value of x", "find x"],
    skill: "Solving Linear Equations",
  },
  {
    patterns: [
      "inequality",
      "x ≤",
      "x ≥",
      "x < ",
      "x > ",
      "solve the inequality",
    ],
    skill: "Solving Linear Inequalities",
  },
  {
    patterns: ["polynomial", "binomial", "trinomial"],
    skill: "Polynomial Operations",
  },
  {
    patterns: [
      "factorise",
      "factorize",
      "greatest common factor",
      "factor the expression",
    ],
    skill: "Factoring Expressions",
  },
  {
    patterns: [
      "f(x)",
      "g(x)",
      "h(x)",
      "domain of the function",
      "range of the function",
      "f of x",
    ],
    skill: "Function Notation",
  },
  {
    patterns: [
      "simplify the expression",
      "evaluate the expression",
      "expression equals",
    ],
    skill: "Evaluating Expressions",
  },
  {
    patterns: [
      "how many",
      "total cost",
      "purchases",
      "rupees",
      "speed",
      "distance",
      "time",
    ],
    skill: "Algebraic Word Problems",
  },

  // ── Maths: Geometry ────────────────────────────────────────────
  {
    patterns: ["pythagorean", "hypotenuse", "a² + b²", "right triangle"],
    skill: "Pythagorean Theorem",
  },
  {
    patterns: ["volume", "surface area", "prism", "cylinder", "cone", "sphere"],
    skill: "Volume and Surface Area",
  },
  {
    patterns: ["area of", "perimeter of", "area and perimeter"],
    skill: "Area and Perimeter",
  },
  {
    patterns: [
      "coordinate plane",
      "x-axis",
      "y-axis",
      "ordered pair",
      "slope of the line",
    ],
    skill: "Coordinate Geometry",
  },
  {
    patterns: [
      "angle",
      "parallel lines",
      "transversal",
      "supplementary angle",
      "complementary angle",
    ],
    skill: "Angles and Lines",
  },
  {
    patterns: [
      "similar triangles",
      "congruent triangles",
      "congruent figures",
      "scale of",
    ],
    skill: "Similarity and Congruence",
  },
  {
    patterns: [
      "circle",
      "radius",
      "diameter",
      "circumference",
      "chord",
      "arc length",
    ],
    skill: "Circle Theorems",
  },
  {
    patterns: [
      "geometric proof",
      "given that",
      "postulate",
      "congruence proof",
    ],
    skill: "Geometric Proof",
  },
  {
    patterns: [
      "isosceles",
      "equilateral",
      "scalene",
      "triangle inequality",
      "property of triangle",
    ],
    skill: "Properties of Triangles",
  },

  // ── Maths: Statistics ──────────────────────────────────────────
  {
    patterns: [
      "bar graph",
      "bar chart",
      "pie chart",
      "histogram",
      "data table",
      "interpret the graph",
      "line graph",
    ],
    skill: "Reading Graphs and Charts",
  },
  {
    patterns: [
      "compound event",
      "independent event",
      "dependent event",
      "p(a and b)",
      "p(a or b)",
    ],
    skill: "Probability of Compound Events",
  },
  {
    patterns: [
      "probability",
      "favorable outcome",
      "sample space",
      "die is rolled",
      "coin is tossed",
    ],
    skill: "Probability Basics",
  },
  {
    patterns: ["standard deviation", "variance", "spread of data"],
    skill: "Standard Deviation",
  },
  {
    patterns: ["mean", "median", "mode", "average of", "range of data"],
    skill: "Mean, Median and Mode",
  },
  {
    patterns: ["data set", "survey", "sample", "population statistics"],
    skill: "Data Interpretation",
  },

  // ── Critical Thinking ─────────────────────────────────────────
  {
    patterns: [
      "next in the sequence",
      "continue the sequence",
      "number pattern",
      "find the pattern",
    ],
    skill: "Pattern Recognition",
  },
  {
    patterns: [
      "cause and effect",
      "what caused",
      "effect of",
      "consequence of the action",
    ],
    skill: "Cause and Effect",
  },
  {
    patterns: [
      "in what order",
      "correct sequence",
      "arrange the steps",
      "first step",
      "next step",
    ],
    skill: "Sequencing and Order",
  },
  {
    patterns: ["analogy", " : ", "__ is to __", "as a __ is to"],
    skill: "Analogical Reasoning",
  },
  {
    patterns: [
      "if all a are",
      "must be true",
      "deduction",
      "syllogism",
      "valid conclusion",
    ],
    skill: "Deductive Reasoning",
  },
  {
    patterns: [
      "generalise",
      "generalize",
      "based on the examples",
      "pattern from examples",
    ],
    skill: "Inductive Reasoning",
  },
  {
    patterns: [
      "logical reasoning",
      "conclusion follows",
      "which statement must be true if",
    ],
    skill: "Logical Reasoning",
  },
];

/**
 * Assign the best skill for a question by matching its full text against
 * SKILL_RULES in order.  Falls back to "Logical Reasoning" as a catch-all.
 *
 * @desc Assigns the best matching skill for a question using keyword heuristics and frequency fallbacks.
 * @param {string} text - Full lowercase text of the question.
 * @param {string[]} usedSkillPool - Ordered list of skills already in DB (sorted by frequency desc).
 * @returns {string} - A skill string that exists in SKILL_TAXONOMY.
 */
function assignSkill(text, usedSkillPool) {
  for (const rule of SKILL_RULES) {
    const matches = rule.patterns.some((p) => text.includes(p));
    if (matches) {
      // Guard: only return skills that are part of the authoritative taxonomy
      if (!SKILL_TAXONOMY.includes(rule.skill)) {
        console.warn(
          `  ⚠  Rule skill "${rule.skill}" is not in SKILL_TAXONOMY — skipping rule`,
        );
        continue;
      }
      return rule.skill;
    }
  }

  // No rule matched — use the most common existing skill as a sensible default
  // rather than creating a noise entry.
  return usedSkillPool[0] ?? "Logical Reasoning";
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

const DRY_RUN = !process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

/**
 * @desc Fetches questions from MongoDB and maps corresponding skills using rule-based pattern matching.
 * @returns {Promise<void>} Resolves when skill mapping script finishes execution.
 */
const run = async () => {
  await connectDB();

  console.log("\n" + "═".repeat(60));
  console.log("  addSkillsToQuestions.js");
  console.log("  Mode:", DRY_RUN ? "DRY-RUN (pass --apply to write)" : "APPLY");
  console.log("  Force overwrite:", FORCE ? "YES (--force)" : "NO");
  console.log("═".repeat(60) + "\n");

  // Collect all distinct skills already in the database (ordered by frequency)
  const skillFreq = await Question.aggregate([
    { $unwind: "$skills" },
    { $group: { _id: "$skills", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const usedSkillPool = skillFreq.map((s) => s._id);

  console.log(
    `Existing skills in DB (${usedSkillPool.length}):`,
    usedSkillPool.length ? usedSkillPool.join(", ") : "(none yet)",
  );
  console.log();

  // Fetch all questions (lean for performance — we do our own updates)
  const questions = await Question.find({}).lean();
  console.log(`Total questions fetched: ${questions.length}\n`);

  let updated = 0;
  let alreadyHad = 0;

  for (const q of questions) {
    const hasSkills = Array.isArray(q.skills) && q.skills.length > 0;

    // ── Display question ─────────────────────────────────────────
    const text = getQuestionText(q);
    const preview = text.trim().replace(/\s+/g, " ").slice(0, 120);

    console.log("─".repeat(60));
    console.log(`[${q._id}]`);
    console.log(`  Answer type : ${q.answerType}`);
    console.log(`  Current skills: [${(q.skills || []).join(", ")}]`);
    console.log(`  Preview: "${preview}${text.length > 120 ? "…" : ""}"`);

    if (hasSkills && !FORCE) {
      console.log("  → SKIP  (already has skills; use --force to overwrite)");
      alreadyHad++;
      continue;
    }

    // ── Assign skill ─────────────────────────────────────────────
    const skill = assignSkill(text, usedSkillPool);
    console.log(`  → ASSIGN skill: "${skill}"`);

    // Track newly introduced skills so the pool stays up-to-date in-run
    if (!usedSkillPool.includes(skill)) {
      usedSkillPool.push(skill);
      console.log(`     (new skill introduced to pool)`);
    }

    if (DRY_RUN) {
      updated++;
    } else {
      // Merge with any existing skills (when --force, we add rather than replace
      // so we don't wipe skills that were manually set to something different)
      const existingSkills = q.skills ?? [];
      const newSkills = [...new Set([...existingSkills, skill])];

      await Question.updateOne({ _id: q._id }, { $set: { skills: newSkills } });
      updated++;
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("  SUMMARY");
  console.log("═".repeat(60));
  console.log(`  Total questions     : ${questions.length}`);
  console.log(`  Already had skills  : ${alreadyHad}`);
  console.log(`  ${DRY_RUN ? "Would update" : "Updated"}         : ${updated}`);
  if (DRY_RUN) {
    console.log(
      "\n  ⚠  This was a DRY-RUN.  Re-run with --apply to write to DB.",
    );
  } else {
    console.log("\n  ✓  Done. Skills written to database.");
  }
  console.log("═".repeat(60) + "\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
