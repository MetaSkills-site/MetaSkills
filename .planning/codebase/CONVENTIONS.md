# Coding Conventions

**Analysis Date:** 2024-05-24

## Naming Patterns

**Files:**
- Backend Controllers: `[name].controller.js` (e.g., `user.controller.js`)
- Backend Models: `[Name].model.js` or `[name].model.js` (e.g., `ContextAttachments.model.js`, `user.model.js`)
- Backend Routes: `[name].routes.js` (e.g., `backup.routes.js`)
- Frontend Components: PascalCase `[Name].jsx` (e.g., `AnswerCreator.jsx`, `AudioWord.jsx`)
- Frontend Contexts: PascalCase `[Name]Context.jsx` or `[Name]Provider.jsx` (e.g., `EditorContext.jsx`, `SessionProvider.jsx`)
- Frontend Utils: camelCase `[name].js` or `[name].jsx` (e.g., `cacheUtils.js`, `adminUtils.jsx`)

**Functions:**
- camelCase is generally used for function names (e.g., `getErrorMessage`, `getPromptConfig`).

**Variables:**
- camelCase for instances and standard variables.
- PascalCase for React component definitions and class/model instantiations.

**Types:**
- Plain JavaScript is used (no TypeScript), so explicit type naming is not applicable.

## Code Style

**Formatting:**
- Prettier
- Default settings (empty `.prettierrc` file).

**Linting:**
- ESLint (Flat Config via `eslint.config.js`)
- Uses `@eslint/js` recommended rules.
- Frontend React rules: `react/prop-types`, `react-in-jsx-scope`, and `react/jsx-uses-react` are disabled (`"off"`).

## Import Organization

**Order:**
1. Imports are largely unorganized.
2. Standard practice observed is Node built-ins/NPM packages mixed with local relative imports.
3. No strict ordering or path aliases are enforced (e.g., relative paths like `../models/user.model.js` and `../../utils/slateUtils` are used).

**Path Aliases:**
- None detected. Relative paths are used universally.

## Error Handling

**Patterns:**
- **Backend:** 
  - Standard `try...catch` blocks within controllers.
  - Usage of `express-async-handler` to handle async promise rejections gracefully without wrapping everything in try/catch.
  - Centralized Express error middleware (`middlewares/errorHandler.js`) that intercepts errors and sends JSON responses with HTTP status codes.
  - Database error parsing via custom helpers (`helpers/dbErrorHandler.js`) to extract readable messages (e.g., unique constraints).
- **Frontend:**
  - Standard `try...catch` in async functions (like API calls).
  - Errors are typically logged directly to the console (`console.error`).

## Logging

**Framework:** `console`

**Patterns:**
- Widespread use of `console.log`, `console.warn`, and `console.error` directly in source code.
- No external logging framework (like Winston or Pino) is used.
- Logging is commonly used in `catch` blocks before responding with error messages.

## Comments

**When to Comment:**
- Comments are mostly used for disabled linter rules (e.g., `// eslint-disable-next-line`) and describing complex manual logic or unique regex/string manipulations.

**JSDoc/TSDoc:**
- Minimal usage. Used occasionally for top-of-file descriptions (e.g., in test scripts) but not systematically enforced on functions.

## Function Design

**Size:** Unenforced. Some controller functions handling analytics and auth are quite long.

**Parameters:** Standard JS arguments; object destructuring is commonly used for options/configurations.

**Return Values:** 
- Backend typically returns standard Express JSON (`res.json()`).
- Frontend hooks/utils return arrays (for destructuring) or plain objects.

## Module Design

**Exports:** 
- ESM export syntax is prevalent (`export default`, `export const`).
- Mixed usage of `module.exports` only in isolated legacy config or CJS scripts (`.cjs`).

**Barrel Files:** 
- Not typically used; files import directly from the target file path.

---

*Convention analysis: 2024-05-24*
