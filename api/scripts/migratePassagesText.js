/**
 * @file migratePassagesText.js
 * @description Converts legacy Slate JSON rich text structures in Passages into simplified plain text strings.
 * @architecture Part of the database maintenance script layer standardizing passage content formats for simplified querying and presentation.
 * @agent_note Exported as an asynchronous runnable function and does not automatically connect to or disconnect from MongoDB.
 */

import Passages from "../models/Passages.model.js";

/**
 * @desc Recursively traverses Slate JSON node trees to extract and concatenate text leaves into a plain text string.
 * @param {Array<Object>} nodes - Array of Slate JSON nodes.
 * @returns {string} Concatenated plain text from all child nodes.
 */
const extractText = (nodes) => {
  if (!nodes) return "";
  return nodes
    .map((node) => {
      if (node.text) return node.text;
      if (node.children) return extractText(node.children);
      return "";
    })
    .join(" ");
};

/**
 * @desc Finds passage documents with object or array text formats and updates them to plain text strings.
 * @returns {Promise<{success: boolean, updatedCount: number, errors: number}>} Migration execution outcome and counts.
 */
export const run = async () => {
  console.log(
    "Starting migration: Convert Slate JSON to Plain Text for Passages...",
  );

  const passages = await Passages.find({});
  let updatedCount = 0;
  let errors = 0;

  for (const passage of passages) {
    try {
      // Check if text is likely an object/Slate structure (legacy)
      // Mongoose Mixed might return it as object.
      // If it's already a string, skip.

      // Check if it has 'slate' property inside text (standard generic structure we used)
      // OR checks if it is just a direct array of nodes

      let plainText = "";
      let needsUpdate = false;

      if (typeof passage.text === "string") {
        // Already string, check if it looks like serialized JSON?
        // No, model update doesn't auto-convert existing docs unless saved.
        continue;
      } else if (passage.text && passage.text.slate) {
        // Structure: { slate: [...], html: "..." }
        plainText = extractText(passage.text.slate);
        needsUpdate = true;
      } else if (Array.isArray(passage.text)) {
        // Direct Slate array
        plainText = extractText(passage.text);
        needsUpdate = true;
      } else if (typeof passage.text === "object") {
        // Unknown object, try json stringify or empty
        console.warn(
          `Passage ${passage._id} has unknown object text format. Skipping.`,
        );
        continue;
      }

      if (needsUpdate) {
        // Update directly to the string
        await Passages.updateOne(
          { _id: passage._id },
          { $set: { text: plainText } },
        );
        updatedCount++;
      }
    } catch (err) {
      console.error(`Failed to migrate passage ${passage._id}:`, err);
      errors++;
    }
  }

  console.log(
    `Migration complete. Updated: ${updatedCount}, Errors: ${errors}, Skipped: ${passages.length - updatedCount - errors}`,
  );
  return { success: true, updatedCount, errors };
};
