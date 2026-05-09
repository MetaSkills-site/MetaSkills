# Architecture Patterns

**Domain:** Bulk Question Import
**Researched:** 2024

## Recommended Architecture

The architecture should cleanly separate the physical parsing of the file from the database operations. 

```
[ Uploaded File (Text/CSV) ]
         |
         v
[ File Parser (Stream/Buffer) ] -> Extracts raw strings and maps to JSON
         |
         v
[ Validator & Mapper ] -> Verifies data schema, generates Mongoose ObjectIds, links parent Module ID.
         |
         v
[ Transaction Service ] -> Opens Mongoose Session, runs `insertMany`, updates Module, commits.
         |
         v
[ MongoDB ]
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ImportController` | Handles HTTP file upload (`multer`), invokes parser, returns success/error to client. | Express, `ParserService`, `DatabaseService` |
| `ParserService` | Takes a file buffer/path, reads it via streams, converts lines into a normalized Javascript array of Question objects. | `ImportController` |
| `DatabaseService` | Takes the validated array of Question objects, maps relationships, opens a session, executes inserts, and handles rollbacks. | `ImportController`, Mongoose |

## Patterns to Follow

### Pattern 1: Pre-generating ObjectIds
**What:** Generating database primary keys in Node.js before saving the document.
**When:** Whenever inserting bulk child documents that must be linked to a parent document in the same transaction.
**Example:**
```typescript
import mongoose from 'mongoose';

const moduleDoc = await Module.findById(moduleId);
const questionsToInsert = parsedQuestions.map(q => {
  const newId = new mongoose.Types.ObjectId();
  return {
    ...q,
    _id: newId,
    moduleId: moduleDoc._id
  };
});

// Now we know the IDs of all questions before inserting them
const questionIds = questionsToInsert.map(q => q._id);
moduleDoc.questions.push(...questionIds);
```

### Pattern 2: Multi-Document Transaction Wrapper
**What:** Mongoose's built-in transaction helper that automatically handles committing and aborting.
**When:** Performing multiple inserts/updates that must be logically bound.
**Example:**
```typescript
const session = await mongoose.startSession();

try {
  await session.withTransaction(async () => {
    // 1. Insert all questions
    await Question.insertMany(questionsToInsert, { session });
    
    // 2. Update the parent module
    await moduleDoc.save({ session });
  });
} catch (error) {
  // Transaction is automatically aborted here by withTransaction
  throw new Error('Import failed, all changes rolled back.');
} finally {
  await session.endSession();
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: The Loop-and-Save
**What:** Iterating through the parsed array and calling `save()` on each model.
**Why bad:** Creates N database roundtrips. Incredibly slow. Hard to rollback manually if item 500 fails out of 1000.
**Instead:** Use `Model.insertMany(array)` inside a single transaction.

### Anti-Pattern 2: Mixing Parsing and Database Logic
**What:** Reading a file line-by-line and inserting each line into the DB immediately as it is parsed.
**Why bad:** If a syntax error is found on line 999, you have already inserted 998 items. Rollbacks become complex if streams are left open.
**Instead:** Read and parse the *entire file* into memory (if size permits), validate it completely, and *then* pass the fully validated array to the database service.

## Scalability Considerations

| Concern | At 100 questions | At 10K questions | At 1M questions |
|---------|--------------|--------------|-------------|
| Memory | Load entire file into RAM | Still safe to load into RAM | Process with streams, use chunked transactions (e.g., commit every 1000 items) |
| Speed | Instant | Few seconds | Minutes, requires background worker (e.g., BullMQ) and progress tracking |

## Sources

- Mongoose bulk operation patterns [HIGH Confidence]
- Enterprise Node.js Architecture best practices [HIGH Confidence]