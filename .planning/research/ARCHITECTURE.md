# Architecture Patterns

**Domain:** Bulk Question Import (PDF Focus)
**Researched:** 2024-2025

## Recommended Architecture: Streaming Import Pipeline

The architecture follows a pipeline that processes data page-by-page to maintain responsiveness and handle large documents.

```
[ PDF File ]
     |
     v
[ Frontend: PDF Splitter (pdf-lib) ] -> Emits Page Blobs
     |
     v
[ Frontend: OCR Scheduler (Tesseract.js) ] -> Pool of 4 Web Workers
     |
     v
[ Frontend: AI Parser (Optional) ] -> Sends raw text to LLM (JSON output)
     |
     v
[ Frontend: Review State / Editor ] -> Human validates/corrects
     |
     v
[ Backend: Transaction Service ] -> Mongoose `insertMany` in a session
     |
     v
[ MongoDB ]
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `PDFSplitter` | Splits PDF into single-page blobs. | Browser File API, `pdf-lib` |
| `OCRService` | Manages Tesseract worker pool, handles retries, reports progress. | Web Workers, `pdf.js` |
| `ImportStateStore` | Maintains a "Streaming" list of questions. Updates as pages finish. | React Context/Redux |
| `BackendController` | Receives final JSON, validates schema, executes transaction. | Express, Mongoose |

### Data Flow (Iterative vs Batch)
1. **Iterative:** Each page is a separate job. As soon as Page 1 is OCR'ed, it is sent to the AI Parser and then displayed in the UI. 
2. **Overlap Strategy:** To handle questions split across pages, the AI Parser receives the text of `Current Page + Last 10% of Previous Page`.

## Patterns to Follow

### Pattern 1: Tesseract Worker Recycling
**What:** Creating a fixed pool of workers and reusing them.
**When:** To avoid the 2-3s setup cost of starting a new worker for every page.
**Example:**
```javascript
const scheduler = createScheduler();
const worker = await createWorker('eng');
scheduler.addWorker(worker); // Add to pool once
// Reuse scheduler for all pages...
```

### Pattern 2: Side-by-Side Context
**What:** Rendering the PDF page canvas next to the editable OCR text.
**When:** Essential for UX when OCR accuracy is < 100%.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Main-Thread Blocking
**What:** Running `Tesseract.recognize` without a Web Worker.
**Why bad:** Freezes the browser tab for 5-10 seconds per page.
**Instead:** Use `Tesseract.js`'s built-in worker support or `createScheduler`.

### Anti-Pattern 2: Sending Images to Backend
**What:** Uploading every PDF page as an image to a Node.js server for OCR.
**Why bad:** Massive bandwidth usage and high server CPU load.
**Instead:** Perform OCR in the browser; only send the final structured text/JSON to the server.

## Scalability Considerations

| Concern | 1 Page | 50 Pages | 500 Pages |
|---------|--------|----------|-----------|
| RAM | ~100MB | ~500MB (due to workers) | Risk of OOM; must limit concurrent workers and clear old blobs. |
| Time | ~5s | ~1-2 mins | Several minutes; requires robust progress tracking and "Resume" capability. |

## Sources
- Tesseract.js Worker Pool Patterns [HIGH Confidence]
- PDF.js rendering best practices [HIGH Confidence]
