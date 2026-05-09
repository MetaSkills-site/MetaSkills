# Domain Pitfalls

**Domain:** Bulk Question Import
**Researched:** 2024

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Attempting Transactions on a Standalone MongoDB Instance
**What goes wrong:** Calling `mongoose.startSession()` and `session.startTransaction()` throws an error in local development environments.
**Why it happens:** MongoDB strictly requires a Replica Set for multi-document transactions. Default local MongoDB installs run as Standalone nodes.
**Consequences:** The entire import feature crashes, blocking testing and development.
**Prevention:** Configure the local MongoDB Docker container or native install to run as a single-node Replica Set (using `--replSet` flag and `rs.initiate()`).
**Detection:** `MongoServerError: Transaction numbers are only allowed on a replica set member or mongos`.

### Pitfall 2: Memory Bloat During Parsing
**What goes wrong:** The Node.js application crashes with an Out-of-Memory (OOM) error when importing a large document.
**Why it happens:** Using `fs.readFileSync` on a massive file or holding 10,000 parsed Mongoose objects in memory before insertion.
**Consequences:** The backend server crashes, disrupting other users.
**Prevention:** Use Node.js streams (`fs.createReadStream`) combined with a chunked parser. If the file is reasonably sized (< 10MB), in-memory parsing is acceptable. Otherwise, enforce file size limits at the upload layer.
**Detection:** `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`.

## Moderate Pitfalls

### Pitfall 1: Unhandled Asynchronous Execution in Loops
**What goes wrong:** Calling `await Question.create()` inside a standard `forEach` loop.
**Prevention:** Node.js `forEach` does not await promises. Use a `for...of` loop for sequential execution, or map the data and use `Model.insertMany(data, { session })` for vastly superior performance.

### Pitfall 2: Losing Hierarchical Context
**What goes wrong:** Questions are imported, but not linked to their parent Module.
**Prevention:** Pre-generate ObjectIds (`new mongoose.Types.ObjectId()`) for the child questions in memory, map them into an array, push that array to the parent Module's `questions` field, and execute both updates within the same transaction.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Parsing | Regex catastrophic backtracking | Write strict, constrained Regex or use established parsers (like `csv-parser`). |
| Database | Partial inserts on failure | Wrap the `insertMany` and Module update logic inside a Mongoose `withTransaction` block. |

## Sources

- Mongoose Transactions Documentation [HIGH Confidence]
- Node.js Performance Guidelines [HIGH Confidence]