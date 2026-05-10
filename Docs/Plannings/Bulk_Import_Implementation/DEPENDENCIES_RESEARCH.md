# Research Report: Frontend Dependencies for Bulk Import

**Context:** AI-Assisted Bulk Question Import Implementation
**Date:** 2024
**Focus:** Integration requirements for external frontend dependencies (`tesseract.js`, `pdfjs-dist`, `bson-objectid`).

## 1. `pdfjs-dist` (PDF Text Extraction)
Used for extracting text from PDFs that have a built-in text layer (standard PDFs).

### Integration Requirements & Best Practices (2024)
- **Web Worker Setup (Critical):** `pdfjs-dist` relies on Web Workers to parse PDFs without freezing the UI. In modern bundlers like **Vite**, the worker must be configured using standard ESM or Vite-specific URL suffixing:
  ```javascript
  import * as pdfjsLib from 'pdfjs-dist';
  
  // Vite best practice
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  ```
- **Text Extraction Use Case:** Since the goal is *text extraction* (not rendering a PDF viewer), you will use `pdf.getPage(i)` and then `page.getTextContent()`. It is unnecessary to render to a `<canvas>` unless you are doing OCR or displaying the document to the user.
- **Font & CMaps:** If documents use non-standard fonts, you might need to copy the `cmaps` directory from `node_modules/pdfjs-dist/cmaps/` to your public folder and configure `cMapUrl` and `cMapPacked: true`.

## 2. `tesseract.js` (OCR Text Extraction)
Used for extracting text from scanned PDFs or images without a text layer.

### Integration Requirements & Best Practices (2024)
- **Worker Management:** Tesseract.js initialization is expensive (downloading the core WASM and language data, ~15MB). 
  - **Do NOT** instantiate a new worker for every page or file.
  - **Singleton Pattern:** Keep the worker instance alive during the bulk import process (using a `useRef` or a Context provider) and terminate it (`worker.terminate()`) only when the modal unmounts.
- **Schedulers for Batch Processing:** If processing a multi-page scanned document, use `Tesseract.createScheduler()` to manage a pool of workers to process pages in parallel.
- **Memory Management:** Web Workers consume significant memory. Always ensure `terminate()` is called to prevent memory leaks in the browser.
- **Lazy Loading:** Dynamically import the library or only initialize the worker if `pdfjs-dist` fails to find text (i.e., fallback to OCR), preventing unnecessary downloads for users who upload standard text PDFs.

## 3. `bson-objectid` (Frontend ID Generation)
Used to pre-generate valid MongoDB ObjectIds on the frontend to link questions and options before sending the bulk payload to the backend.

### Integration Requirements
- **Simple Utility:** It's a lightweight library with no asynchronous or Web Worker requirements.
- **Usage:**
  ```javascript
  import ObjectId from 'bson-objectid';
  const newId = ObjectId().toHexString();
  ```
- **Consideration:** Ensure the backend `mongoose` models accept these pre-generated string IDs and correctly cast them to `ObjectId` during the `insertMany` operation.

## Summary Recommendation
1. **Extraction Pipeline:** Attempt extraction with `pdfjs-dist` first. If the resulting text is empty or falls below a certain character threshold (indicating a scanned document), prompt the user to use OCR and then process with `tesseract.js`.
2. **Performance:** Both `pdfjs-dist` and `tesseract.js` handle heavy computational loads. Keep their logic isolated in utility functions outside of React's render cycle, and strictly manage their Worker lifecycles to maintain frontend performance.