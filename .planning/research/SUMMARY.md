# Research Summary: Hybrid Manual/Automated Bulk Question Import

## Executive Summary

The proposed workflow introduces a hybrid manual/automated approach for bulk question import, utilizing Tesseract.js to extract text from PDFs. Unlike fully automated backend parsers, this approach parses the raw text into a frontend "preview state" before any database insertion. This intermediate step shifts the burden of complex formatting—specifically converting flat strings into the required Slate.js JSON structure and resolving internal ObjectIds for multiple-choice options—away from a rigid backend parser. 

Instead, admins manually review, augment (adding answers, explanations, images), and format the content using the existing frontend editor. This directly mitigates significant backend concerns around parsing fragile PDFs and structuring complex Mongoose schemas, ensuring data integrity before committing via an all-or-nothing transaction. Ultimately, this approach turns a notoriously brittle process (automated PDF parsing) into a robust, human-in-the-loop workflow.

## Key Findings

**From STACK.md:**
- Node.js (>=18.x) and Mongoose (>=6.x) with a MongoDB Replica Set are required for robust multi-document transactions using `insertMany`.
- Transactions are crucial for maintaining an "all-or-nothing" import strategy.

**From FEATURES.md:**
- Table stakes include all-or-nothing import, strict validation, and error reporting. 
- The proposed "preview state" functions as a superior "dry run" differentiator, allowing admins to review and correct issues before saving.

**From ARCHITECTURE.md:**
- Architecture must cleanly separate parsing from DB operations. 
- The user's workflow adapts this by moving the initial parsing phase to the frontend (Tesseract.js) and using the frontend editor as the validation and mapping layer, sending clean JSON to the backend.

**From PITFALLS.md:**
- Key pitfalls include memory bloat and transactional failures on standalone DBs. 
- The frontend preview limits payload size per batch and ensures clean data reaches the backend, preventing failed transactions and memory exhaustion.

**From FEASIBILITY.md & CONCERNS.md:**
- Backend parsing of PDFs is difficult and error-prone, but Tesseract.js combined with manual admin review bypasses the unreliability of automated extraction.
- **Slate.js and ObjectId Mitigation:** The backend requires a complex Slate.js JSON structure for text fields and dynamically generated `ObjectId`s for multiple-choice options. The "preview state" mitigates this because the frontend editor natively understands how to generate the deeply nested `Slate.js` JSON. When finalized, the frontend structures the payload correctly, pre-generating `ObjectId`s before sending a schema-compliant array to the backend.
- **Role of the Frontend Editor:** Tesseract outputs flat strings. The frontend editor acts as the crucial mapping layer. Admins manually tag answers, add explanations, and insert images. The editor's serialization process transforms this augmented state into the strict Mongoose schema format, bypassing the need for a brittle backend parser to infer complex relationships.

## Implications for Roadmap

Suggested phases: 3

1. **Phase 1: PDF OCR & Frontend Preview Integration** — Implement Tesseract.js in the frontend to extract raw text from uploaded PDFs and render it into the frontend editor's "preview state." *Rationale: Directly tackles the PDF parsing feasibility issue by utilizing OCR and keeping unvalidated data out of the backend.*
2. **Phase 2: Editor Augmentation & Mapping** — Enable admins to modify previewed questions, add explanations/images via the UI, and ensure the frontend correctly serializes data into the required `Slate.js` JSON and pre-generates `ObjectId`s. *Rationale: Solves the complex Mongoose schema requirements (Slate.js/ObjectIds) by leveraging existing frontend editor logic.*
3. **Phase 3: Backend Bulk Transaction** — Develop the backend `ImportController` and `DatabaseService` to receive the fully formatted JSON payload, perform strict Zod/Joi validation, and execute a multi-document Mongoose transaction using `insertMany`. *Rationale: Ensures ACID compliance, all-or-nothing data integrity, and strict validation.*

## Research Flags

Needs research: Phase 1 (Tesseract.js performance limits in browser vs. backend Node wrapper)
Standard patterns: Phase 3 (Mongoose bulk insert transactions)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on standard Mongoose/Node.js best practices and documentation. |
| Features | HIGH | The hybrid workflow perfectly aligns with the requested dry-run capability and user needs. |
| Architecture | HIGH | Leveraging the frontend editor for complex mapping is a robust and pragmatic pattern. |
| Pitfalls | HIGH | This approach directly addresses the critical blockers identified in FEASIBILITY.md and CONCERNS.md (PDF parsing, Slate.js formatting). |

**Gaps:** Needs verification on the maximum size of PDFs Tesseract.js can comfortably handle in the browser before causing UI freezes.

## Sources
- Mongoose Transactions docs [HIGH]
- Node.js Streams docs [HIGH]
- EdTech industry standards (Moodle Aiken format) [HIGH]
- Enterprise Node.js Architecture best practices [HIGH]
- Codebase Analysis (CONCERNS.md) [HIGH]
- Feasibility Assessment (FEASIBILITY.md) [HIGH]