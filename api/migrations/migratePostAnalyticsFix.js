/**
 * migrations/migratePostAnalyticsFix.js
 *
 * Schema-Driven Migration
 * ────────────────────────────────────────────────────────────────────────────
 * This migration is NOT hardcoded to specific field names. Instead, it:
 *
 *  [SEED]   Reads each registered Mongoose model's schema to discover every
 *           field that has a `default` value, then issues a `$set` seed on
 *           any live document that is missing that field. This automatically
 *           handles any field added to the schema in the future.
 *
 *  [REMOVE] Removes orphaned / legacy fields that no longer exist in the
 *           schema. These MUST be declared explicitly in LEGACY_FIELDS below
 *           because there is no way to infer "remove this" from the schema
 *           alone. Keep this list small and intentional.
 *
 * All operations are idempotent — re-running produces 0 modifications.
 *
 * Usage:
 *   node migrations/migratePostAnalyticsFix.js           # live run
 *   node migrations/migratePostAnalyticsFix.js --dry-run # preview only
 */

import mongoose from "mongoose";
import "../config/env.js";

const DRY_RUN = process.argv.includes("--dry-run");

// ── Model imports (side-effect: registers schemas with mongoose) ──────────────
// Import every model whose collection you want to inspect.
import "../models/user.model.js";
import "../models/Questions.model.js";
import "../models/Responses.model.js";
import "../models/Module.model.js";
import "../models/Passages.model.js";
import "../models/Notification.model.js";
import "../models/ContextAttachments.model.js";
import "../models/Vocabulary.model.js";
import "../models/session.model.js";
import "../models/admin.model.js";

// ────────────────────────────────────────────────────────────────────────────
// LEGACY_FIELDS
// ────────────────────────────────────────────────────────────────────────────
// Fields that used to exist in the schema but have been removed. They must be
// $unset from live documents to avoid stale data. This is the ONLY section you
// should need to edit when deprecating a field.
//
// Format:
//   "<modelName>": [
//     {
//       field: "<fieldName>",
//       // Optional safety check — if this async fn returns true, the $unset
//       // is skipped with a warning. Receives the raw MongoDB collection.
//       safetyCheck: async (col) => { /* return true to skip */ },
//       safetyMessage: "Human-readable reason for the skip",
//     },
//   ]
// ────────────────────────────────────────────────────────────────────────────
const LEGACY_FIELDS = {
  User: [
    {
      field: "candies",
      // Do NOT silently destroy candies if the value hasn't been transferred
      // to carrots yet. Skip if any user has candies > carrots.
      safetyCheck: async (col) => {
        const count = await col.countDocuments({
          candies: { $exists: true, $gt: 0 },
          $expr: { $gt: ["$candies", "$carrots"] },
        });
        return count > 0;
      },
      safetyMessage:
        "user(s) have candies > carrots — run 'migrate-candies-carrots' first",
    },
    {
      field: "progress",
      // No dangerous condition; always safe to remove.
    },
  ],
  Question: [
    {
      field: "difficulty",
      // No dangerous condition; always safe to remove.
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const LINE = "═".repeat(66);
const DIV = "─".repeat(66);

/**
 * Extract leaf schema paths that carry a default value.
 * Returns an array of { path, defaultValue } objects.
 *
 * We use `schemaType.instance` (a string like "String", "Number", "Array",
 * "Embedded", "DocumentArray") instead of `instanceof` checks because the
 * mongoose types are not reliably accessible across ESM module boundaries.
 */
const getSeededPaths = (schema) => {
  const seeds = [];

  schema.eachPath((pathStr, schemaType) => {
    // Skip internal Mongoose fields
    if (pathStr === "__v" || pathStr.startsWith("_id")) return;

    // Skip composite container types — only deal with leaves
    const instance = schemaType.instance;
    if (instance === "Embedded" || instance === "DocumentArray") return;

    // Also guard with the mongoose-internal boolean flag
    if (schemaType.$isMongooseDocumentArray) return;
    if (schemaType.$isSingleNested) return;

    const defaultValue = schemaType.defaultValue;

    // Only seed paths that have an explicit, non-undefined default
    if (defaultValue === undefined || defaultValue === null) return;

    // If the default is a function, call it to get the resolved value
    const resolved =
      typeof defaultValue === "function" ? defaultValue() : defaultValue;

    seeds.push({ path: pathStr, defaultValue: resolved });
  });

  return seeds;
};

/** Run one updateMany and print a detailed result line. */
const applyOp = async (collection, filter, update, description, dryRun) => {
  const matched = await collection.countDocuments(filter);

  if (matched === 0) {
    console.log(`  ✓  ${description}`);
    console.log(`     → 0 documents matched — already up to date`);
    return { matched: 0, modified: 0 };
  }

  if (dryRun) {
    console.log(`  ○  [DRY-RUN] ${description}`);
    console.log(`     → Would affect ${matched} document(s)`);
    return { matched, modified: 0 };
  }

  const result = await collection.updateMany(filter, update);
  const { matchedCount, modifiedCount } = result;

  const status = modifiedCount === matchedCount ? "✓" : "⚠";
  console.log(`  ${status}  ${description}`);
  console.log(
    `     → Matched: ${matchedCount}   Modified: ${modifiedCount}   Unchanged: ${matchedCount - modifiedCount}`,
  );

  return { matched: matchedCount, modified: modifiedCount };
};

// ── Main ──────────────────────────────────────────────────────────────────────

const migrate = async () => {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is not defined in environment.");

  await mongoose.connect(process.env.MONGODB_URI);

  const db = mongoose.connection.db;

  const totals = { matched: 0, modified: 0, skipped: 0, ops: 0 };

  const track = ({ matched, modified }) => {
    totals.matched += matched;
    totals.modified += modified;
    totals.ops += 1;
  };

  console.log(`\n${LINE}`);
  console.log(
    `  Schema-Driven Migration${DRY_RUN ? "  [DRY-RUN — no writes]" : ""}`,
  );
  console.log(`  ${new Date().toISOString()}`);
  console.log(`  MongoDB: ${mongoose.connection.host}`);
  console.log(LINE);

  // ── PHASE 1: Seed missing fields derived from schema defaults ─────────────
  console.log(`\n${DIV}`);
  console.log(`  PHASE 1 — Seed fields that have schema defaults but are`);
  console.log(`            missing from existing documents`);
  console.log(DIV);

  // Iterate over every registered model
  for (const modelName of mongoose.modelNames()) {
    const model = mongoose.model(modelName);
    const collectionName = model.collection.collectionName;
    const seeds = getSeededPaths(model.schema);

    if (seeds.length === 0) continue;

    console.log(`\n  ▸ Model: ${modelName}  (collection: ${collectionName})`);

    for (const { path: fieldPath, defaultValue } of seeds) {
      const col = db.collection(collectionName);
      track(
        await applyOp(
          col,
          { [fieldPath]: { $exists: false } },
          { $set: { [fieldPath]: defaultValue } },
          `$set ${fieldPath}: ${JSON.stringify(defaultValue)} on ${modelName} docs missing the field`,
          DRY_RUN,
        ),
      );
    }
  }

  // ── PHASE 2: Remove orphaned / legacy fields ──────────────────────────────
  console.log(`\n${DIV}`);
  console.log(`  PHASE 2 — Remove orphaned legacy fields no longer in schema`);
  console.log(DIV);

  for (const [modelName, legacyFields] of Object.entries(LEGACY_FIELDS)) {
    const model = mongoose.model(modelName);
    const collectionName = model.collection.collectionName;
    const col = db.collection(collectionName);

    console.log(`\n  ▸ Model: ${modelName}  (collection: ${collectionName})`);

    for (const { field, safetyCheck, safetyMessage } of legacyFields) {
      if (safetyCheck) {
        const unsafe = await safetyCheck(col);
        if (unsafe) {
          console.log(`  ⚠  $unset ${field} — SKIPPED`);
          console.log(`     → ${safetyMessage}`);
          totals.skipped += 1;
          totals.ops += 1;
          continue;
        }
      }

      track(
        await applyOp(
          col,
          { [field]: { $exists: true } },
          { $unset: { [field]: "" } },
          `$unset ${field} from ${modelName}`,
          DRY_RUN,
        ),
      );
    }
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log(`\n${LINE}`);
  console.log(`  SUMMARY${DRY_RUN ? "  (DRY-RUN — no writes were made)" : ""}`);
  console.log(LINE);
  console.log(`  Total operations  : ${totals.ops}`);
  console.log(`  Total matched     : ${totals.matched} documents`);
  console.log(
    `  Total modified    : ${DRY_RUN ? "0 (dry-run)" : `${totals.modified} documents`}`,
  );
  if (!DRY_RUN) {
    console.log(
      `  Already up-to-date: ${totals.matched - totals.modified} documents`,
    );
  }
  if (totals.skipped > 0) {
    console.log(
      `  Skipped (safe)    : ${totals.skipped} operation(s) — see warnings above`,
    );
  }
  console.log(`\n  ✓  Migration ${DRY_RUN ? "preview" : "complete"}.`);
  console.log(`${LINE}\n`);

  await mongoose.disconnect();
  process.exit(0);
};

migrate().catch((err) => {
  console.error("\n✗  Migration failed:", err.message || err);
  mongoose.disconnect();
  process.exit(1);
});
