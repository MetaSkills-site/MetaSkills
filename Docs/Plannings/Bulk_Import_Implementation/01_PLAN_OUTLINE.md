# Blueprint: AI-Assisted Bulk Question Import - Plan Outline

## 1. High-Level Strategy
The AI-Assisted Bulk Question Import feature allows administrators to upload a PDF document containing questions, extract the raw text on the frontend using Tesseract.js, and leverage generative AI (Gemini) on the backend to parse this text into structured JSON drafts. These drafts are then presented to the admin for review, editing, and enhancement (e.g., adding images, marking correct options). Finally, the curated questions are bulk-inserted into the database and linked to a specific module.

## 2. Architecture & Logical Workflow
### Stage 1: Extraction (Frontend)
- **Input:** Admin uploads a PDF file via the frontend UI.
- **Process:** The frontend utilizes `Tesseract.js` (or PDF.js for text extraction, falling back to OCR if needed) to extract raw text from the document.
- **Output:** Raw string containing all text from the PDF.

### Stage 2: AI Parsing (Backend & AI)
- **Input:** Raw text sent via a `POST` request to `genai.controller.js` or a dedicated AI extraction endpoint.
- **Process:** The backend constructs a prompt instructing the Gemini API to parse the raw text into an array of structured JSON objects representing questions and options.
- **Output:** JSON array of draft questions returned to the frontend.

### Stage 3: Curation & Enhancement (Frontend)
- **Input:** JSON array of draft questions.
- **Process:** 
  - Frontend renders a 'Preview State' UI.
  - Admin reviews drafts using the existing UI Editor.
  - Admin selects correct options, adds explanations, and uploads supporting images/diagrams. Image uploads utilize the existing `utils/storage.js` GCS integration.
- **Output:** Finalized payload of questions, mapped to `Slate.js` JSON format where required, and assigned temporary IDs or final structures.

### Stage 4: Bulk Ingestion (Backend & Database)
- **Input:** Finalized payload containing module ID and an array of validated question objects.
- **Process:** 
  - The frontend maps content to Slate.js format and generates `ObjectId`s.
  - Payload is sent to a new bulk import endpoint in `quiz.controller.js`.
  - Backend strictly validates the payload.
  - Backend initiates a Mongoose transaction (if using ReplicaSets) or a robust multi-document insertion strategy.
  - `Questions.model.js`: Executes `insertMany` for all valid questions.
  - `Module.model.js`: Updates the target module's `questionIds` array with the newly generated `ObjectId`s.
- **Output:** Success response, updating the UI to reflect the newly imported questions.

## 3. Data Flow Diagram
[PDF Upload] -> (Frontend: Text Extraction) -> [Raw Text]
[Raw Text] -> (Backend: genai.controller) -> (Gemini API) -> [JSON Drafts]
[JSON Drafts] -> (Frontend: UI Editor + GCS Uploads) -> [Finalized Question Payload]
[Finalized Question Payload] -> (Backend: quiz.controller bulk endpoint) -> (Mongoose DB Transaction) -> [Success state]
