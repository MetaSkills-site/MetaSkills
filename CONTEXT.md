# MetaSkills Monorepo Context

## Overview
MetaSkills is an adaptive, gamified AI learning platform designed for students. The repository is structured as a scalable, modern monorepo tailored for serverless deployment on Vercel.

## Monorepo Layout
- **`api/`**: Express backend application configured for Vercel Serverless Functions.
  - Entry point: `api/index.js` (Serverless bridge) & `server.js` (Local development).
  - Database: MongoDB Atlas via Mongoose with connection reuse and pool caps.
  - Auth: Google OAuth + JWT tokens.
- **`web/`**: Single Page Application built with React 18, Vite 6, TanStack Query, and Framer Motion.
  - Connects to `/api` endpoints via same-origin Vercel rewrites.
- **`docs/`**: Single source of truth for all non-production documentation, specs, architecture, and roadmaps.
  - `docs/architecture/`: System and subsystem designs.
  - `docs/planning/`: Implementation roadmaps and PRD specs.
  - `docs/research/`: Auth and technology research.
  - `docs/api/`: Endpoint and data contracts.
  - `docs/changelogs/`: Release and patch notes.
- **`test/`**: Shared integration and end-to-end tests.
- **`scratch/`**: Developer scratchpad (gitignored).

## Common Commands
```bash
# Development (runs both api and web)
pnpm run dev

# Build (production frontend build)
pnpm run build

# Linting
pnpm run lint

# Testing
pnpm run test
```
