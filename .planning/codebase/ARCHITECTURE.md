# Architecture

**Analysis Date:** 2025-05-24

## Pattern Overview

**Overall:** Client-Server Monorepo with Layered Backend and Component-Based Frontend
- The system is divided into two primary applications: a React frontend (`metaskills-frontend`) and an Express/Mongoose backend (`metaskills-backend`).
- The backend follows an MVC-like layered architecture without explicit views (acts as a JSON API).
- The frontend follows a modern React architecture using functional components, context, and specialized data-fetching hooks (TanStack Query).

**Key Characteristics:**
- **Decoupled Client/Server:** The frontend is an SPA communicating with the backend via RESTful JSON APIs.
- **Lazy Loading (Frontend):** Extensive use of React's `lazy` and `Suspense` for code-splitting routes.
- **Model-Driven Backend:** Core business rules are often encapsulated in Mongoose models via static methods and pre/post hooks.

## Layers

**Backend - Routes (`metaskills-backend/routes/`):**
- Purpose: Maps HTTP endpoints to specific controller actions.
- Location: `metaskills-backend/routes/`
- Contains: Express router definitions (e.g., `user.routes.js`).
- Depends on: Controllers.
- Used by: `metaskills-backend/express.js`.

**Backend - Controllers (`metaskills-backend/controllers/`):**
- Purpose: Handles incoming request validation, business logic orchestration, and formulating HTTP responses.
- Location: `metaskills-backend/controllers/`
- Contains: Request handlers wrapped in `expressAsyncHandler` (e.g., `user.controller.js`).
- Depends on: Models, Services, Utils.
- Used by: Routes.

**Backend - Models (`metaskills-backend/models/`):**
- Purpose: Defines data schema, validation rules, and direct database interaction methods.
- Location: `metaskills-backend/models/`
- Contains: Mongoose schemas and models (e.g., `user.model.js`).
- Depends on: `mongoose`.
- Used by: Controllers, Services.

**Backend - Services (`metaskills-backend/services/`):**
- Purpose: Encapsulates complex business logic that spans multiple models or requires external API interactions.
- Location: `metaskills-backend/services/`
- Contains: Core logic modules (e.g., `math.service.js`).
- Depends on: Models, External SDKs.
- Used by: Controllers.

**Frontend - Routing & Entry (`metaskills-frontend/src/main.jsx`):**
- Purpose: Application bootstrap, router configuration, and root-level service providers.
- Location: `metaskills-frontend/src/main.jsx`
- Contains: `createBrowserRouter`, `QueryClientProvider`, lazy route definitions.
- Depends on: Pages, Layouts, Context Providers.

**Frontend - Layouts & Pages (`metaskills-frontend/src/layouts/`, `metaskills-frontend/src/pages/`):**
- Purpose: Structural wrappers and distinct views of the application.
- Location: `metaskills-frontend/src/layouts/` & `metaskills-frontend/src/pages/`
- Contains: Route-level components.
- Depends on: Components, Hooks, API calls.

**Frontend - State & Data (`metaskills-frontend/src/context/`, TanStack Query):**
- Purpose: Global state management and server-state caching.
- Location: `metaskills-frontend/src/context/`
- Contains: React Context providers (e.g., `SessionProvider.jsx`).
- Depends on: React APIs.

## Data Flow

**Standard API Request Flow:**
1. **Client Request:** Frontend invokes an API call (often via Axios inside a TanStack Query hook).
2. **Routing:** `express.js` routes the request through middlewares (e.g., rate limiting, `clientblock.js`) to the specific route file.
3. **Controller Handling:** The matched route delegates to a controller method. `expressAsyncHandler` is used to catch Promise rejections.
4. **Data Access:** The controller interacts with Mongoose Models (e.g., `User.findByIdAndUpdate`) or Services to fetch/mutate data.
5. **Response:** Controller sends a JSON response back to the client.
6. **Client State Update:** TanStack Query caches the result and triggers React component re-renders.

**State Management:**
- **Frontend Server State:** Handled heavily by `@tanstack/react-query` to manage caching, refetching, and synchronization of backend data.
- **Frontend App State:** Managed using React Context (e.g., `ModuleContext`, `SessionProvider`).

## Key Abstractions

**Async Route Handlers:**
- Purpose: To eliminate boilerplate `try/catch` blocks in Express routes for asynchronous operations.
- Examples: Extensively used across `metaskills-backend/controllers/*.js`.
- Pattern: Wrapper function (`expressAsyncHandler`).

**Model Statics & Methods:**
- Purpose: Encapsulating data-specific business logic close to the data source rather than scattering it in controllers.
- Examples: `UserSchema.statics.adjustCarrots` in `metaskills-backend/models/user.model.js`.
- Pattern: Active Record / Rich Domain Model.

**Lazy Loading & Suspense Skeletons:**
- Purpose: Optimizing frontend bundle size and providing immediate visual feedback during chunk loading.
- Examples: `metaskills-frontend/src/main.jsx` (e.g., `const DashboardLayout = lazy(...)`).
- Pattern: Code Splitting + React Suspense boundaries with skeleton fallbacks (e.g., `<DashboardSkeleton />`).

## Entry Points

**Backend Server Initializer:**
- Location: `metaskills-backend/server.js`
- Triggers: `npm start` (or `node server.js`).
- Responsibilities: Loads environment variables, connects to MongoDB, and binds the Express app to a port.

**Backend Application Definition:**
- Location: `metaskills-backend/express.js`
- Triggers: Imported by `server.js`.
- Responsibilities: Configures Express, mounts middlewares (JSON parsing, rate limiting, blocklists), maps all API routes, and attaches the global error handler.

**Frontend React Bootstrap:**
- Location: `metaskills-frontend/src/main.jsx`
- Triggers: Vite dev server or loaded via `index.html` in production.
- Responsibilities: Sets up the React Root, configures React Router, TanStack Query client, and renders the top-level providers.

## Error Handling

**Strategy:** Centralized Error Catching

**Patterns:**
- **Backend:** `expressAsyncHandler` wraps async controller functions to pass thrown errors automatically to Express's `next()` function.
- **Backend Global Handler:** A centralized middleware (`metaskills-backend/middlewares/errorHandler.js`) catches these errors and formats standard JSON error responses.
- **Frontend:** React Router's `errorElement` (e.g., `<ErrorPage />`) is defined at the root level in `main.jsx` to catch rendering and navigation errors.

## Cross-Cutting Concerns

**Logging:** Standard `console.log` and `console.error` are prevalent.
**Validation:** Mongoose schema validations are the primary line of defense (e.g., `enum`, `required`, `match` in schemas).
**Authentication:** Google OAuth2 integration (`google-auth-library` in backend, `@react-oauth/google` in frontend) with JWT-based session tokens. The backend validates tokens and attaches user details to `req.user`.

---

*Architecture analysis: 2025-05-24*
