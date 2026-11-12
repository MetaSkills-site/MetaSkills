# Unified Contributor Guide: MetaSkills

Welcome to the MetaSkills team! This guide will help you understand what our platform does, how the codebase is organized, and how to build, test, and contribute effectively.

---

## 1. Welcome & Project Overview

### What is MetaSkills?
MetaSkills is an adaptive, gamified AI learning platform built for students across grades 1 through 12. 

### Why Does It Exist?
Traditional homework platforms present static questions with one-size-fits-all grading. MetaSkills adapts to each student's proficiency level in real time. It uses:
- **Adaptive Question Sequences:** Adjusting difficulty based on student performance.
- **Spaced Repetition System (SRS):** Scheduling vocabulary retention drills using the Leitner box method.
- **Generative AI Guidance:** Providing instant, personalized explanations when a student gets stuck on a concept.
- **Gamification Mechanics:** Rewarding persistence and daily streaks with "Carrots" and celebratory milestones.

---

## 2. Quick Start

Get your local environment running in three steps:

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```
2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Ensure MONGODB_URI and JWT_SECRET are configured in .env
   ```
3. **Launch Monorepo:**
   ```bash
   pnpm run dev
   ```
   Open `http://localhost:5173` in your browser.

👉 *For detailed prerequisite checks and database options, read the [Local Setup ENV Guide](LOCAL_SETUP_ENV.md).*

---

## 3. Project Structure Walkthrough

MetaSkills is structured as a pnpm monorepo containing two core packages:

```
metaskills/
├── api/             # Express 5 Backend (REST API, Auth, MongoDB, GenAI)
│   ├── config/      # DB connection pools, email, AI prompts
│   ├── controllers/ # HTTP endpoint handlers
│   ├── middlewares/ # Security, CSRF, auth guards, error handlers
│   ├── models/      # Mongoose schemas and database models
│   ├── routes/      # Express route tree
│   ├── services/    # Procedural math generators, LLM integrations
│   └── utils/       # Elo rating algorithms, JWT helpers, GCS storage
├── web/             # React 18 SPA (Vite 6, Styled-Components, Radix UI)
│   ├── src/
│   │   ├── components/ # Reusable UI components & marathon runners
│   │   ├── context/    # User sessions & editor state
│   │   ├── hooks/      # Custom React hooks (virtualization, shortcuts)
│   │   ├── layouts/    # Auth, Dashboard, and QuizPanel shells
│   │   ├── pages/      # Top-level view routes & admin portal
│   │   ├── services/   # Client-side Axios API services
│   │   └── utils/      # Client-side answer validation & formatting
├── docs/            # Full technical documentation suite
├── test/            # Monorepo integration and E2E tests
└── package.json     # Workspace configuration and unified scripts
```

👉 *For a file-by-file index of every single controller, model, component, and utility, refer to the [Codebase Directory and File Index](docs/CODEBASE_DIRECTORY_AND_FILE_INDEX.md).*

---

## 4. Architecture at a Glance

MetaSkills connects a high-speed React Single Page Application (SPA) to an Express REST API backed by MongoDB Atlas and external AI APIs.

- **Frontend Client (`web/`):** Built with React 18 and Vite 6. Utilizes TanStack Query for server state caching and Styled-Components for design tokens.
- **Backend API (`api/`):** Express 5 running on Node.js ES Modules. Configured to deploy seamlessly as Vercel Serverless Functions.
- **Data & Intelligence:** MongoDB Atlas stores students, modules, questions, and responses. Google Gemini, Groq, and NVIDIA NIM provide instant educational explanations.

👉 *For sequence diagrams, layer maps, and design decisions, review the [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md).*

---

## 5. Key Features & Where to Find Them

| Feature | Primary UI Component | Backend Controller | API Route |
|---|---|---|---|
| **Google Authentication** | `web/src/components/GoogleAuth.jsx` | `api/controllers/user.controller.js` | `POST /api/users/google-auth` |
| **Curriculum Modules** | `web/src/components/ModuleList.jsx` | `api/controllers/quiz.controller.js` | `POST /api/quiz/modules/get` |
| **Quiz Runner** | `web/src/layouts/QuizPanelLayout.jsx` | `api/controllers/quiz.controller.js` | `POST /api/quiz/submit` |
| **Reading Comprehension** | `web/src/pages/MarathonEnglishPage.jsx` | `api/controllers/passages.controller.js` | `GET /api/passages/generate/passage` |
| **Vocabulary SRS** | `web/src/components/AudioWord.jsx` | `api/controllers/vocabulary.controller.js` | `GET /api/vocabulary/quiz` |
| **Procedural Math Drills** | `web/src/pages/MathMarathonPage.jsx` | `api/controllers/math.controller.js` | `GET /api/math/question` |
| **AI Explanation Generator** | `web/src/components/admin/AIExplanationGenerator.jsx` | `api/controllers/genai.controller.js` | `POST /api/genai/explanation` |
| **Student Analytics** | `web/src/pages/AnalyticsPage.jsx` | `api/controllers/quiz.controller.js` | `GET /api/quiz/analytics/daily` |
| **Admin Question Authoring** | `web/src/pages/admin/QuestionEntryPage.jsx` | `api/controllers/quiz.controller.js` | `POST /api/quiz/questions` |

👉 *For detailed request payloads and response contracts, consult [Endpoint Mapping](docs/ENDPOINT_MAPPING.md).*

---

## 6. How to Test Features Manually

### 6.1 Testing Student Flow
1. Navigate to `http://localhost:5173/auth` and log in via Google OAuth.
2. Select an academic grade level on `http://localhost:5173/auth/complete-profile`.
3. From the `/dashboard`, click into any available module card (e.g., "Linear Equations").
4. Submit answers in the quiz runner:
   - Observe that correct answers increment the carrot counter and trigger celebratory confetti.
   - Review the explanation panel rendered below the question.

### 6.2 Testing Math Marathon
1. Navigate to `http://localhost:5173/marathon/math`.
2. Enter mathematical expressions into the Mathlive virtual math input.
3. Submit the equation and verify that mathematically equivalent expressions (e.g., `x = 5` and `5 = x`) evaluate correctly.

### 6.3 Testing Administrative Workflow
1. Navigate to `http://localhost:5173/admin/login` and sign in.
2. Visit `/admin/addQuestions` to open the question authoring wizard.
3. Use the rich text Slate editor and click "Generate AI Explanation" to verify LLM inference.
4. Save the question and confirm it appears in the question bank at `/admin/questions`.

---

## 7. Coding & Contribution Conventions

### 7.1 JSDoc Documentation Standards
Every source file in the monorepo must feature a file-level header block before imports:

```javascript
/**
 * @file filename.jsx
 * @description [One clear sentence describing domain responsibility]
 * @architecture [One sentence explaining how it connects to the system]
 * @agent_note [One sentence providing key gotchas for AI agents or contributors]
 */
```

### 7.2 Linter & Formatter
Run ESLint across both workspaces before committing:
```bash
pnpm run lint
```
Code must pass with **0 errors**.

### 7.3 Automated Test Suites
Run backend unit and integration test suites:
```bash
pnpm run test
```

### 7.4 Commit Message Guidelines
We follow the Conventional Commits specification:
- `feat: add polynomial math input component`
- `fix: resolve double carrot award on submission retry`
- `docs: update endpoint contract for vocabulary srs`
- `refactor: extract CSRF token cookie verification helper`

---

## 8. Where Documentation Lives

All official project documentation is located under `docs/` and root markdown guides:

- [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md) — System topology, serverless strategy, security.
- [Codebase Directory & File Index](docs/CODEBASE_DIRECTORY_AND_FILE_INDEX.md) — Complete searchable file registry.
- [Views & Components Catalog](docs/VIEWS_AND_COMPONENTS_CATALOG.md) — Frontend component hierarchy and props.
- [Endpoint Mapping](docs/ENDPOINT_MAPPING.md) — Frontend to backend REST API contracts.
- [Backend API and Data Models](docs/BACKEND_API_AND_DATA_MODELS.md) — Mongoose schemas, indexes, and hooks.
- [Local Setup ENV Guide](LOCAL_SETUP_ENV.md) — Local installation, database setup, and environment variables.
- [Documentation Index](docs/README.md) — Master documentation table of contents.

---

## 9. Getting Help

- **Bug Reports:** If you discover a bug while developing, use the in-app reporting tool at `/report-issue` or submit an issue in the repository tracker.
- **Core Maintainers:** Consult the repository owners or open a discussion thread on the project board.
