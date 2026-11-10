# MetaSkills Monorepo

> **MetaSkills** is an AI-powered educational platform for skill assessment and adaptive practice across Mathematics, English Grammar, Vocabulary, and Reading Comprehension.

---

## Architecture Overview

This repository is structured as a modern, scalable monorepo optimized for **Vercel Serverless** deployment and local multi-service development.

```
MetaSkills/
├── api/                  # Express backend application (Vercel Serverless Functions)
├── web/                  # Vite + React frontend SPA
├── docs/                 # Consolidated documentation hub
│   ├── architecture/     # System architecture, AI pipeline specs, domain models
│   ├── planning/         # Phase plans, iterative PDF import specs, task roadmaps
│   ├── research/         # Auth research, idempotency and bug investigations
│   ├── api/              # API endpoints, data models, and request maps
│   └── changelogs/       # Release history and audit logs
├── test/                 # Monorepo cross-boundary integration and E2E tests
├── scratch/              # Developer scratchpad (gitignored)
├── vercel.json           # Vercel Monorepo Serverless routing configuration
├── package.json          # Monorepo workspace coordinator
├── pnpm-workspace.yaml   # Pnpm workspace definition
└── CONTEXT.md            # AI & Developer system context
```

---

## Quick Start

### Prerequisites
- Node.js >= 20.x
- `pnpm` >= 10.x (v12.x recommended)
- MongoDB instance (local or MongoDB Atlas)

### Setup & Installation
```bash
# Clone the repository
git clone <repo-url>
cd MetaSkills

# Install dependencies across all workspaces
pnpm install

# Copy environment variables template
cp .env.example api/.env
cp .env.example web/.env
```

### Running Locally
```bash
# Run both backend and frontend concurrently
pnpm run dev

# Or run individual workspaces
pnpm run dev:api    # Starts Express backend on http://localhost:7860
pnpm run dev:web    # Starts Vite frontend on http://localhost:5173
```

### Testing & Linting
```bash
# Run backend test suites
pnpm run test

# Run ESLint across both workspaces
pnpm run lint

# Build frontend production bundle
pnpm run build
```

---

## Deployment on Vercel

The monorepo is pre-configured with `vercel.json` for **Vercel Services**:
- All requests matching `/api/(.*)` route to the serverless `api` service (`api/api/index.js`).
- All frontend routes `/(.*)` route to the `web` static application.
