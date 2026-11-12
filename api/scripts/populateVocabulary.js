/**
 * @file populateVocabulary.js
 * @description Seeds the Vocabulary database with words and definitions fetched from external Datamuse and Dictionary APIs.
 * @architecture Part of the administrative data seeding pipeline populating content for vocabulary practice and SRS quizzes.
 * @agent_note Uses external network requests with a 50ms pacing delay to respect API rate limits and silently skips existing duplicate words.
 */

import mongoose from "mongoose";
import "../config/env.js";
import Vocabulary from "../models/Vocabulary.model.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/metaskills";

// Connect to MongoDB
/**
 * @desc Establishes a connection to MongoDB using the configured URI.
 * @returns {Promise<void>} Resolves when connection succeeds or exits process on failure.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ MongoDB connected successfully");
  } catch (err) {
    console.error(
      "✗ MongoDB connection failed: Error connecting to the vocab db",
      err,
    );
    process.exit(1);
  }
};

// Fetch words from Datamuse API
/**
 * @desc Queries the Datamuse API to fetch candidate vocabulary words starting with a given letter.
 * @param {string} letter - Single alphabet letter prefix to query.
 * @returns {Promise<string[]>} List of fetched vocabulary words.
 */
const fetchWordsFromDatamuse = async (letter) => {
  const pattern = `${letter}??????*`;
  const url = `https://api.datamuse.com/words?sp=${pattern}&md=d&max=50`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Datamuse API returned ${response.status}`);
    }
    const data = await response.json();
    return data.map((entry) => entry.word);
  } catch (error) {
    console.error(
      `✗ Error fetching words for letter '${letter}':`,
      error.message,
    );
    return [];
  }
};

// Fetch definition from Dictionary API
/**
 * @desc Fetches the primary definition of a word from the Free Dictionary API.
 * @param {string} word - The vocabulary word to look up.
 * @returns {Promise<string|null>} The first found definition string, or null if not found.
 */
const fetchDefinition = async (word) => {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null; // No definition found
    }
    const data = await response.json();

    // Extract the first valid definition
    if (data && data.length > 0) {
      const entry = data[0];
      if (entry.meanings && entry.meanings.length > 0) {
        for (const meaning of entry.meanings) {
          if (meaning.definitions && meaning.definitions.length > 0) {
            const def = meaning.definitions[0].definition;
            if (def) {
              return def;
            }
          }
        }
      }
    }
    return null;
  } catch {
    return null; // Failed to fetch
  }
};

// Store word-definition pair in database
/**
 * @desc Inserts a word and its definition into the Vocabulary collection.
 * @param {string} word - Vocabulary word.
 * @param {string} definition - Dictionary definition.
 * @returns {Promise<boolean>} Resolves to true if saved, or false if duplicate or failed.
 */
const storeVocabulary = async (word, definition) => {
  try {
    await Vocabulary.create({ word, definition });
    return true;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error (word already exists)
      return false;
    }
    console.error(`✗ Error storing '${word}':`, error.message);
    return false;
  }
};

// Main population function
/**
 * @desc Iterates through the alphabet to fetch words, query definitions, and insert new vocabulary records.
 * @returns {Promise<void>} Resolves when all letters are processed.
 */
const populateVocabulary = async () => {
  console.log("\n🚀 Starting vocabulary population...\n");

  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Process each letter
  for (const letter of alphabet) {
    console.log(
      `\n📝 Processing words starting with '${letter.toUpperCase()}'...`,
    );

    // Fetch words for this letter
    const words = await fetchWordsFromDatamuse(letter);
    console.log(`   Found ${words.length} words from Datamuse`);

    if (words.length === 0) {
      console.log(`   ⚠ Skipping letter '${letter}' (no words found)`);
      continue;
    }

    // Process each word
    for (const word of words) {
      // Fetch definition
      const definition = await fetchDefinition(word);

      if (!definition) {
        totalFailed++;
        continue; // Skip words without definitions
      }

      // Store in database
      const stored = await storeVocabulary(word, definition);

      if (stored) {
        totalAdded++;
        process.stdout.write(`   ✓ Added: ${word}\n`);
      } else {
        totalSkipped++;
        // Silently skip duplicates
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Vocabulary population complete!");
  console.log("=".repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   • Words added: ${totalAdded}`);
  console.log(`   • Words skipped (duplicates): ${totalSkipped}`);
  console.log(`   • Words failed (no definition): ${totalFailed}`);
  console.log(
    `   • Total processed: ${totalAdded + totalSkipped + totalFailed}`,
  );
  console.log("=".repeat(50) + "\n");
};

// Run the script
/**
 * @desc Top-level script runner connecting to the database, invoking population, and disconnecting.
 * @returns {Promise<void>} Resolves when the script terminates successfully.
 */
const run = async () => {
  await connectDB();
  await populateVocabulary();
  await mongoose.connection.close();
  console.log("✓ Database connection closed\n");
  process.exit(0);
};

run();
