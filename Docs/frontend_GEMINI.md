# Metaskills Project Overview

This is a comprehensive educational platform designed for skill assessment and practice, featuring advanced AI integrations for content generation and feedback.

## Architecture

The project follows a decoupled Frontend/Backend architecture:

- **Frontend (`/metaskills`):** A modern React application powered by **Vite**.
  - **Key Technologies:** TanStack Query (Data fetching), Styled Components (UI), Framer Motion (Animations), Slate (Rich Text Editor), Mathlive (Mathematical input), and KaTeX (LaTeX rendering).
  - **State Management:** React Context (Module, Session, Editor).
  - **API Layer:** Centralized `requestMap.js` and a custom `useFetch` hook for robust, idempotent data fetching.

- **Backend (`/metaskills-backend`):** A Node.js/Express server providing a RESTful API.
  - **Database:** MongoDB via **Mongoose**.
  - **AI Engines:** Multi-model support including **Google GenAI** (Gemini), **NVIDIA NIM**, and **Groq** (for low-latency TTS).
  - **Auth:** Firebase-integrated Google Authentication.
  - **Key Features:** Spaced Repetition (SRS) vocabulary practice, Math marathon generation, and dynamic reading passage creation.

## Building and Running

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or remote)
- Environment variables configured in `metaskills-backend/.env`

### Frontend
```bash
cd metaskills
npm install
npm run dev   # Starts Vite + Backend concurrently
npm run build # Production build
```

### Backend
```bash
cd metaskills-backend
npm install
npm run start # Starts server with nodemon
```

## Development Conventions

### 1. Planning First
All significant architectural or logic changes MUST follow the **Blueprint Protocol**. Use the `blueprint-first` skill to research and draft a plan in `Blueprint.md` before implementation.

### 2. Code Quality
- **Linting:** `eslint .`
- **Formatting:** Prettier is used for consistent code style (`.prettierrc`).
- **Testing:** Backend uses `fast-check` for property-based testing and manual test scripts in the `tests/` directory.

### 3. API Reliability
Use the `idempotencyGuard` middleware for any POST/PUT actions that modify user state (carrots, Elo, progress) to prevent duplicate actions.

### 4. Modular AI Services
AI logic is centralized in `genai.controller.js` and `aiPromptConfig.js`. When adding new models, prefer modular connectors (like the `getGroqClient` pattern) to keep the engine logic clean.

## Directory Structure Highlights

- `metaskills/src/components/`: Modular UI components.
- `metaskills/src/api/requestMap.js`: Source of truth for API endpoints.
- `metaskills-backend/models/`: Mongoose schemas for Users, Questions, Progress, etc.
- `metaskills-backend/controllers/`: Core business logic and AI orchestration.
- `docs/plans/`: Historical implementation plans and architectural decisions.
