/**
 * @file scripts.registry.js
 * @description Registry for available maintenance and migration scripts.
 * @architecture Acts as a secure whitelist mapping script keys to their executable files, preventing unauthorized execution.
 */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base paths
const ROOT_DIR = path.resolve(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT_DIR, "migrations");

// Registry object mapping script keys to absolute paths
// This whitelist ensures security so arbitrary files cannot be executed
/**
 * @constant {Object} SCRIPTS_REGISTRY
 * @description Whitelist object mapping script keys to their metadata and absolute paths.
 */
export const SCRIPTS_REGISTRY = {
  // Database Migrations
  "active-field-migration": {
    name: "Migrate Active Fields & Defaults",
    path: path.join(MIGRATIONS_DIR, "migrateActiveField.js"),
    description:
      "Backfills active, rating, notification type, and session createdAt fields.",
  },
  "module-completion-migration": {
    name: "Initialize Module Completion Status",
    path: path.join(MIGRATIONS_DIR, "updateModulesIsComplete.js"),
    description: "Backfills isComplete field to false for all modules.",
  },
  // Maintenance Scripts
  "cleanup-pending-uploads": {
    name: "Cleanup Pending Uploads",
    path: path.join(ROOT_DIR, "scripts", "cleanupUploads.js"),
    description:
      'Scans GCS for stale files marked as "pending" > 1 hour and deletes them.',
  },
  "migrate-passages-text": {
    name: "Migrate Passages to Plain Text",
    path: path.join(ROOT_DIR, "scripts", "migratePassagesText.js"),
    description:
      "Converts legacy Slate JSON content in Passages to plain text strings.",
  },
  "migrate-candies-carrots": {
    name: "Migrate Candies to Carrots",
    path: path.join(ROOT_DIR, "scripts", "migrateCandiesToCarrots.js"),
    description:
      "Migrates the legacy 'candies' field to the new 'carrots' field for all users.",
  },

  // Schema Cleanup Migrations
  "post-analytics-fix-migration": {
    name: "Post-Analytics-Fix Schema Cleanup",
    path: path.join(MIGRATIONS_DIR, "migratePostAnalyticsFix.js"),
    description:
      "Removes the legacy 'difficulty' field from Questions (replaced by 'rating'), seeds 'skills:[]' on Questions missing the field, seeds 'rating:1200' ELO on Users missing the field, and removes orphaned 'candies'/'progress' fields from Users. Always applies immediately and reports per-operation results.",
  },
  "migrate-carrots-history": {
    name: "Migrate Carrots to Object History",
    path: path.join(ROOT_DIR, "scripts", "migrateCarrotsObject.js"),
    description:
      "Migrates the 'carrots' field from a Number to an Object structure {count, lastdate, history} for tracking 7-day history.",
  },
  "migrate-vocab-srs": {
    name: "Initialize Vocab SRS Ratings",
    path: path.join(MIGRATIONS_DIR, "migrateVocab.js"),
    description:
      "Backfills 'rating' on Vocabulary items and 'vocabRating' on Users if they are missing to support the new SRS Elo system.",
  },
  "migrate-passage-rating": {
    name: "Initialize Passage Ratings",
    path: path.join(MIGRATIONS_DIR, "migratePassageRating.js"),
    description:
      "Backfills 'rating' on Passages/Sentences missing the field to support the Elo rating system.",
  },
  "remove-order-property": {
    name: "Remove Order Property from Collections",
    path: path.join(MIGRATIONS_DIR, "removeOrderProperty.js"),
    description:
      "Safely runs `updateMany` via `$unset` to strip the deprecated 'order' object property from Modules and Questions collections without deleting documents.",
  },
};
