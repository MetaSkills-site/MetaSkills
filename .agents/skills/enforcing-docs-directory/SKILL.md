---
name: enforcing-docs-directory
description: Enforces that all non-production files (docs, plans, research, debug notes, test data, diagrams, postman collections, etc.) are stored in the project-root `Docs/` directory — never inside `metaskills-backend/` or `metaskills-frontend/`. Also instructs agents to read non-production files from `Docs/` first. Use when creating, moving, or searching for any file that is not production source code.
---

# Enforcing the Docs Directory Convention

## When to use this skill
- An agent is about to create, write, or save any non-production file (documentation, research, debug notes, planning artifacts, test data, architecture diagrams, postman collections, scratch scripts, etc.)
- An agent needs to read or search for existing non-production reference material (architecture docs, research notes, debug plans, investigation reports, etc.)
- A file review reveals non-production files incorrectly placed inside `metaskills-backend/` or `metaskills-frontend/`

## Core Rules

### Storage — where non-production files MUST go

- **All non-production files** MUST be stored under the project-root `Docs/` directory.
  ```
  <project-root>/Docs/
  ```
- Use subdirectories within `Docs/` to organise by purpose:
  ```
  Docs/
  ├── Plannings/          # Implementation plans, roadmaps, phase docs
  ├── Research/           # Investigation notes, competitive analysis
  ├── Debug/              # Debug session logs, root-cause analyses
  ├── Architecture/       # Architecture decision records, system diagrams
  ├── API/                # Postman collections, API testing guides
  └── ...                 # Create new subdirectories as needed
  ```
- Agents MAY create new subdirectories inside `Docs/` when none of the existing ones fit.

### What counts as "non-production"

Any file that is **not** required for the application to build, run, or deploy in production:
- Markdown documentation (`.md`) — research, plans, audits, guides
- Debug / investigation notes
- Architecture decision records
- Test data files and seed fixtures (unless consumed at runtime)
- Postman / Insomnia collections
- Diagrams and visual assets for documentation
- Scratch scripts used during development
- Any generated report or analysis
- JSON files (`.json`) output from test/temp scripts (excluding production/build configs like `package.json`, `tsconfig.json`, etc.)

### What does NOT belong in `Docs/`

- Production source code, configs, and assets → `metaskills-backend/` or `metaskills-frontend/`
- Changelogs → `Changelogs/` (separate convention)
- GSD planning state → `.planning/` (system-managed)
- Git and editor configs → `.git/`, `.vscode/`

### Prohibited locations for non-production files

> **NEVER** store non-production files inside:
> - `metaskills-backend/`
> - `metaskills-frontend/`
>
> These directories are strictly for production source code, production configs, and production assets.

### Reading — where to search for non-production files

When an agent needs to find or read non-production reference material:

1. **Check `Docs/` first** — search all subdirectories within `Docs/`.
2. **Check `Changelogs/`** if looking for release or change history.
3. **Do NOT** scan `metaskills-backend/` or `metaskills-frontend/` for documentation, plans, research, or any other non-production content.

## Workflow

- [ ] Before writing any file, determine: is this file needed for production?
- [ ] If **yes** → place in `metaskills-backend/` or `metaskills-frontend/` as appropriate.
- [ ] If **no** → place in `Docs/` under an appropriate subdirectory.
- [ ] Before searching for reference docs, check `Docs/` first.
- [ ] If you find non-production files misplaced in backend/frontend dirs, flag them to the user.
- [ ] Specifically check for `.json` test outputs or temporary data files and move/remove them if they are not required in production configs.
