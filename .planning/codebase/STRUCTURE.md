# Codebase Structure

**Analysis Date:** 2025-02-14

## Directory Layout

```
[root]/
├── metaskills-frontend/    # React Application
│   ├── src/
│   │   ├── components/
│   │   │   └── BulkImport/  # PDF Upload and UI components
│   │   ├── pages/
│   │   │   └── admin/       # Admin-only management pages
│   │   └── utils/           # Frontend business logic & PDF parsing
├── metaskills-backend/     # Express API
│   ├── config/              # AI Prompts and Provider config
│   ├── controllers/         # Request orchestration
│   ├── routes/              # Endpoint definitions
│   └── services/            # Shared business services (AI, Auth)
```

## Directory Purposes

**`metaskills-frontend/src/components/BulkImport/`:**
- Purpose: Components dedicated to the PDF import workflow.
- Key files: `PdfUploader.jsx` (File handling & Extraction UI).

**`metaskills-frontend/src/utils/`:**
- Purpose: Shared utility functions.
- Key files: `pdfParser.js` (Text extraction logic using pdfjs/tesseract).

**`metaskills-backend/services/`:**
- Purpose: Encapsulates reusable business logic and external service integrations.
- Key files: `ai.service.js` (Provider-agnostic AI interface).

**`metaskills-backend/config/`:**
- Purpose: Stores system-wide configurations and prompt templates.
- Key files: `aiPromptConfig.js` (AI instruction set).

## Key File Locations

**Entry Points:**
- `metaskills-frontend/src/pages/admin/BulkImportPage.jsx`: Main entry for the Bulk Import feature.
- `metaskills-backend/server.js`: API entry point.

**Core Logic:**
- `metaskills-frontend/src/utils/pdfParser.js`: Handles PDF text and OCR extraction.
- `metaskills-backend/controllers/genai.controller.js`: Manages AI-driven question parsing.

## Naming Conventions

**Files:**
- React Components: PascalCase (`PdfUploader.jsx`)
- Utilities/Services: camelCase (`pdfParser.js`, `ai.service.js`)

## Where to Add New Code

**New PDF Processing Logic:**
- Implementation: `metaskills-frontend/src/utils/pdfParser.js`

**New AI Parsing Modes:**
- Implementation: `metaskills-backend/config/aiPromptConfig.js`

**New Admin Workflows:**
- UI: `metaskills-frontend/src/pages/admin/`
- Components: `metaskills-frontend/src/components/`

---

*Structure analysis: 2025-02-14*
