# Codebase Concerns

**Analysis Date:** 2024-05-30

## Tech Debt

**[Data Layer / Schema Definitions]:**
- Issue: Heavy reliance on Mongoose `pre('validate')` hooks and manual controller logic for data validation instead of a dedicated validation library (e.g., Zod, Joi).
- Files: `metaskills-backend/models/Questions.model.js`, `metaskills-backend/controllers/quiz.controller.js`
- Impact: Malformed data (like missing options for MCQs) fails late at the database layer rather than at the API boundary. This makes error reporting for bulk operations difficult and leads to fragmented validation logic.
- Fix approach: Introduce Zod or Joi schemas at the route/controller level to strictly validate incoming bulk question payloads before interacting with the database.

**[Large Mongoose Transactions]:**
- Issue: The `createQuestion` logic uses `session.withTransaction()` to ensure atomic updates between `Question` and `Module` documents.
- Files: `metaskills-backend/controllers/quiz.controller.js`
- Impact: If this controller logic is reused in a loop for bulk imports, it will create massive transaction overhead. Wrapping a bulk import of thousands of questions in a single MongoDB transaction could exceed transaction time or size limits, causing the entire import to fail.
- Fix approach: Implement a dedicated `bulkImportQuestions` function that uses `Model.insertMany()` and bulkWrite operations for updating the related `Module` arrays, rather than individual transactions.

## Structural Concerns for Bulk Import

**[Rich Text (Slate.js) Data Structure]:**
- Problem: The `question`, `options.mcq`, and `explanation` fields store data in Slate.js JSON array format (`{ slate: mongoose.Schema.Types.Mixed }`). 
- Files: `metaskills-backend/models/Questions.model.js`
- Cause: The frontend relies on a rich text editor. A plain text-file or CSV import feature will only provide flat strings.
- Improvement path: The bulk import feature must include a robust parser that converts plain text (or markdown-like text) into the deeply nested Slate.js JSON node structure required by the database. Otherwise, the frontend editor will crash when attempting to render plain strings.

**[Complex Subdocument ObjectId Referencing for MCQs]:**
- Files: `metaskills-backend/models/Questions.model.js`
- Why fragile: MCQ questions require each option to have an auto-generated `_id`, and the `correctOption` field must precisely match one of these subdocument `_id`s. 
- Safe modification: A bulk import script cannot simply pass `correctOption: 'A'`. It must dynamically generate ObjectIds for each option during parsing, assign them to the `mcq` array, and map the correct option's ObjectId to the `correctOption` field *before* inserting into the database.
- Test coverage: Ensure unit tests validate the bulk parser's ability to accurately assign and cross-reference these ObjectIds.

## Scaling Limits

**[Many-to-Many Array Unbounded Growth]:**
- Current capacity: The database handles single question insertions effectively using `$addToSet`.
- Limit: `Module.model.js` stores an array of `questionIds`. MongoDB has a 16MB document limit. If a module accumulates tens of thousands of questions via bulk import, the `Module` document will hit the BSON size limit and degrade read performance.
- Scaling path: Consider paginating the relationship or reversing it entirely so that only `Question` stores the `moduleId`, removing the `questionIds` array from `Module` if bulk imports lead to massive modules.

## Known Bugs

- Not directly identified in data layer logic, but implicit bug risk if `correctOption` reference is orphaned during bulk inserts bypassing standard controller logic.
