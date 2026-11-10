import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const legacyPath = path.resolve(
  __dirname,
  "../services/math-questions/legacy.js",
);
const outDir = path.resolve(__dirname, "../services/math-questions");

const content = fs.readFileSync(legacyPath, "utf8");
const lines = content.split("\n");

const categoryMap = {
  ARITHMETIC: "arithmetic",
  ALGEBRA: "algebra",
  FRACTIONS: "fractions",
  "CIRCLE THEOREMS": "geometry",
  STATISTICS: "statistics",
  LOGARITHMS: "logarithms",
  "SIMULTANEOUS EQUATIONS": "simultaneous",
  PERMUTATIONS: "combinatorics",
  SERIES: "series",
  TRIGONOMETRY: "trigonometry",
  "COORDINATE GEOMETRY": "geometry",
};

// 1. Extract imports
const imports = [];
let i = 0;
while (i < lines.length) {
  if (lines[i].startsWith("import ")) {
    let importStmt = lines[i];
    while (!importStmt.includes(";") && i < lines.length - 1) {
      i++;
      importStmt += "\n" + lines[i];
    }
    imports.push(importStmt);
  }
  if (lines[i].includes("const MathQuestions = [")) {
    break;
  }
  i++;
}
i++; // skip the 'const MathQuestions = [' line

const questionsByCategory = {};

let currentCategory = "arithmetic"; // default
let currentQuestionLines = [];
let braceCount = 0;
let inQuestion = false;

while (i < lines.length) {
  const line = lines[i];

  // Detect category change
  const categoryMatch = line.match(/\/\/\s*---\s*([A-Z\s&]+?)(?::.*)?\s*---/);
  if (categoryMatch && !inQuestion) {
    const rawCat = categoryMatch[1].trim();
    let mapped = null;
    for (const [key, val] of Object.entries(categoryMap)) {
      if (rawCat.includes(key)) {
        mapped = val;
        break;
      }
    }
    if (mapped) {
      currentCategory = mapped;
    } else {
      console.warn(`Unmapped category: ${rawCat}, defaulting to arithmetic`);
      currentCategory = "arithmetic";
    }
    i++;
    continue;
  }

  // End of array
  if (line.startsWith("];")) {
    break;
  }

  // Bracket counting for a single question object
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;

  if (line.trim().startsWith("{") && braceCount === 0 && !inQuestion) {
    inQuestion = true;
    currentQuestionLines = [];
  }

  if (inQuestion) {
    currentQuestionLines.push(line);
    braceCount += openBraces;
    braceCount -= closeBraces;

    // Check if question ended
    if (braceCount === 0) {
      inQuestion = false;
      // Depending on formatting, the comma might be on the same line or next line
      if (
        currentQuestionLines[currentQuestionLines.length - 1]
          .trim()
          .endsWith(",")
      ) {
        // perfect
      } else if (i + 1 < lines.length && lines[i + 1].trim() === ",") {
        currentQuestionLines.push(lines[i + 1]);
        i++;
      }

      if (!questionsByCategory[currentCategory]) {
        questionsByCategory[currentCategory] = [];
      }
      questionsByCategory[currentCategory].push(
        currentQuestionLines.join("\n"),
      );
      currentQuestionLines = [];
    }
  }
  i++;
}

// Generate files
const registryImports = [];
const registryArrays = [];

for (const [category, questions] of Object.entries(questionsByCategory)) {
  const fileContent = `${imports.join("\n\n")}

const ${category}Questions = [
${questions.join("\n")}
];

export default ${category}Questions;
`;

  // We already have arithmetic.js, but let's overwrite it with the legacy ones merged
  // Wait, I created arithmetic.js with one question earlier. I will just overwrite it.
  fs.writeFileSync(path.join(outDir, `${category}.js`), fileContent);

  registryImports.push(`import ${category}Questions from './${category}.js';`);
  registryArrays.push(`  ...${category}Questions,`);
}

// Write registry
const registryContent = `${registryImports.join("\n")}

const allQuestions = [
${registryArrays.join("\n")}
];

// Ensure all IDs are unique at startup
const idMap = new Map();
allQuestions.forEach(q => {
  if (idMap.has(q.id)) {
    throw new Error(\`Duplicate MathQuestion ID detected: \${q.id}\`);
  }
  idMap.set(q.id, q);
});

export const getAllQuestions = () => {
  return allQuestions;
};

export const getQuestionById = (id) => {
  return idMap.get(id);
};
`;
fs.writeFileSync(path.join(outDir, "registry.js"), registryContent);
import { pathToFileURL } from "url";

// Load the emitted registry module to execute startup validation
await import(pathToFileURL(path.join(outDir, "registry.js")).href);

// Remove legacy.js
fs.unlinkSync(legacyPath);

console.log("Migration complete!");
