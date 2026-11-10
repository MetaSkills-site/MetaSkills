import mongoose from "mongoose";
import "../config/env.js";
import Vocabulary from "../models/Vocabulary.model.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/metaskills";

// Connect to MongoDB
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
const run = async () => {
  await connectDB();
  await populateVocabulary();
  await mongoose.connection.close();
  console.log("✓ Database connection closed\n");
  process.exit(0);
};

run();
