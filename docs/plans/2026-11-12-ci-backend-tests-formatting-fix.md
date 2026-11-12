# CI Backend Test Suite & Code Hygiene Remediation Implementation Plan

**Goal:** Fix GitHub Actions CI failures in `Backend Test Suite` (`pnpm run test:api`) and `Code Hygiene & Documentation` (`pnpm run format:check`) by establishing robust test environment isolation, fallback environment defaults, CI workflow environment parity, and Prettier code style compliance.

**Architecture:** Implement defensive test configuration and process environment hygiene across three concentric layers: CI workflow configuration (`ci.yml`), global Jest test harness (`setup.js`), and individual test suite isolation lifecycle hooks (`admin.auth.controller.test.js` and `architecture_auth_audit.test.js`). Concurrently reformat the 3 modified frontend files using Prettier.

**Tech Stack:** Node.js, Express, Jest (ESM / VM Modules), Supertest, GitHub Actions, Prettier, pnpm.

---

## Root Cause Analysis

1. **Missing Environment Variables in CI:**
   - `.env` is gitignored and absent in the GitHub Actions runner.
   - `.github/workflows/ci.yml` sets `NODE_ENV: test`, `MONGODB_URI`, `JWT_SECRET`, and `PORT` for the `test-backend` job, but does not provide `GOOGLE_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID`.
2. **Missing Test Fallback in Setup:**
   - `api/tests/setup.js` sets `process.env.JWT_SECRET` but omits fallback defaults for `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.
3. **Environment Pollution in In-Band Test Runs:**
   - In `api/tests/controllers/admin.auth.controller.test.js`, the test `"should return 500 if Google Client ID is missing"` calls:
     ```javascript
     delete process.env.VITE_GOOGLE_CLIENT_ID;
     delete process.env.GOOGLE_CLIENT_ID;
     ```
   - Its `afterEach` hook restores mocks (`jest.restoreAllMocks()`) but does NOT restore `process.env`.
   - Because Jest runs in-band (`--runInBand`), all tests execute sequentially in the exact same Node process, leaking the deleted environment variables to subsequent test files.
4. **Vulnerable Audit Test Suite:**
   - `api/tests/architecture_auth_audit.test.js` invokes `adminAuthController.googleAuth` and `checkAuth`, which throw `Error: Server configuration error: Google Client ID is missing.` when `GOOGLE_CLIENT_ID` is missing from `process.env`.
5. **Code Style Inconsistencies:**
   - 3 frontend files (`web/src/components/admin/ContextSelector.jsx`, `web/src/components/admin/QuestionInfoModal.jsx`, and `web/src/pages/ErrorReportPage.jsx`) contain unformatted line breaks from recent commits, triggering failure in `pnpm run format:check`.

---

## Phased Implementation Plan

### Phase 1: Environment Isolation in `admin.auth.controller.test.js` (TDD)

Prevent environment mutations in `admin.auth.controller.test.js` from polluting the global process environment during `--runInBand` test runs.

**Files:**
- Modify: `api/tests/controllers/admin.auth.controller.test.js`

#### Step 1.1: Write failing test / seam verification
In `api/tests/controllers/admin.auth.controller.test.js`, add a test in the `Unit Tests` describe block immediately after `"should return 500 if Google Client ID is missing"` asserting that environment variables are restored:
```javascript
it("should ensure process.env is restored after env mutation tests", () => {
  expect(process.env.VITE_GOOGLE_CLIENT_ID).toBeDefined();
});
```

#### Step 1.2: Run test to observe failure without restoration
```bash
pnpm --filter ./api exec cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/controllers/admin.auth.controller.test.js -t "should ensure process.env is restored"
```
*Expected Output:* Test fails if `process.env.VITE_GOOGLE_CLIENT_ID` remains undefined following deletion.

#### Step 1.3: Implement `originalEnv` capture and restoration
In `api/tests/controllers/admin.auth.controller.test.js`:
1. In `describe("Unit Tests")`:
   ```javascript
   let originalEnv;

   beforeEach(() => {
     originalEnv = { ...process.env };
     jest.clearAllMocks();

     verifySpy = jest.spyOn(OAuth2Client.prototype, "verifyIdToken");
     process.env.VITE_GOOGLE_CLIENT_ID = "test-client-id";
     process.env.JWT_SECRET = "testsecret";
   });

   afterEach(() => {
     for (const key of Object.keys(process.env)) {
       if (!(key in originalEnv)) {
         delete process.env[key];
       }
     }
     Object.assign(process.env, originalEnv);
     jest.restoreAllMocks();
   });
   ```
2. In `describe("Integration Tests")`:
   ```javascript
   let originalEnv;

   beforeEach(async () => {
     originalEnv = { ...process.env };
     await Admin.deleteMany({});
     await Session.deleteMany({});
     jest.clearAllMocks();

     verifySpy = jest.spyOn(OAuth2Client.prototype, "verifyIdToken");
     process.env.VITE_GOOGLE_CLIENT_ID = "test-client-id";
     process.env.JWT_SECRET = "testsecret";
   });

   afterEach(() => {
     for (const key of Object.keys(process.env)) {
       if (!(key in originalEnv)) {
         delete process.env[key];
       }
     }
     Object.assign(process.env, originalEnv);
     jest.restoreAllMocks();
   });
   ```

#### Step 1.4: Verify tests pass
```bash
pnpm --filter ./api exec cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/controllers/admin.auth.controller.test.js
```
*Expected Output:* All Unit and Integration tests PASS.

---

### Phase 2: Global Fallback Test Defaults in `api/tests/setup.js` (TDD)

Ensure every test in the backend test suite receives reliable fallback defaults for Google Client credentials without depending on the presence of a local `.env` file.

**Files:**
- Modify: `api/tests/setup.js`

#### Step 2.1: Write seam verification
Verify that when `setup.js` runs in an environment where `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` are not preset, it initializes them to safe default testing strings.

#### Step 2.2: Implement fallback initialization in `api/tests/setup.js`
In `api/tests/setup.js`, update lines 5-6:
```javascript
process.env.JWT_SECRET = process.env.JWT_SECRET || "supersecret_for_testing";
process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || "test-google-client-id";
process.env.VITE_GOOGLE_CLIENT_ID =
  process.env.VITE_GOOGLE_CLIENT_ID || "test-google-client-id";
```

#### Step 2.3: Verify global environment setup
Run:
```bash
pnpm --filter ./api exec cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/controllers/admin.auth.controller.test.js
```
*Expected Output:* PASS.

---

### Phase 3: Explicit Suite Isolation in `api/tests/architecture_auth_audit.test.js` (TDD)

Make `architecture_auth_audit.test.js` completely resilient against any preceding test suite side-effects.

**Files:**
- Modify: `api/tests/architecture_auth_audit.test.js`

#### Step 3.1: Write failing test assertion
Simulate missing environment before `architecture_auth_audit.test.js` runs to confirm that without self-managed lifecycle hooks, it would fail.

#### Step 3.2: Implement lifecycle hooks in `api/tests/architecture_auth_audit.test.js`
In `api/tests/architecture_auth_audit.test.js`:
Add `beforeAll`, `beforeEach`, and `afterAll` hooks to manage environment variables:
```javascript
describe("Architecture Auth Audit Fixes", () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || "test-google-client-id";
    process.env.VITE_GOOGLE_CLIENT_ID =
      process.env.VITE_GOOGLE_CLIENT_ID || "test-google-client-id";
  });

  afterAll(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || "test-google-client-id";
    process.env.VITE_GOOGLE_CLIENT_ID =
      process.env.VITE_GOOGLE_CLIENT_ID || "test-google-client-id";

    await Admin.deleteMany({});
    await Session.deleteMany({});
    await User.deleteMany({});
    await Module.deleteMany({});
    await Sequence.deleteMany({});
    jest.clearAllMocks();
  });
```

#### Step 3.3: Verify the pair runs in-band without leakage
Run:
```bash
pnpm --filter ./api exec cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/controllers/admin.auth.controller.test.js tests/architecture_auth_audit.test.js --runInBand
```
*Expected Output:* Both test suites PASS.

---

### Phase 4: CI Workflow Pipeline Configuration Parity

Configure the CI runner environment in `.github/workflows/ci.yml` so that environment variables match the expectations of backend services.

**Files:**
- Modify: `.github/workflows/ci.yml`

#### Step 4.1: Update `test-backend` job environment
In `.github/workflows/ci.yml`, add `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` under `jobs.test-backend.env`:
```yaml
    env:
      NODE_ENV: test
      MONGODB_URI: mongodb://127.0.0.1:27017/metaskills_test
      JWT_SECRET: ci_secret_for_jwt_testing_purposes_only
      PORT: 7860
      GOOGLE_CLIENT_ID: test_google_client_id_for_ci
      VITE_GOOGLE_CLIENT_ID: test_google_client_id_for_ci
```

#### Step 4.2: Verify YAML syntax
Validate YAML structure and verify file diff matches expected structure.

---

### Phase 5: Code Hygiene & Formatting Remediation

Fix Prettier code formatting on the 3 flagged web files.

**Files:**
- Modify: `web/src/components/admin/ContextSelector.jsx`
- Modify: `web/src/components/admin/QuestionInfoModal.jsx`
- Modify: `web/src/pages/ErrorReportPage.jsx`

#### Step 5.1: Execute Prettier Write
Run:
```bash
pnpm --filter ./web exec prettier --write src/components/admin/ContextSelector.jsx src/components/admin/QuestionInfoModal.jsx src/pages/ErrorReportPage.jsx
```

#### Step 5.2: Verify Format Check Passes
Run:
```bash
pnpm run format:check
```
*Expected Output:*
`All matched files use Prettier code style!`
Exit code: 0.

---

### Phase 6: Full Comprehensive Verification

Run all repository quality gates to guarantee CI will pass cleanly.

#### Step 6.1: Run Code Hygiene Checks
```bash
pnpm run lint
pnpm run format:check
pnpm run check:docs
```
*Expected Output:* All three scripts succeed with exit code 0.

#### Step 6.2: Run Backend Test Suite
```bash
pnpm run test:api
```
*Expected Output:* All test suites pass.

---

## Acceptance Criteria by Phase

| Phase | Target Area | Acceptance Criteria |
|---|---|---|
| **Phase 1** | `admin.auth.controller.test.js` | Mocks and `process.env` mutations are restored in `afterEach`. Deleting env vars in one test does not affect subsequent tests in the same process. |
| **Phase 2** | `api/tests/setup.js` | Defaults for `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and `VITE_GOOGLE_CLIENT_ID` are guaranteed whenever not already defined. |
| **Phase 3** | `architecture_auth_audit.test.js` | Suite sets up its own Google Client ID fixtures in `beforeAll`/`beforeEach` and cleans up in `afterAll`. Both Phase 1 tests pass consistently. |
| **Phase 4** | `.github/workflows/ci.yml` | `test-backend` job declares `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`. |
| **Phase 5** | Web formatting | Prettier formats `ContextSelector.jsx`, `QuestionInfoModal.jsx`, and `ErrorReportPage.jsx`. `pnpm run format:check` exits with 0. |
| **Phase 6** | End-to-End Verification | `pnpm run lint`, `pnpm run format:check`, `pnpm run check:docs`, and `pnpm run test:api` all pass with zero errors. |
