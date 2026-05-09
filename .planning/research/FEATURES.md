# Feature Landscape

**Domain:** Bulk Question Import
**Researched:** 2024

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All-or-Nothing Import | Partial imports corrupt the test banks. | High | Requires MongoDB Replica Set and multi-document transactions. |
| Strict Format Validation | Users make typos in text documents. | Med | Must pre-validate the entire parsed array before touching the DB. |
| Error Line Reporting | Users need to know *where* they messed up. | Med | The parser must track line numbers to report "Syntax error on line 45". |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dry Run / Preview | Let users see what will be imported before committing. | Med | Parse the file and return the JSON array without executing database inserts. |
| Image/Asset support | Ability to import ZIP files containing the text document alongside referenced images. | High | Requires unzipping, uploading images to S3/Cloudinary, and updating Markdown image links. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| PDF/Word Doc Support | Impossibly fragile to parse. | Use a strict plain text standard (Aiken format) or CSV template. |
| Automatic AI Correction | Silently altering user questions/answers breaks trust and correctness. | Fail fast and throw an error telling the user to fix the document. |

## Feature Dependencies

```
Format Definition -> Strict Validation -> All-or-Nothing Import
```

## MVP Recommendation

Prioritize:
1. All-or-Nothing Import (Transactions)
2. Strict Validation with Line-Number Error Reporting
3. Dry Run / Preview capability

Defer: Image/ZIP support (complexity too high for MVP).

## Sources
- EdTech industry standards (Moodle Aiken format) [HIGH Confidence]