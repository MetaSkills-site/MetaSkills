# 08 - Schema Compliance & Payload Transformation Plan

## 1. Objective
Define a precise implementation plan detailing how to transform the frontend draft payload within the `bulkImportQuestions` endpoint (`controllers/quiz.controller.js`) to strictly comply with the validation requirements of the `Questions.model.js` schema.

## 2. Background & Problem Statement
According to the `SCHEMA_ANALYSIS.md` report, the Mongoose schema for Questions enforces aggressive `pre('validate')` hooks to ensure data integrity, particularly for Multiple Choice Questions (MCQ):
1. **Reference Matching Requirement**: The `correctOption` must be an exact Mongoose `ObjectId` that corresponds to one of the embedded subdocuments in the `options.mcq` array.
2. **Document Method Dependency**: The validation hook uses `this.options.mcq.id(this.correctOption)` to verify the reference. This requires the `options.mcq` array to be fully hydrated as a Mongoose DocumentArray.
3. **Frontend Payload Mismatch**: The frontend bulk draft payload naturally lacks MongoDB `ObjectId`s. It denotes the correct answer using a zero-based integer (`optionIndex`). If the payload is inserted directly without mapping, Mongoose auto-generates IDs too late, or the document methods are absent, leading to validation errors.

## 3. Transformation Strategy (Intermediary Mapping)
To achieve schema compliance, the backend must proactively generate identifiers and map references *before* handing the payload to Mongoose for creation.

### Step 1: Pre-Validation
Before attempting mapping, the controller must validate the raw payload to prevent mapping errors:
- Ensure each question has `answerType: "MCQ"`.
- Ensure `options.mcq` contains at least 2 options.
- Ensure `optionIndex` is defined and is within the bounds of `0` to `options.mcq.length - 1`.

### Step 2: Proactive ObjectId Generation
Iterate over the incoming `questions` array and perform an intermediary transformation for each question draft:
1. **Question ID**: Generate a top-level ID: `new mongoose.Types.ObjectId()`.
2. **Subdocument IDs**: Iterate through the `options.mcq` array and assign a `new mongoose.Types.ObjectId()` to the `_id` field of every option.

### Step 3: Reference Mapping (`correctOption`)
With deterministic `ObjectId`s now assigned to each MCQ option:
- Retrieve the frontend's `optionIndex`.
- Lookup the newly generated `ObjectId` at that index in the `mcq` array.
- Assign this specific `ObjectId` to the `correctOption` property on the question root.

### Step 4: Relation and Defaults Hydration
- **Module Relation**: Convert the request `moduleId` string into a `mongoose.Types.ObjectId` and inject it into the `modules` array.
- **Defaults**: Explicitly fallback `explanation`, `tags`, and `skills` to ensure the document conforms to schema shapes without relying solely on Mongoose defaults, which can sometimes behave unpredictably during bulk arrays.

### Code Implementation Spec:
```javascript
const questionDocs = questions.map((q) => {
  const qId = new mongoose.Types.ObjectId();
  
  // Proactively generate ObjectIds for each option
  const mcqWithIds = q.options.mcq.map((opt) => ({
    ...opt,
    _id: new mongoose.Types.ObjectId(),
    slate: opt.slate,
    html: opt.html || "",
  }));

  return {
    _id: qId,
    question: q.question,
    answerType: q.answerType,
    options: {
      ...q.options,
      mcq: mcqWithIds,
    },
    // Map the index to the newly generated ObjectId
    correctOption: mcqWithIds[q.optionIndex]._id,
    explanation: q.explanation || {
      slate: [{ type: "paragraph", children: [{ text: "No explanation provided" }] }],
    },
    modules: [new mongoose.Types.ObjectId(moduleId)],
    tags: q.tags || [],
    skills: q.skills || [],
    active: true,
  };
});
```

## 4. Hook Execution & Insertion Strategy
The `SCHEMA_ANALYSIS.md` specifies that the `.id()` method must exist on `this.options.mcq` during the `pre('validate')` phase.
- **Do NOT use `insertMany()`**: Mongoose's `insertMany` often bypasses complex array validations and document hydration steps to maximize performance, causing the `this.options.mcq.id()` method to be undefined during the hook.
- **Use `Question.create()`**: Pass the `questionDocs` array directly to `Question.create(questionDocs, { session })`. This ensures that each mapped object is fully hydrated into a `Question` Document with active DocumentArray prototypes, guaranteeing the validation hook has access to the `.id()` method and correctly processes the embedded subdocuments.