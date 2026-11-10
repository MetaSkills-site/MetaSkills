import Passages from "../models/Passages.model.js";

// Helper to extract text from Slate JSON nodes
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
