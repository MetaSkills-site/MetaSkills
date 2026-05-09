# Blueprint: AI-Assisted Bulk Question Import - Risk Assessment

## 1. AI Hallucination & Malformed JSON
- **Risk:** The Gemini API might return text containing markdown wrappers (e.g., ````json`), conversational filler ("Here are your questions:"), or schema deviations, breaking `JSON.parse()`.
- **Mitigation:** 
  - Use strict prompt engineering specifying NO extra text.
  - Implement a robust regex-based sanitization step in `genai.controller.js` before parsing.
  - Wrap parsing in a try-catch and return a specific error code prompting the frontend to allow manual fallback or retry.

## 2. Massive PDFs & Browser Freezes
- **Risk:** Processing a 100+ page PDF with Tesseract.js/PDF.js on the frontend can lock up the main UI thread, causing the browser to crash.
- **Mitigation:**
  - Enforce a file size / page limit (e.g., max 10 pages or 5MB) on the `PdfUploader` component.
  - Run the text extraction process inside a Web Worker.

## 3. Database Integrity & Mongoose Limits
- **Risk:** `insertMany` followed by a Module update could leave the DB in an inconsistent state if the Module update fails (e.g., orphaned questions).
- **Mitigation:** Use Mongoose Transactions.
- **Caveat:** Transactions require a MongoDB ReplicaSet. 
- **Fallback:** If the target environment does not run a ReplicaSet, we must implement manual rollback logic in the catch block (i.e., explicitly calling `Questions.deleteMany({ _id: { $in: insertedIds } })`).
- **Risk:** MongoDB 16MB document limit.
- **Mitigation:** While `insertMany` handles multiple documents, the total payload sent over the wire could exceed limits if massive base64 images are embedded. Images MUST be uploaded to GCS *before* final submission, passing only URL strings in the payload.

## 4. ID Generation Conflicts
- **Risk:** Generating `ObjectId`s on the frontend could theoretically cause collisions or be malformed if the wrong library is used.
- **Mitigation:** Standardize on a well-tested library like `bson-objectid` and strictly validate the ID formats in the backend payload validator before interacting with Mongoose.

## 5. Security & Rate Limiting
- **Risk:** Abuse of the text extraction endpoint could exhaust Gemini API quotas.
- **Mitigation:** Implement strict rate-limiting on `/api/genai/parse-questions` and ensure it is protected by the standard admin authentication middleware.
