# Codebase Structure

**Analysis Date:** 2025-05-24

## Directory Layout

```
/media/jimfleax/fedora/home/reetabratabhandari/Projects/Metaskills/
├── metaskills-backend/       # Express Backend Application
│   ├── config/               # Configuration files (DB, Env, API Keys)
│   ├── controllers/          # Route controllers handling business logic
│   ├── middlewares/          # Express middlewares (auth, rate limiting, errors)
│   ├── migrations/           # Database migration scripts
│   ├── models/               # Mongoose schema definitions
│   ├── routes/               # Express route definitions
│   ├── scripts/              # Standalone utility/admin scripts
│   ├── services/             # Core business logic services
│   ├── tests/                # Test scripts
│   └── utils/                # Helper functions (math, encryption, tokens)
├── metaskills-frontend/      # React Frontend Application
│   ├── public/               # Static assets (fonts, icons)
│   └── src/                  # React source code
│       ├── api/              # Axios instances and API utility functions
│       ├── assets/           # Images, SVGs, and other media
│       ├── components/       # Reusable React components
│       ├── context/          # React Context providers (state)
│       ├── hooks/            # Custom React hooks (including TanStack Query hooks)
│       ├── layouts/          # Route layout wrappers
│       ├── pages/            # Top-level route components
│       ├── services/         # Frontend services
│       ├── styles/           # Global styles and CSS
│       └── utils/            # Utility functions
```

## Directory Purposes

**Backend `controllers/`:**
- Purpose: Bridge between routes and models/services.
- Contains: Controller functions wrapped in async handlers.
- Key files: `user.controller.js`, `quiz.controller.js`, `admin.auth.controller.js`

**Backend `models/`:**
- Purpose: Database schemas and data-layer logic.
- Contains: Mongoose schemas.
- Key files: `user.model.js`, `Module.model.js`, `Questions.model.js`

**Backend `routes/`:**
- Purpose: API endpoint definitions.
- Contains: Express Routers.
- Key files: `user.routes.js`, `quiz.routes.js`

**Frontend `src/pages/`:**
- Purpose: Full-page views matched to specific routes.
- Contains: React functional components.
- Key files: `HomePage.jsx`, `DashboardPage.jsx`, `admin/AdminDashboardPage.jsx`

**Frontend `src/components/`:**
- Purpose: Reusable UI pieces.
- Contains: React components categorized by feature (e.g., `admin/`, `common/`, `skeletons/`).
- Key files: `ModuleList.jsx`, `MarathonQuiz.jsx`

**Frontend `src/layouts/`:**
- Purpose: Wrappers providing consistent structure to related pages.
- Contains: React components with `<Outlet />`.
- Key files: `DashboardLayout.jsx`, `AuthLayout.jsx`

## Key File Locations

**Entry Points:**
- `metaskills-backend/server.js`: Starts the backend server and DB connection.
- `metaskills-frontend/src/main.jsx`: Bootstraps the React application.

**Configuration:**
- `metaskills-backend/config/env.js`: Environment variable loader.
- `metaskills-backend/express.js`: Main Express app configuration.
- `metaskills-frontend/vite.config.js`: Vite build and dev server configuration.

**Core Logic:**
- `metaskills-backend/models/user.model.js`: Core user logic and carrot adjustments.
- `metaskills-frontend/src/App.jsx`: Global providers and layout root.

## Naming Conventions

**Files:**
- Backend routes: `[feature].routes.js` (e.g., `user.routes.js`)
- Backend models: `[Feature].model.js` or `[feature].model.js` (e.g., `Module.model.js`, `user.model.js`)
- Backend controllers: `[feature].controller.js` (e.g., `quiz.controller.js`)
- Frontend components: `PascalCase.jsx` (e.g., `ModuleCard.jsx`)
- Frontend pages: `[Feature]Page.jsx` (e.g., `HomePage.jsx`, `ModulesViewPage.jsx`)
- Frontend contexts: `[Feature]Context.jsx` or `[Feature]Provider.jsx` (e.g., `SessionProvider.jsx`)

**Directories:**
- camelCase or lowercase across both backend and frontend.
- Specialized groupings in frontend (e.g., `src/pages/admin/`).

## Where to Add New Code

**New Backend Feature (e.g., Rewards):**
- Route: `metaskills-backend/routes/rewards.routes.js`
- Controller: `metaskills-backend/controllers/rewards.controller.js`
- Model: `metaskills-backend/models/Reward.model.js`

**New Frontend Page (e.g., Leaderboard):**
- Route definition: Inside `router` in `metaskills-frontend/src/main.jsx`
- Page component: `metaskills-frontend/src/pages/LeaderboardPage.jsx`
- Data hooks: `metaskills-frontend/src/hooks/useLeaderboard.js` (if complex)

**New UI Component:**
- General component: `metaskills-frontend/src/components/common/[Name].jsx`
- Feature-specific: `metaskills-frontend/src/components/[Feature]/[Name].jsx`

---

*Structure analysis: 2025-05-24*
