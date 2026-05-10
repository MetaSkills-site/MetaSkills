# Domain Pitfalls

**Domain:** Bulk Question Import
**Researched:** 2024-2025

## Critical Pitfalls

### Pitfall 1: Browser Memory Overload (The "Blob" Leak)
**What goes wrong:** Browser tab crashes during a large PDF import.
**Why it happens:** Storing hundreds of individual page blobs or canvas elements in memory without clearing them.
**Consequences:** Loss of work, poor UX.
**Prevention:** 
- Revoke Object URLs immediately after use (`URL.revokeObjectURL`).
- Clear canvas elements after Tesseract is finished.
- Limit concurrent workers based on `navigator.hardwareConcurrency`.

### Pitfall 2: Transaction Failures on Large Payloads
**What goes wrong:** Backend timeout or Mongoose session failure when importing 1000+ questions at once.
**Why it happens:** Default MongoDB transaction lifetime is 60 seconds.
**Consequences:** Import fails even if the data is valid.
**Prevention:** If the payload is massive, break the backend import into chunked transactions (e.g., 200 questions per transaction) or increase the transaction lifetime (not recommended).

## Moderate Pitfalls

### Pitfall 3: Tesseract Initialization Overhead
**What goes wrong:** First page takes 15 seconds, subsequent pages take 5.
**Why it happens:** Workers need to download WASM and language data (`eng.traineddata`).
**Prevention:** Initialize workers as soon as the user enters the "Import" screen, or use a service worker to cache the assets.

### Pitfall 4: AI Context Clipping
**What goes wrong:** A question starts on Page 4 and ends on Page 5, but the AI only sees Page 5 and treats it as a broken fragment.
**Prevention:** Use the "Overlap" strategy (send the last few lines of Page N as context for Page N+1).

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| OCR (Phase 1) | Thread Blocking | Mandatory use of `Tesseract.createScheduler` with Web Workers. |
| AI Parsing (Phase 2) | Token Waste | Don't send the entire raw OCR text if only specific blocks are needed; use a "first-pass" filter to find questions. |
| DB Insert (Phase 3) | Standalone Mongo | Must use Replica Set for transactions. |

## Sources
- Tesseract.js Issue Tracker (Memory Leaks) [HIGH Confidence]
- MongoDB Transaction Best Practices [HIGH Confidence]
