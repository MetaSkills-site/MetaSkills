# MetaSkills — Configuration Monorepo

> **MetaSkills** is an AI-powered educational platform for skill assessment and adaptive practice. This monorepo is the central configuration hub that ties together the frontend application and backend API server as Git submodules.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Architecture](#architecture)
  - [Frontend (`metaskills-frontend`)](#frontend-metaskills-frontend)
  - [Backend (`metaskills-backend`)](#backend-metaskills-backend)
  - [AI Engine](#ai-engine)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Routing Map](#routing-map)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Development Conventions](#development-conventions)
- [Deployment](#deployment)
- [License](#license)

---

## Project Overview

MetaSkills is a full-stack, AI-augmented learning platform built for students seeking structured subject practice across **Mathematics**, **English Grammar**, **Vocabulary**, and **Reading Comprehension**. The platform adapts to each learner through:

- **Structured Module Quizzes** — Question banks organised into graded learning modules.
- **Marathon Mode** — Gamified, timed challenge sessions for English (grammar, vocabulary, sentences) and Mathematics.
- **Spaced Repetition (SRS) Vocabulary** — Smart review scheduling based on recall performance.
- **AI-Generated Explanations** — On-demand step-by-step explanations produced by a multi-model AI pipeline (Google Gemini, NVIDIA NIM / Llama-4-Scout, Mistral, GPT variants).
- **AI Sentence Practice** — Conversational writing feedback powered by generative AI.
- **Detailed Performance Analytics** — Per-module history, Elo rating tracking, and admin-level aggregated insights.

---

## Repository Structure

```
Metaskills/                        ← This configuration repository
├── metaskills-frontend/           ← React + Vite SPA (submodule)
├── metaskills-backend/            ← Node.js / Express API server (submodule)
├── .gitignore
├── .gitattributes
├── .planning/                     ← Planning artefacts and codebase snapshots
└── README.md                      ← You are here
```

> Both `metaskills-frontend` and `metaskills-backend` are independent Git repositories that are referenced here as submodules, each with their own `.git` history, `package.json`, and independent deployment targets.

---

## Architecture

The project follows a **decoupled SPA + REST API** architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                      │
│   React SPA (Vite)  ←→  Service Worker (PWA / Offline)  │
└────────────────────┬────────────────────────────────────┘
                     │  HTTPS / REST + NDJSON Streaming
┌────────────────────▼────────────────────────────────────┐
│              Express.js REST API (Node.js)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Auth MW  │ │Idempotency│ │Rate Limit│ │Client Block│ │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Route Handlers / Controllers         │   │
│  └──────────────────────────────────────────────────┘   │
└────────┬─────────────────────┬───────────────────────────┘
         │                     │
┌────────▼────────┐   ┌────────▼──────────────────────────┐
│   MongoDB Atlas  │   │     External AI / Cloud APIs       │
│  (via Mongoose)  │   │  Google GenAI · NVIDIA NIM · Groq  │
│                  │   │  Google Cloud Storage · Brevo Email│
└──────────────────┘   └────────────────────────────────────┘
```

### Frontend (`metaskills-frontend`)

| Concern | Technology |
|---|---|
| Framework | React 18 + Vite 6 |
| Routing | React Router DOM v7 (`createBrowserRouter`) |
| Data Fetching & Caching | TanStack Query v5 |
| Styling | Styled Components v6 |
| Animations | Framer Motion v12 |
| Rich Text Editing | Slate.js |
| Math Input & Rendering | MathLive + KaTeX |
| Charts | Chart.js + react-chartjs-2 |
| Auth | Google OAuth (`@react-oauth/google`) + JWT |
| 3D / Canvas | Three.js |
| SEO | react-helmet-async |
| PWA | Service Worker (`/public/sw.js`) |
| Analytics | Vercel Analytics |

**Key internal patterns:**
- **API Layer:** All endpoint URLs are managed in a single `src/api/requestMap.js` — the single source of truth for all backend URLs. No raw URL strings are scattered across components.
- **State Management:** React Context for session (`SessionProvider`), module/quiz state (`ModuleContext`), and editor state.
- **Code Splitting:** All pages and admin views are lazy-loaded via `React.lazy()` with skeleton fallbacks, minimising the initial bundle.
- **Protected Routes:** `<ProtectedRoute>` and `<ProtectedAdminRoute>` guard user and admin sections respectively, redirecting unauthenticated users to `/auth`.

### Backend (`metaskills-backend`)

A Node.js/Express v5 REST API with the following layers:

```
routes/ → controllers/ → services/ → models/ (Mongoose)
                       ↘ helpers/ / utils/
```

**Middleware stack (in order):**
1. `clientblock.js` — Blocks unauthorised client origins (security layer).
2. `express.json()` / `express.urlencoded()` — Body parsing.
3. Per-route: `authMiddleware.js` (`protectUser`, `protectAdmin`) — JWT validation.
4. Per-route: `idempotency.js` — Prevents duplicate POST/PUT state mutations (e.g., score submissions).
5. Per-route: `rateLimiters.js` — Protects AI and auth endpoints from abuse.
6. `errorHandler.js` — Centralised error formatting and response.

### AI Engine

The AI subsystem is orchestrated through `controllers/genai.controller.js` and configured via `config/aiPromptConfig.js`. It supports:

| Pipeline | Models Used | Use Case |
|---|---|---|
| **Streaming Explanation** | Llama-4-Scout (NVIDIA NIM) → GPT-OSS-120B; fallback: Mistral-Medium-3, Gemini-2.5-Flash-Lite | Step-by-step question explanations |
| **Sentence Practice** | Gemini (Google GenAI) | Conversational writing feedback |
| **Passage Generation** | Gemini | Dynamic reading comprehension passages |
| **Error Analysis** | Gemini | AI-driven root-cause analysis of system errors |
| **TTS (Text-to-Speech)** | Groq (low-latency) | Audio narration for vocabulary |

Responses for explanations are streamed as **NDJSON** (newline-delimited JSON) for real-time token delivery to the client.

---

## Key Features

### For Students
- 📚 **Module Quizzes** — Graded by subject (English, Math) with Elo-based difficulty tracking.
- 🏃 **Marathon Mode** — Competitive timed sessions across Grammar, Vocabulary, Sentences, and Mathematics.
- 🧠 **SRS Vocabulary** — Flash-card style vocabulary with spaced-repetition intervals.
- 💡 **AI Explanations** — Request a streamed explanation for any question.
- 📊 **Analytics Dashboard** — Module-level history, accuracy trends, and Elo progression charts.
- 📶 **Offline Support** — PWA with service worker caching for basic offline access.
- 🐛 **Issue Reporting** — In-app error reporting (`/report-issue`) with AI-assisted triage.

### For Administrators
- 👤 **User Management** — View all users, inspect individual answer histories.
- ❓ **Question Management** — Create, edit, trash/restore questions with a rich Slate.js editor.
- 📦 **Module Management** — Organise questions into modules with sequence control.
- 📈 **Admin Analytics** — Platform-wide aggregated performance metrics.
- 💬 **Notifications** — Push notification management for the student base.
- 🔗 **Context Attachments** — Attach reference materials (images/text) to questions.
- 🗂️ **Passage Management** — Create and manage AI-generated reading passages.
- 🔄 **Marathon Management** — Configure timed challenge pools.
- 🖥️ **Active Sessions Monitor** — Real-time view of active user sessions.
- 🚨 **Error Reports** — Browse and triage student-submitted error reports.
- 🔢 **Sequence Manager** — Control the ordering of modules within a learning path.

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI framework |
| `vite` | ^6.3.5 | Build tool & dev server |
| `react-router-dom` | ^7.6.1 | Client-side routing |
| `@tanstack/react-query` | ^5.90.21 | Async data fetching & caching |
| `styled-components` | ^6.1.19 | CSS-in-JS component styling |
| `framer-motion` | ^12.30.0 | Animation library |
| `slate` / `slate-react` | ^0.117.x | Rich text editor |
| `mathlive` | ^0.105.3 | Mathematical expression input |
| `katex` | ^0.16.21 | LaTeX math rendering |
| `chart.js` | ^4.5.1 | Data visualisation |
| `three` | ^0.183.0 | 3D WebGL rendering |
| `@react-oauth/google` | ^0.12.1 | Google Sign-In |

### Backend
| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.1.0 | HTTP server framework |
| `mongoose` | ^8.16.1 | MongoDB ODM |
| `@google/genai` | ^1.42.0 | Google Gemini AI |
| `openai` | ^6.29.0 | OpenAI-compatible API client (NVIDIA NIM, GPT) |
| `jsonwebtoken` | ^9.0.2 | JWT auth tokens |
| `bcrypt` | ^6.0.0 | Password hashing |
| `mathjs` | ^15.1.0 | Mathematical expression evaluation |
| `algebrite` | ^1.4.0 | Symbolic algebra |
| `@getbrevo/brevo` | ^3.0.1 | Transactional email (Brevo/Sendinblue) |
| `@google-cloud/storage` | ^7.17.3 | GCS file uploads |
| `google-auth-library` | ^10.5.0 | Google token verification |
| `express-rate-limit` | ^8.2.1 | API rate limiting |

---

## Routing Map

### User-Facing Routes

| Path | Component | Access |
|---|---|---|
| `/` | `HomePage` | Public |
| `/auth` | `AuthPage` | Public |
| `/auth/complete-profile` | `GradeSelectionPage` | Public |
| `/dashboard` | `DashboardLayout` | 🔒 Authenticated |
| `/analytics` | `AnalyticsPage` | 🔒 Authenticated |
| `/analytics/:moduleId` | `ModuleHistoryPage` | 🔒 Authenticated |
| `/modules/:subject` | `ModuleList` | 🔒 Authenticated |
| `/module/:moduleId` | `ModuleStartPage` | 🔒 Authenticated |
| `/attempt/:moduleId` | `QuizPanelLayout` | 🔒 Authenticated |
| `/marathon` | `MarathonPage` | 🔒 Authenticated |
| `/marathon/english` | `MarathonEnglishPage` | 🔒 Authenticated |
| `/marathon/english/{grammar\|vocabulary\|sentences\|history}` | `MarathonStartPage` | 🔒 Authenticated |
| `/marathon/english/{category}/attempt` | `MarathonQuiz` / `MarathonSentencePracticePage` | 🔒 Authenticated |
| `/marathon/math` | `MathMarathonPage` | 🔒 Authenticated |
| `/marathon/math/attempt/:questionId` | `MathMarathonQuiz` | 🔒 Authenticated |
| `/report-issue` | `ErrorReportPage` | 🔒 Authenticated |
| `/offline` | `OfflinePage` | Public |

### Admin Routes (`/admin/*`)

| Path | Component |
|---|---|
| `/admin` | `AdminDashboard` |
| `/admin/addQuestions` | `QuestionEntryPage` |
| `/admin/modules` | `ModulesViewPage` |
| `/admin/questions` | `QuestionsViewPage` |
| `/admin/all-questions` | `AllQuestionsViewPage` |
| `/admin/view-content` | `ModulesQuestionsViewPage` |
| `/admin/viewUsers` | `UsersViewPage` |
| `/admin/users/:userId/history` | `UserHistoryPage` |
| `/admin/analytics` | `AdminAnalyticsPage` |
| `/admin/trash` | `TrashQuestionsPage` |
| `/admin/notifications` | `NotificationsManagementPage` |
| `/admin/context-attachments` | `ContextAttachmentsViewPage` |
| `/admin/manage-marathon` | `MarathonManagementPage` |
| `/admin/view-passages` | `PassagesViewPage` |
| `/admin/error-reports` | `ErrorReportsPage` |
| `/admin/active-sessions` | `ActiveSessionsPage` |
| `/admin/sequence-manager` | `SequenceManagerPage` |

---

## API Reference

All API endpoints are prefixed with `/api`.

| Prefix | Router File | Description |
|---|---|---|
| `/api/users` | `user.routes.js` | Registration, login, profile, session |
| `/api/quiz` | `quiz.routes.js` | Questions, submissions, module progress |
| `/api/math` | `math.routes.js` | Math question generation & answer verification |
| `/api/vocabulary` | `vocabulary.routes.js` | SRS vocabulary fetch & progress tracking |
| `/api/passages` | `passages.routes.js` | Reading passage management |
| `/api/genai` | `genai.routes.js` | AI explanation generation (streaming) |
| `/api/context-attachments` | `contextAttachments.routes.js` | File/image attachments for questions |
| `/api/upload` | `upload.routes.js` | Google Cloud Storage upload endpoints |
| `/api/admin` | `admin.routes.js` | Admin auth and privileged operations |
| `/api/admin/analytics` | `adminAnalytics.route.js` | Platform-wide analytics aggregation |
| `/api/errors` | `error.routes.js` | Error reporting and AI-assisted triage |
| `/api/backup` | `backup.routes.js` | Database backup utilities |

---

## Data Models

| Model | File | Description |
|---|---|---|
| `User` | `user.model.js` | Student profile, Elo rating, grade, auth tokens |
| `Admin` | `admin.model.js` | Administrator credentials |
| `Questions` | `Questions.model.js` | Question content, options, metadata, subject |
| `Responses` | `Responses.model.js` | Individual student answer records |
| `Module` | `Module.model.js` | Grouped question set with ordering |
| `Sequence` | `Sequence.model.js` | Ordered list of modules for a learning path |
| `Vocabulary` | `Vocabulary.model.js` | Vocabulary word definitions and metadata |
| `VocabProgress` | `VocabProgress.model.js` | Per-user SRS scheduling data |
| `Passages` | `Passages.model.js` | AI-generated reading comprehension passages |
| `ContextAttachments` | `ContextAttachments.model.js` | Reference material attached to questions |
| `Notification` | `Notification.model.js` | Push notification records |
| `Errors` | `Errors.model.js` | Student-reported issues with AI triage results |
| `Idempotency` | `Idempotency.model.js` | Deduplication keys for state-mutating requests |
| `Session` | `session.model.js` | Active user session tracking |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher (recommended: use `nvm`)
- **MongoDB** — local instance or a MongoDB Atlas URI
- **npm** v9+
- Environment variables configured (see below)

### Clone the Repository

```bash
git clone --recurse-submodules https://github.com/your-org/Metaskills.git
cd Metaskills
```

> If you already cloned without `--recurse-submodules`, run:
> ```bash
> git submodule update --init --recursive
> ```

### Environment Variables

Create a `.env` file in `metaskills-backend/` with the following keys:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/metaskills

# Authentication
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id

# AI Providers
GOOGLE_API_KEY=your_google_genai_api_key
NVIDIA_API_KEY=your_nvidia_nim_api_key
GROQ_API_KEY=your_groq_api_key

# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key

# Google Cloud Storage
GCS_BUCKET_NAME=your_gcs_bucket
GOOGLE_APPLICATION_CREDENTIALS=./gcs-key.json

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

Create a `.env` file in `metaskills-frontend/` with:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_BASE_URL=http://localhost:5000
```

### Running Locally

**Option 1 — Run both together (recommended)**

The frontend's `dev` script runs Vite and the backend concurrently:

```bash
cd metaskills-frontend
npm install
npm run dev
```

**Option 2 — Run separately**

```bash
# Terminal 1 — Backend
cd metaskills-backend
npm install
npm run start   # nodemon server.js

# Terminal 2 — Frontend
cd metaskills-frontend
npm install
npm run dev     # Vite dev server on http://localhost:5173
```

---

## Development Conventions

### 1. Blueprint-First Protocol

All significant architectural or logic changes **must** follow the Blueprint Protocol:
1. Draft a `Blueprint.md` in the relevant sub-repo before writing implementation code.
2. The blueprint must include: Plan Outline, Requirements, Workflow, Implementation Spec, and Risk Assessment.
3. Await review and approval before executing.

### 2. Code Quality

```bash
# Linting
npm run lint           # ESLint (both repos)

# Formatting
npx prettier --write . # Prettier (both repos)
```

### 3. API Reliability — Idempotency

Use the `idempotencyGuard` middleware for any `POST`/`PUT` endpoint that modifies user state (progress, Elo, answers). This prevents duplicate submissions from network retries.

### 4. Modular AI Services

- All AI logic is centralised in `genai.controller.js` and configured in `config/aiPromptConfig.js`.
- Adding a new model: follow the `getGroqClient` / `nvClient` connector pattern to keep API credentials and client configuration modular.
- AI explanations are streamed as **NDJSON** — never buffer the full response before writing to the client.

### 5. Frontend API Calls

- All backend URLs **must** be defined in `src/api/requestMap.js`. Never hardcode URLs inside components or hooks.
- Use the custom `useFetch` hook or TanStack Query for all data fetching.

### 6. Changelogs

After every significant task, append an entry to `docs/CHANGELOG.md` in the relevant sub-repo:

```markdown
## [YYYY-MM-DD] - Feature/Fix Name
- **Changed:** list of files
- **Why:** reason
- **Risk:** Low / Medium / High
- **Verification:** verified via [test script name]
```

---

## Deployment

| Target | Platform | Notes |
|---|---|---|
| Frontend | **Vercel** | `vercel.json` present; auto-deploys on push to main |
| Backend | **Google Cloud Run** | `Dockerfile` + `docker-compose.yml` present |
| Database | **MongoDB Atlas** | URI stored in backend `.env` |
| File Storage | **Google Cloud Storage** | Credentials via `gcs-key.json` |
| Email | **Brevo** | Transactional notifications and error alerts |

---

## License

This project is licensed under the **MIT License** — see individual sub-repo `LICENSE` files for details.
