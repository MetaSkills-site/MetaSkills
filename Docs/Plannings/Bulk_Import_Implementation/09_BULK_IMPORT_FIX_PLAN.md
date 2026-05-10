# Bulk Import Fix Plan

## Objective
The current `bulkImportQuestions` controller in `metaskills-backend/controllers/quiz.controller.js` strictly enforces the "MCQ" answer type and fails validation for "SA" (Short Answer) and "fillInTheBlanks" questions. This plan details the steps to modify the validation and mapping logic in `bulkImportQuestions` to properly support all schema-defined question types (`SA`, `MCQ`, `fillInTheBlanks`) and pass the `Question` model's `pre('validate')` hook.

## 1. Discrepancy Analysis

### 1.1 Schema Capabilities (`Questions.model.js`)
- **`answerType`**: Allowed values are `"SA"`, `"MCQ"`, `"fillInTheBlanks"`.
- **`MCQ` Requirements**:
  - `options.mcq` must be an array with at least 2 subdocuments.
  - `correctOption` must be the `ObjectId` of the correct `options.mcq` subdocument.
- **`SA` Requirements**:
  - `options.sa` must be a non-empty string.
  - Model hook automatically clears `options.mcq` and `correctOption`.
- **`fillInTheBlanks` Requirements**:
  - `options.fillInTheBlanks` must be a non-empty array of strings.
  - Model hook automatically clears `options.mcq`, `correctOption`, and `options.sa`.

### 1.2 Current Controller Limitations (`bulkImportQuestions`)
- **Validation**: Hardcodes `if (q.answerType !== "MCQ") { validationErrors.push(...) }`.
- **Mapping**: Always assumes `q.options.mcq` exists, maps ObjectIds, and uses `q.optionIndex` to set `correctOption`. This crashes when `q.answerType` is `SA` or `fillInTheBlanks` and `options.mcq` is undefined.

## 2. Implementation Steps for `quiz.controller.js`

### Step 2.1: Update Validation Logic
Modify the pre-transaction validation loop to switch conditionally based on `answerType`:

```javascript
  const validationErrors = [];
  const validAnswerTypes = ["SA", "MCQ", "fillInTheBlanks"];

  questions.forEach((q, index) => {
    // 1. General validation
    if (!q.question?.slate || !Array.isArray(q.question.slate) || q.question.slate.length === 0) {
      validationErrors.push(`Question ${index + 1}: missing question.slate content.`);
    }
    
    if (!validAnswerTypes.includes(q.answerType)) {
      validationErrors.push(`Question ${index + 1}: invalid answerType "${q.answerType}".`);
      return; // Skip further type-specific validation for this question
    }

    // 2. Type-specific validation
    if (q.answerType === "MCQ") {
      if (!Array.isArray(q.options?.mcq) || q.options.mcq.length < 2) {
        validationErrors.push(`Question ${index + 1}: options.mcq must have at least 2 items.`);
      } else {
        q.options.mcq.forEach((opt, optIdx) => {
          if (!opt.slate || !Array.isArray(opt.slate)) {
            validationErrors.push(`Question ${index + 1}, Option ${optIdx + 1}: missing slate content.`);
          }
        });
        if (q.optionIndex === undefined || q.optionIndex < 0 || q.optionIndex >= q.options.mcq.length) {
          validationErrors.push(`Question ${index + 1}: invalid or missing optionIndex.`);
        }
      }
    } else if (q.answerType === "SA") {
      if (!q.options?.sa || typeof q.options.sa !== 'string' || !q.options.sa.trim()) {
        validationErrors.push(`Question ${index + 1}: options.sa must be a non-empty string for SA questions.`);
      }
    } else if (q.answerType === "fillInTheBlanks") {
      if (!Array.isArray(q.options?.fillInTheBlanks) || q.options.fillInTheBlanks.length === 0) {
        validationErrors.push(`Question ${index + 1}: options.fillInTheBlanks must be a non-empty array for fillInTheBlanks questions.`);
      }
    }
  });
```

### Step 2.2: Update Document Preparation Logic
Modify the map function that prepares `questionDocs` to conditionally format `options` and `correctOption` depending on the `answerType`:

```javascript
        const questionDocs = questions.map((q) => {
          const qId = new mongoose.Types.ObjectId();
          
          let formattedOptions = {};
          let correctOption = null;

          if (q.answerType === "MCQ") {
            const mcqWithIds = q.options.mcq.map((opt) => ({
              ...opt,
              _id: new mongoose.Types.ObjectId(),
              slate: opt.slate,
              html: opt.html || "",
            }));
            formattedOptions.mcq = mcqWithIds;
            correctOption = mcqWithIds[q.optionIndex]._id;
          } else if (q.answerType === "SA") {
            formattedOptions.sa = q.options.sa;
          } else if (q.answerType === "fillInTheBlanks") {
            formattedOptions.fillInTheBlanks = q.options.fillInTheBlanks;
          }

          return {
            _id: qId,
            question: q.question,
            answerType: q.answerType,
            options: formattedOptions,
            correctOption: correctOption,
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

## 3. Testing and Verification
1. **Mock Data Generation**: Create a JSON payload containing an array of 3 questions: one `MCQ`, one `SA`, and one `fillInTheBlanks`.
2. **Execute Request**: Hit the `POST /api/quiz/bulk-import` endpoint with a valid `moduleId`.
3. **Database Assertion**: Ensure 3 documents are inserted into the `questions` collection:
   - The MCQ question must have `options.mcq` and `correctOption`.
   - The SA question must have `options.sa`, `options.mcq` as undefined/null, and `correctOption` as null.
   - The fillInTheBlanks question must have `options.fillInTheBlanks` populated.
4. **Validation Failure Assertion**: Test with an invalid `answerType`, an SA missing `options.sa`, and a fillInTheBlanks missing the array. Ensure HTTP 400 with the exact validation messages.