# Technology Stack

**Project:** Bulk Question Import
**Researched:** 2024-2025

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React.js | ^18.x | Frontend UI | Handles the "Streaming Import" state and PDF rendering. |
| Node.js | >=18.x | Backend API | Transactional processing and final data validation. |
| Mongoose | >= 6.x | ODM / Database operations | Optimized `insertMany()` and `startSession()` for transactions. |

### PDF & OCR (Frontend)
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `pdf-lib` | ^1.17.x | PDF Manipulation | Splitting multi-page PDFs into individual page buffers/blobs. |
| `pdfjs-dist` | ^4.x | PDF Rendering | Rendering PDF pages to `<canvas>` elements for Tesseract processing. |
| `Tesseract.js` | ^5.x | Optical Character Recognition | High-performance WASM-based OCR. Supports Worker Pools for parallelism. |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MongoDB | >= 4.0 | Database | Multi-document transactions (Replica Set required). |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `multer` | ^1.4.x | File Uploads | Handling multi-part file uploads if using server-side processing. |
| `p-map` | ^7.x | Concurrency Control | Useful for limiting parallel AI API calls in the frontend. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| OCR Execution | Frontend (Tesseract.js) | Backend (Python/Tesseract) | Moving OCR to the frontend saves server CPU and allows for a "streaming" UX where the user sees progress in real-time. |
| PDF Splitting | `pdf-lib` | `pdf.js` | `pdf.js` is for rendering; `pdf-lib` is better for extracting/modifying pages as standalone blobs. |
| DB Ops | Mongoose Transactions | Manual Cleanup | Manual cleanup on failure is error-prone and doesn't guarantee integrity. |

## Sources

- Tesseract.js v5 Release Notes [HIGH]
- pdf-lib API Documentation [HIGH]
- Mongoose Transactions docs [HIGH]
- Node.js Streams docs [HIGH]
