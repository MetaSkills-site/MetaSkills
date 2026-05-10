# Feature Landscape

**Domain:** Bulk Question Import
**Researched:** 2024-2025

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All-or-Nothing Import | Partial imports corrupt the test banks. | High | Requires MongoDB Replica Set and multi-document transactions. |
| Strict Format Validation | Users make typos in text documents. | Med | Must pre-validate the entire parsed array before touching the DB. |
| Page-by-Page Progress | PDFs can take minutes to process; users need to see feedback. | Med | Implement a progress bar per page and per-document. |

## Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Streaming PDF Import | Allows users to start reviewing questions from Page 1 while Page 20 is still being OCRed. | High | Requires a sophisticated frontend pipeline (pdf-lib -> tesseract -> state management). |
| Side-by-Side Review | Show the original PDF page next to the extracted text for easy validation. | Med | Use `pdf.js` for rendering the page and a text editor for the OCR result. |
| AI-Assisted Tagging | Automatically identify questions, options, and answers from raw text. | Med | Send extracted text page-by-page to an LLM. |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Background-only Processing | Users lose the ability to correct OCR errors if it happens entirely on the server. | Use the "Streaming Preview" approach where the user is the final validator. |
| Auto-Merging Documents | Trying to merge multiple PDFs into one massive import state. | Process documents one at a time to maintain context and avoid memory exhaustion. |

## Feature Dependencies

```
PDF Splitting (pdf-lib) -> OCR (Tesseract.js) -> AI Parsing -> Human Review -> Backend Transaction
```

## MVP Recommendation

Prioritize:
1. **Frontend-side PDF Splitting & Parallel OCR.**
2. **Streaming Review UI** (Page-by-page rendering).
3. **Backend All-or-Nothing Import** (Mongoose Transactions).

## Sources
- Competitive analysis of PDF-to-Question tools [MEDIUM Confidence]
- Tesseract.js benchmarks [HIGH Confidence]
