# Technology Stack

**Project:** Bulk Question Import
**Researched:** 2024

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | >=18.x | Parsing & execution environment | Provides native stream processing via `fs` and `stream` modules for high-performance file reading. |
| Mongoose | >= 6.x | ODM / Database operations | Provides highly optimized `insertMany()` and robust `startSession()` capabilities for ACID transactions. |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MongoDB | >= 4.0 | Database | Multi-document transactions were introduced in v4.0. **Must be deployed as a Replica Set.** |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `multer` | ^1.4.x | File Uploads | Use if the import feature is exposed via an Express REST API endpoint to handle `multipart/form-data`. |
| `csv-parser` | ^3.x | CSV Parsing | Use if the chosen import format is CSV. Highly optimized streaming parser. |
| Native Regex / String manipulation | N/A | Aiken / Markdown Parsing | Use if building a custom text-based format. No external library needed. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| File Format | CSV / Aiken (Plain Text) | PDF / DOCX | Parsing PDFs for structured relationships is incredibly complex and error-prone. Requires heavy libraries like `pdf-parse` or `mammoth` and yields unreliable hierarchical data. |
| DB Ops | Mongoose `insertMany` with Sessions | Loop with `save()` | Calling `.save()` in a `for` loop is extremely slow and causes unnecessary database roundtrips. |

## Sources

- Mongoose Transactions docs [HIGH]
- Node.js Streams docs [HIGH]