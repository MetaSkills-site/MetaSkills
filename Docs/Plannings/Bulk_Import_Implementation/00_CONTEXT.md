# Project Context: AI-Assisted Bulk Question Import

## Project Overview
Metaskills is an educational platform featuring a robust backend built on Node.js/Express and MongoDB (via Mongoose), and a frontend utilizing React with a complex Slate.js rich-text editor. The system is designed to manage learning modules, tracks, questions, and student responses.

### Core Data Models
*   **Module (`Module.model.js`)**: Represents a grouping of questions by subject and grade. It stores an array of `questionIds`.
*   **Question (`Questions.model.js`)**: The core entity storing question content, answer options, explanations, and bi-directional references to Modules. Critically, question content, options, and explanations are stored as deeply nested JSON structures required by **Slate.js** (`{ slate: mongoose.Schema.Types.Mixed }`), not as plain text. Options for MCQs are stored as subdocuments with auto-generated `_id`s, which are referenced by the `correctOption` field.

## Feature: AI-Assisted Bulk Question Import
The goal is to allow administrators to upload a PDF (e.g., a past exam paper) and efficiently import its questions into a specific Module. 

### The Problem
Traditional automated OCR (like Tesseract) is insufficient on its own because:
1.  **Formatting:** OCR outputs flat strings, but the database requires complex Slate.js JSON.
2.  **Images:** OCR ignores diagrams and images critical for many questions.
3.  **Structure:** Writing regex to accurately parse questions vs. options from messy OCR text is brittle.

### The Solution: A Hybrid "Human-in-the-Loop" Architecture
This feature uses a 4-step workflow combining OCR, AI, and human validation:

1.  **Frontend Extraction (Tesseract.js)**: The admin uploads a PDF. Tesseract.js runs in the browser/frontend to extract the raw, unstructured text.
2.  **AI Structuring (Gemini)**: The raw text is sent to the backend's AI controller (`genai.controller.js`). The AI intelligently identifies questions and options, returning a structured JSON array of draft questions.
3.  **Frontend Preview & Augmentation**: The frontend displays these drafts in a "Preview State". The admin inspects them using the existing Slate.js editor component to fix typos, select the correct answer, add explanations, and crucially, manually upload screenshots of any required diagrams using the existing Google Cloud Storage integration.
4.  **Backend Bulk Commit**: Once validated, the admin submits the drafts. The frontend formats the data into the strict Slate.js JSON structure and pre-generates Mongoose `ObjectId`s. The backend receives this payload and performs a strict multi-document ACID transaction (`insertMany`) to safely add the questions and update the associated Module.

## Resuming Implementation
This directory (`Docs/Plannings/Bulk_Import_Implementation/`) contains all necessary blueprints to begin implementation in any session:
*   `01_PLAN_OUTLINE.md`: High-level architecture and data flow.
*   `02_REQUIREMENTS.md`: Dependencies and affected files.
*   `03_WORKFLOW_PLAN.md`: Phased execution steps.
*   `04_IMPLEMENTATION_SPEC.md`: API contracts and file-by-file logic.
*   `05_RISK_ASSESSMENT.md`: Mitigation strategies for scale, AI hallucination, and DB constraints.

**Next Steps for the Implementer:**
Begin with Phase 1 as outlined in `03_WORKFLOW_PLAN.md`. Ensure you adhere to the project's strict protocols: do not bypass validations, always use the defined Slate.js data structures, and ensure MongoDB multi-document transactions are utilized for the final bulk import.