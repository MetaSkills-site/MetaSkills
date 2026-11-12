/**
 * @file eslint.config.js
 * @description Configuration file for ESLint flat config setting up linting rules, environments, and plugins for the React frontend application.
 * @architecture Defines static code analysis standards across browser and Node.js environments within the frontend build pipeline.
 * @agent_note When modifying rules, ensure compatibility with ESLint flat config format and verify that Node-specific scripts remain in the node globals list.
 */

import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["dist/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      js,
      "react-hooks": pluginReactHooks,
    },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: { globals: globals.browser },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: [
      ".agent/skills/reddit-scraper/examples/cli.js",
      "refactor.cjs",
      "tests/test_slateUtils.mjs",
      "*.js",
      "*.cjs",
    ],
    languageOptions: { globals: globals.node },
  },
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
    },
  },
]);
