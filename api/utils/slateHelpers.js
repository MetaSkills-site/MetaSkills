/**
 * @file slateHelpers.js
 * @description Provides helper functions to process and extract data from Slate JSON structures.
 * @architecture Acts as a pure utility for Slate editor content processing across the backend.
 */
/**
 * Recursively extracts image URLs from a Slate JSON structure.
 * @param {Array|Object} nodes - The Slate nodes to traverse.
 * @returns {Array<string>} - An array of unique image URLs found in the nodes.
 */
export const extractImages = (nodes) => {
  const images = new Set();

  const traverse = (node) => {
    if (!node) return;

    // Check if the node is an array of nodes
    if (Array.isArray(node)) {
      node.forEach(traverse);
      return;
    }

    // Check if the node is an image
    if (node.type === "image" && node.url) {
      images.add(node.url);
    }

    // Recursively check children
    if (node.children) {
      traverse(node.children);
    }
  };

  traverse(nodes);
  return Array.from(images);
};
