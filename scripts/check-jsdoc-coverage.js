#!/usr/bin/env node
/**
 * @file check-jsdoc-coverage.js
 * @description Audits JSDoc coverage across a JavaScript/TypeScript project.
 *
 * Usage:
 *   node scripts/check-jsdoc-coverage.js [root-directory] [--json] [--ignore dir1,dir2]
 *
 * Exit codes:
 *   0 = 100% coverage
 *   1 = some files are missing documentation
 */

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const rootDir = args[0] && !args[0].startsWith("-") ? args[0] : process.cwd();
const jsonMode = args.includes("--json");
const ignoreIdx = args.indexOf("--ignore");
const extraIgnore =
  ignoreIdx !== -1 && args[ignoreIdx + 1]
    ? args[ignoreIdx + 1].split(",").map((d) => d.trim())
    : [];

const DEFAULT_IGNORE = [
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  "tests",
  "__tests__",
  ".git",
  ".vscode",
  ".idea",
  "public",
  "static",
  "assets",
];

const ignoreDirs = new Set([...DEFAULT_IGNORE, ...extraIgnore]);
const extensions = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

function walk(dir) {
  let results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          results = results.concat(walk(path.join(dir, entry.name)));
        }
      } else if (extensions.has(path.extname(entry.name))) {
        results.push(path.join(dir, entry.name));
      }
    }
  } catch (err) {
    console.error(`Warning: Cannot read directory ${dir}: ${err.message}`);
  }
  return results;
}

function hasFileJSDoc(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.includes("@file");
  } catch {
    return false;
  }
}

const allFiles = walk(path.resolve(rootDir));
const documented = [];
const missing = [];

for (const file of allFiles) {
  if (hasFileJSDoc(file)) {
    documented.push(file);
  } else {
    missing.push(file);
  }
}

const total = allFiles.length;
const pct = total === 0 ? 100 : ((documented.length / total) * 100).toFixed(1);

if (jsonMode) {
  console.log(
    JSON.stringify(
      {
        rootDir: path.resolve(rootDir),
        total,
        documented: documented.length,
        missing: missing.length,
        coveragePercent: parseFloat(pct),
        missingFiles: missing.map((f) => path.relative(rootDir, f)),
      },
      null,
      2,
    ),
  );
} else {
  console.log(`\n📊 JSDoc Coverage Report`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Root:        ${path.resolve(rootDir)}`);
  console.log(`   Total files: ${total}`);
  console.log(`   Documented:  ${documented.length} ✅`);
  console.log(`   Missing:     ${missing.length} ${missing.length > 0 ? "❌" : "✅"}`);
  console.log(`   Coverage:    ${pct}%`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (missing.length > 0) {
    console.log(`Missing @file JSDoc header in:\n`);
    for (const f of missing) {
      console.log(`  ❌ ${path.relative(rootDir, f)}`);
    }
    console.log("");
  }
}

process.exit(missing.length > 0 ? 1 : 0);
