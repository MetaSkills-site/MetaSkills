# Testing Patterns

**Analysis Date:** 2024-05-24

## Test Framework

**Runner:**
- Custom Standalone Scripts (Node.js direct execution)
- No traditional framework (e.g., Jest, Vitest) is installed or used.
- Tests are executed manually via `node [path-to-script]`.

**Assertion Library:**
- Custom simple assertions via internal functions (e.g., `assert(condition, "message")`).
- Native Node.js throwing errors in try-catch.

**Run Commands:**
```bash
node tests/_test_feature.js  # Execute individual test scripts manually
```

## Test File Organization

**Location:**
- Test scripts are placed within a `tests/` directory (e.g., `metaskills-backend/tests/`) or ad-hoc at the project root (e.g., `_test_idempotency.js`).

**Naming:**
- Follows a strict prefix convention aligned with the project's "Test Flight" mandate: `_test_[feature].js` or `_test_[feature].ts`.

**Structure:**
```
[project-root]/
├── tests/
│   ├── _test_explanation_gen.js
│   ├── _test_explanation_timeout.js
│   └── _test_groq_gpt_oss_diag.js
├── _test_idempotency.js
```

## Test Structure

**Suite Organization:**
```javascript
// Standalone script execution format
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log("\n📋 Test 1: Feature name");
try {
  // Test logic
  assert(true, "Condition passed");
} catch (err) {
  console.log(`  ❌ FAIL: Threw unexpected error: ${err.message}`);
  failed++;
}

process.exit(failed > 0 ? 1 : 0);
```

**Patterns:**
- No automated `beforeAll`/`afterEach` setups. Setup and teardown are handled imperatively if necessary within the scripts.
- Assertions are basic booleans without advanced matchers (e.g., `assert(typeof config === "string")`).

## Mocking

**Framework:** None. 

**Patterns:**
```javascript
// Manual overriding and passing stubs to functions instead of using Jest mocks
const config = getPromptConfig("explanation_generator", {
  questionText: "What is the capital of France?",
  answerText: "Paris",
  customPrompt: "",
});
```

**What to Mock:**
- API calls and external services (e.g., NVIDIA/Gemini SDKs) are mocked manually by verifying parameter constructions rather than intercepting HTTP requests.

**What NOT to Mock:**
- Internal utility logic and synchronous builders (e.g., config generation logic) are tested as pure functions.

## Fixtures and Factories

**Test Data:**
```javascript
const mockParams = {
  questionText: "Solve 2+2",
  answerText: "4",
  customPrompt: "Be brief and use simple language",
};
```

**Location:**
- Inlined directly within the standalone test scripts. No separate fixture files are maintained.

## Coverage

**Requirements:** None enforced. 

**View Coverage:**
- Not applicable. No coverage tools are configured.

## Test Types

**Unit Tests:**
- Basic logic paths in controllers and configurations are tested via standalone script executions.

**Integration Tests:**
- Limited standalone scripts test end-to-end integration flows without hitting live databases. 

**E2E Tests:**
- Not used.

## Common Patterns

**Error Testing:**
```javascript
console.log("\n📋 Test 4: Invalid apiMode throws error");
try {
  getPromptConfig("invalid_mode", {});
  console.log(`  ❌ FAIL: Should have thrown but did not`);
  failed++;
} catch (err) {
  assert(err.message.includes("Invalid"), "error message mentions invalid mode");
}
```

---

*Testing analysis: 2024-05-24*
